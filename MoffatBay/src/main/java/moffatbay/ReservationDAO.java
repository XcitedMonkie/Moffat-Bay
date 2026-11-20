package moffatbay;
import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
/** All reservation queries use the existing MySQL database, not browser or server memory. */
public final class ReservationDAO {
    public static final class BookingError extends Exception {
        public final int status;
        public BookingError(int status, String message) {
            super(message);
            this.status = status;
        }
    }
    private static final Map<String, String> TYPES = Map.of(
    "morel", "The Morel the Merrier", "knotty", "The Knotty Pine",
    "hoots", "The Two Hoots", "suite", "The Unbe-leaf-able Suite");
    private static final Map<String, String> KEYS = Map.of(
    "The Morel the Merrier", "morel", "The Knotty Pine", "knotty",
    "The Two Hoots", "hoots", "The Unbe-leaf-able Suite", "suite");
    private static final Map<String, String> SIZES = Map.of(
    "morel", "300 sq. ft.", "knotty", "275 sq. ft.",
    "hoots", "360 sq. ft.", "suite", "420 sq. ft.");
    private static Map<String, Object> booking(ResultSet rs) throws SQLException {
        String name = rs.getString("typeName");
        String key = KEYS.getOrDefault(name, "");
        LocalDate arrival = rs.getDate("checkInDate").toLocalDate();
        LocalDate departure = rs.getDate("checkOutDate").toLocalDate();
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("reservationId", rs.getInt("reservationId"));
        item.put("confirmationCode", rs.getString("confirmationCode"));
        item.put("roomKey", key);
        item.put("roomName", name);
        item.put("roomSize", SIZES.getOrDefault(key, "See room details"));
        item.put("guests", rs.getInt("numberOfGuest"));
        item.put("checkIn", arrival.toString());
        item.put("checkOut", departure.toString());
        item.put("nights", ChronoUnit.DAYS.between(arrival, departure));
        item.put("totalPrice", rs.getBigDecimal("totalPrice"));
        item.put("status", rs.getString("statusName"));
        // Email and customer identity are deliberately NOT included in public results.
        return item;
    }
    private static final String SELECT = "SELECT b.reservationId,b.confirmationCode,t.typeName," +
    "b.numberOfGuest,b.checkInDate,b.checkOutDate,b.totalPrice,s.statusName " +
    "FROM RESERVATIONS b JOIN ROOMS r ON r.roomId=b.roomId " +
    "JOIN ROOMTYPES t ON t.roomTypeId=r.roomTypeId " +
    "JOIN RES_STATUS s ON s.statusId=b.statusId ";
    /** Authenticated history; no email or user ID supplied by the browser. */
    public List<Map<String, Object>> forUser(int userId) throws SQLException {
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection c = DatabaseConnection.open(); PreparedStatement ps = c.prepareStatement(
        SELECT + "WHERE b.userId=? ORDER BY b.checkInDate DESC,b.reservationId DESC")) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(booking(rs));
            }
        }
        return result;
    }
    /** Anonymous lookup always needs both an unguessable reference AND its email. */
    public Map<String, Object> publicLookup(String code, String email) throws SQLException {
        try (Connection c = DatabaseConnection.open(); PreparedStatement ps = c.prepareStatement(
        SELECT + "JOIN USERS u ON u.userId=b.userId " +
        "WHERE b.confirmationCode=? AND LOWER(u.email)=LOWER(?)")) {
            ps.setString(1, code);
            ps.setString(2, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next()?booking(rs):null;
            }
        }
    }
    /** Lock the inventory rows to serialize concurrent bookings of this room type. */
    public Map<String, Object> create(int userId, String roomKey, int guests, LocalDate arrival, LocalDate departure)
    throws SQLException, BookingError {
        String name = TYPES.get(roomKey);
        if (name==null) throw new BookingError(400, "Please select a valid room type.");
        if (guests<1 || arrival.isBefore(LocalDate.now()) || !departure.isAfter(arrival)
        || ChronoUnit.DAYS.between(arrival, departure)>365)
        throw new BookingError(400, "Check the dates and number of guests.");
        try(Connection c = DatabaseConnection.open()) {
            c.setAutoCommit(false);
            try {
                int typeId, capacity;
                BigDecimal nightly;
                try (PreparedStatement ps = c.prepareStatement("SELECT roomTypeId,maxGuest,basePrice FROM ROOMTYPES WHERE typeName=? AND isActive=1")) {
                    ps.setString(1, name);
                    try(ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) throw new BookingError(404, "Room type not available.");
                        typeId = rs.getInt(1);
                        capacity = rs.getInt(2);
                        nightly = rs.getBigDecimal(3);
                    }
                }
                if(guests>capacity) throw new BookingError(400, "This room allows up to "+capacity+" guests.");
                List<Integer> physicalRooms = new ArrayList<>();
                try(PreparedStatement ps = c.prepareStatement("SELECT roomId FROM ROOMS WHERE roomTypeId=? AND isActive=1 ORDER BY roomId FOR UPDATE")) {
                    ps.setInt(1, typeId);
                    try(ResultSet rs = ps.executeQuery()) {
                        while(rs.next()) physicalRooms.add(rs.getInt(1));
                    }
                }
                int available = -1;
                String overlap = "SELECT COUNT(*) FROM RESERVATIONS b JOIN RES_STATUS s ON s.statusId=b.statusId " +
                "WHERE b.roomId=? AND s.statusName <> 'Cancelled' AND b.checkInDate<? AND b.checkOutDate>?";
                for(int physical:physicalRooms) {
                    try(PreparedStatement ps = c.prepareStatement(overlap)) {
                        ps.setInt(1, physical);
                        ps.setDate(2, java.sql.Date.valueOf(departure));
                        ps.setDate(3, java.sql.Date.valueOf(arrival));
                        try(ResultSet rs = ps.executeQuery()) {
                            rs.next();
                            if(rs.getInt(1)==0) {
                                available = physical;
                                break;
                            }
                        }
                    }
                }
                if(available<0) throw new BookingError(409, "No rooms available for those dates.");
                int statusId;
                try(PreparedStatement ps = c.prepareStatement("SELECT statusId FROM RES_STATUS WHERE statusName='Confirmed'")) {
                    try(ResultSet rs = ps.executeQuery()) {
                        if(!rs.next()) throw new SQLException("Missing Confirmed status");
                        statusId = rs.getInt(1);
                    }
                }
                String code = "MBL-"+UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
                BigDecimal total = nightly.multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(arrival, departure)));
                int id;
                try(PreparedStatement ps = c.prepareStatement("INSERT INTO RESERVATIONS " +
                "(userId,roomId,checkInDate,checkOutDate,numberOfGuest,totalPrice,statusId,confirmationCode) " +
                "VALUES(?,?,?,?,?,?,?,?)", Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, userId);
                    ps.setInt(2, available);
                    ps.setDate(3, java.sql.Date.valueOf(arrival));
                    ps.setDate(4, java.sql.Date.valueOf(departure));
                    ps.setInt(5, guests);
                    ps.setBigDecimal(6, total);
                    ps.setInt(7, statusId);
                    ps.setString(8, code);
                    ps.executeUpdate();
                    try(ResultSet ids = ps.getGeneratedKeys()) {
                        if(!ids.next())throw new SQLException("No generated ID");
                        id = ids.getInt(1);
                    }
                }
                c.commit();
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("reservationId", id);
                item.put("confirmationCode", code);
                item.put("roomKey", roomKey);
                item.put("roomName", name);
                item.put("roomSize", SIZES.get(roomKey));
                item.put("checkIn", arrival.toString());
                item.put("checkOut", departure.toString());
                item.put("guests", guests);
                item.put("nights", ChronoUnit.DAYS.between(arrival, departure));
                item.put("totalPrice", total);
                item.put("status", "Confirmed");
                return item;
            }
            catch(SQLException|BookingError|RuntimeException ex) {
                c.rollback();
                throw ex;
            }
        }
    }
}
