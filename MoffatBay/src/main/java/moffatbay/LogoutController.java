package moffatbay;
import com.sun.net.httpserver.*;
import java.io.IOException;
/** Session invalidation: only POST is accepted. */
public final class LogoutController implements HttpHandler {
    @Override public void handle(HttpExchange e) throws IOException {
        if(!e.getRequestMethod().equals("POST")) {
            e.sendResponseHeaders(405, -1);
            e.close();
            return;
        }
        String origin = e.getRequestHeaders().getFirst("Origin"), host = e.getRequestHeaders().getFirst("Host");
        if(origin!=null && !origin.equals("http://"+host) && !origin.equals("https://"+host)) {
            e.sendResponseHeaders(403, -1);
            e.close();
            return;
        }
        SessionManager.logout(e);
        e.getResponseHeaders().set("Cache-Control", "no-store");
        e.sendResponseHeaders(204, -1);
        e.close();
    }
}
