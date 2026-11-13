package moffatbay;
import com.sun.net.httpserver.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.stream.Collectors;

public final class RoomTypeController implements HttpHandler {
    private final RoomTypeDAO dao = new RoomTypeDAO();
    @Override public void handle(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestURI().getPath().equals("/api/room-types")) {
            send(exchange, 404, "{\"error\":\"Not found\"}"); return;
        }
        if (!exchange.getRequestMethod().equals("GET")) {
            exchange.getResponseHeaders().set("Allow", "GET");
            send(exchange, 405, "{\"error\":\"Method not allowed\"}"); return;
        }
        try {
            String json = dao.findActive().stream().map(RoomTypeController::json)
                .collect(Collectors.joining(",", "[", "]"));
            send(exchange, 200, json);
        } catch (SQLException e) {
            System.err.println("Room catalog database error: " + e.getMessage());
            send(exchange, 503, "{\"error\":\"Room catalog temporarily unavailable\"}");
        }
    }
    private static String json(RoomType r) {
        return "{\"roomTypeId\":" + r.roomTypeId() + ",\"typeName\":" + quote(r.typeName())
            + ",\"description\":" + quote(r.description()) + ",\"maxGuest\":" + r.maxGuest()
            + ",\"basePrice\":" + r.basePrice().toPlainString() + "}";
    }
    private static String quote(String value) {
        if (value == null) return "null";
        StringBuilder b = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 32) b.append(String.format("\\u%04x", (int)c));
            else b.append(c);
        }
        return b.append('"').toString();
    }
    private static void send(HttpExchange e, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        e.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        e.getResponseHeaders().set("Cache-Control", "no-store");
        e.sendResponseHeaders(status, bytes.length);
        try (var out = e.getResponseBody()) { out.write(bytes); }
    }
}
