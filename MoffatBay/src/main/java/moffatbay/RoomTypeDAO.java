package moffatbay;
import java.sql.*;
import java.util.*;

public final class RoomTypeDAO {
    public List<RoomType> findActive() throws SQLException {
        String sql = "SELECT roomTypeId, typeName, description, maxGuest, basePrice "
                   + "FROM ROOMTYPES WHERE isActive = TRUE ORDER BY roomTypeId";
        List<RoomType> rooms = new ArrayList<>();
        try (Connection connection = DatabaseConnection.open();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet rs = statement.executeQuery()) {
            while (rs.next()) rooms.add(new RoomType(rs.getInt("roomTypeId"),
                rs.getString("typeName"), rs.getString("description"),
                rs.getInt("maxGuest"), rs.getBigDecimal("basePrice")));
        }
        return rooms;
    }
}
