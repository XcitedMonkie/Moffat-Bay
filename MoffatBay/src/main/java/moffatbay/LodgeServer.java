package moffatbay;
import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.*;
import java.util.Set;

public final class LodgeServer {
    public static void main(String[] args) throws IOException {
        Path root = Path.of(".").toRealPath();
        System.out.println("Website root: " + root);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 7070), 0);
        server.createContext("/api/room-types", new RoomTypeController());
        server.createContext("/api/guests/register", new GuestController());
        server.createContext("/api/login", new LoginController());
        // Allow the website to check the customer's login session.
        server.createContext("/api/session", new SessionController());
        server.createContext("/", e -> serve(e, root));
        server.start();
        System.out.println("Moffat Bay Lodge: http://localhost:7070/");
    }
    private static void serve(HttpExchange e, Path root) throws IOException {
        String path = e.getRequestURI().getPath();
        if (path.equals("/")) path = "/index.html";
            Path file = root.resolve(path.substring(1)).normalize();
            String relative = root.relativize(file).toString().replace('\\', '/');
            boolean allowed = Set.of("index.html", "about.html", "attractions.html", "contact.html", "login.html", "register.html", "reservation.html").contains(relative)
                || relative.startsWith("css/") || relative.startsWith("js/") || relative.startsWith("images/") || relative.startsWith("reservation-test/");
        if (!e.getRequestMethod().equals("GET")) { e.sendResponseHeaders(405, -1); e.close(); return; }
        if (!file.startsWith(root) || !allowed || !Files.isRegularFile(file) || !file.toRealPath().startsWith(root)) {
            e.sendResponseHeaders(404, -1); e.close(); return;
        }
        String extension = relative.substring(relative.lastIndexOf('.') + 1);
        String mime = switch (extension) {
            case "html" -> "text/html; charset=utf-8"; case "css" -> "text/css; charset=utf-8";
            case "js" -> "text/javascript; charset=utf-8"; case "svg" -> "image/svg+xml";
            case "png" -> "image/png"; case "jpg", "jpeg" -> "image/jpeg"; case "webp" -> "image/webp";
            default -> null;
        };
        if (mime == null) { e.sendResponseHeaders(404, -1); e.close(); return; }
            e.getResponseHeaders().set("Content-Type", mime);
            e.sendResponseHeaders(200, Files.size(file));
        try (var out = e.getResponseBody()) { Files.copy(file, out); }
    }
}
