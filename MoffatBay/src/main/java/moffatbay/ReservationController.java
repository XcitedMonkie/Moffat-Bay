package moffatbay;
import com.sun.net.httpserver.*;
import com.google.gson.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
/** Booking, authenticated history and anonymous exact-code lookup on the existing server. */
public final class ReservationController implements HttpHandler {
    private final Gson gson = new Gson();
    private final ReservationDAO dao = new ReservationDAO();
    private static final Map<String, long[]> SEARCH_LIMIT = new ConcurrentHashMap<>();
    @Override public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        if(path.equals("/api/reservations") && method.equals("POST")) {
            create(exchange);
            return;
        }
        if(path.equals("/api/reservations/mine") && method.equals("GET")) {
            mine(exchange);
            return;
        }
        if(path.equals("/api/reservations/lookup") && method.equals("POST")) {
            lookup(exchange);
            return;
        }
        send(exchange, 404, Map.of("error", "Not found"));
    }
    private void mine(HttpExchange e) throws IOException {
        Integer user = SessionManager.getLoggedInUser(e);
        if(user==null) {
            send(e, 401, Map.of("error", "Please log in."));
            return;
        }
        try {
            send(e, 200, Map.of("reservations", dao.forUser(user)));
        }
        catch(SQLException err) {
            System.err.println("History DB error: "+err.getMessage());
            send(e, 503, Map.of("error", "Reservation history unavailable."));
        }
    }
    private void create(HttpExchange e) throws IOException {
        Integer user = SessionManager.getLoggedInUser(e);
        if(user==null) {
            send(e, 401, Map.of("error", "Please log in before booking."));
            return;
        }
        if(!sameOrigin(e)) {
            send(e, 403, Map.of("error", "Origin not allowed"));
            return;
        }
        try {
            JsonObject obj = body(e);
            String key = value(obj, "roomId");
            if(key.equals("pine"))key = "knotty";
            int guests = obj.get("guests").getAsInt();
            LocalDate start = LocalDate.parse(value(obj, "checkIn"));
            LocalDate end = LocalDate.parse(value(obj, "checkOut"));
            send(e, 201, Map.of("reservation", dao.create(user, key, guests, start, end)));
        }
        catch(ReservationDAO.BookingError err) {
            send(e, err.status, Map.of("error", err.getMessage()));
        }
        catch(SQLException err) {
            System.err.println("Booking DB error: "+err.getMessage());
            send(e, 503, Map.of("error", "Unable to save reservation."));
        }
        catch(Exception err) {
            send(e, 400, Map.of("error", "Please check the reservation details."));
        }
    }
    private void lookup(HttpExchange e) throws IOException {
        if(!sameOrigin(e)) {
            send(e, 403, Map.of("error", "Origin not allowed"));
            return;
        }
        // Basic limit for local prototype; production should use a shared reverse-proxy limiter.
        String client = e.getRemoteAddress().getAddress().getHostAddress();
        long now = System.currentTimeMillis();
        synchronized(SEARCH_LIMIT) {
            long[] limit = SEARCH_LIMIT.computeIfAbsent(client, k->new long[] {
                now, 0
            }
            );
            if(now-limit[0]>60000) {
                limit[0] = now;
                limit[1] = 0;
            }
            if(++limit[1]>12) {
                send(e, 429, Map.of("error", "Too many attempts. Try again in a minute."));
                return;
            }
        }
        try {
            JsonObject obj = body(e);
            String code = value(obj, "reference").trim().toUpperCase(Locale.ROOT);
            String email = value(obj, "email").trim().toLowerCase(Locale.ROOT);
            if(!code.matches("MBL-[A-F0-9]{12}") || email.length()>255 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                send(e, 400, Map.of("error", "Enter the confirmation code and booking email."));
                return;
            }
            Map<String, Object> found = dao.publicLookup(code, email);
            if(found==null)send(e, 404, Map.of("error", "No matching reservation found. Check both details."));
            else send(e, 200, Map.of("reservation", found));
        }
        catch(SQLException err) {
            System.err.println("Lookup DB error: "+err.getMessage());
            send(e, 503, Map.of("error", "Lookup temporarily unavailable."));
        }
        catch(Exception err) {
            send(e, 400, Map.of("error", "Invalid search details."));
        }
    }
    private static boolean sameOrigin(HttpExchange e) {
        String origin = e.getRequestHeaders().getFirst("Origin");
        if(origin==null)return true;
        String host = e.getRequestHeaders().getFirst("Host");
        return origin.equals("http://"+host)||origin.equals("https://"+host);
    }
    private JsonObject body(HttpExchange e) throws IOException {
        String type = e.getRequestHeaders().getFirst("Content-Type");
        if(type==null||!type.toLowerCase(Locale.ROOT).startsWith("application/json"))throw new IOException("Expected JSON");
        byte[] raw = e.getRequestBody().readNBytes(16_385);
        if(raw.length>16_384)throw new IOException("Too long");
        return JsonParser.parseString(new String(raw, StandardCharsets.UTF_8)).getAsJsonObject();
    }
    private static String value(JsonObject o, String name) {
        if(!o.has(name)||o.get(name).isJsonNull())return "";
        return o.get(name).getAsString();
    }
    private void send(HttpExchange e, int status, Object data) throws IOException {
        byte[] raw = gson.toJson(data).getBytes(StandardCharsets.UTF_8);
        e.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        e.getResponseHeaders().set("Cache-Control", "no-store");
        e.sendResponseHeaders(status, raw.length);
        try(OutputStream out = e.getResponseBody()) {
            out.write(raw);
        }
    }
}
