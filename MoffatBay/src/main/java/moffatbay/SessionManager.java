
package moffatbay;

import com.sun.net.httpserver.HttpExchange;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class SessionManager {

    // Store active sessions on the server.
    private static final Map<String, Session> sessions =
            new ConcurrentHashMap<>();

    // Generate unpredictable session identifiers.
    private static final SecureRandom random = new SecureRandom();

    // Sessions expire after 30 minutes.
    private static final long SESSION_TIMEOUT =
            30 * 60 * 1000L;

    // Store the user ID and session expiration time.
    private record Session(int userId, long expiresAt) {}

    // Prevent creating instances of this utility class.
    private SessionManager() {}

    // Create a session after a successful login.
    public static void createSession(
            HttpExchange exchange, int userId) {

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);

        String sessionId = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);

        long expiresAt =
                System.currentTimeMillis() + SESSION_TIMEOUT;

        sessions.put(sessionId, new Session(userId, expiresAt));

        // HttpOnly prevents JavaScript from reading the cookie.
        // SameSite=Lax reduces cross-site request risks.
        // For HTTPS deployments, also add the Secure attribute.
        exchange.getResponseHeaders().add(
                "Set-Cookie",
                "MBL_SESSION=" + sessionId
                + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=1800"
        );
    }

    // Return the user ID for a valid session.
    public static Integer getLoggedInUser(HttpExchange exchange) {

        String cookieHeader =
                exchange.getRequestHeaders().getFirst("Cookie");

        if (cookieHeader == null) {
            return null;
        }

        for (String cookie : cookieHeader.split(";")) {

            String[] parts = cookie.trim().split("=", 2);

            if (parts.length != 2 ||
                    !parts[0].equals("MBL_SESSION")) {
                continue;
            }

            String sessionId = parts[1];
            Session session = sessions.get(sessionId);

            if (session == null) {
                return null;
            }

            if (System.currentTimeMillis() > session.expiresAt()) {
                sessions.remove(sessionId);
                return null;
            }

            return session.userId();
        }

        return null;
    }

    // Remove the session when the customer logs out.
    public static void logout(HttpExchange exchange) {

        String cookieHeader =
                exchange.getRequestHeaders().getFirst("Cookie");

        if (cookieHeader != null) {
            for (String cookie : cookieHeader.split(";")) {

                String[] parts = cookie.trim().split("=", 2);

                if (parts.length == 2 &&
                        parts[0].equals("MBL_SESSION")) {
                    sessions.remove(parts[1]);
                    break;
                }
            }
        }

        // Tell the browser to delete the session cookie.
        exchange.getResponseHeaders().add(
                "Set-Cookie",
                "MBL_SESSION=; HttpOnly; SameSite=Lax; "
                + "Path=/; Max-Age=0"
        );
    }
}
