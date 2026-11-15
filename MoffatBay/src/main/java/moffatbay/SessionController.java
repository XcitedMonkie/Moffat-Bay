// DF - Added this to create the cookie to track the login user
package moffatbay;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;

// Handles requests to check the customer's login session.
public class SessionController implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {

        // Only allow GET requests.
        if (!exchange.getRequestMethod().equals("GET")) {
            exchange.getResponseHeaders().set("Allow", "GET");
            exchange.sendResponseHeaders(405, -1);
            exchange.close();
            return;
        }

        // Check if the browser has a valid session.
        Integer userId = SessionManager.getLoggedInUser(exchange);

        String response;

        if (userId != null) {
            try {
                // Retrieve the first name from the database.
                String firstName = userDAO.findFirstNameById(userId);

                if (firstName != null) {
                    // Gson safely converts the name into a JSON string.
                    response = "{\"loggedIn\":true,\"userId\":" + userId
                            + ",\"firstName\":"
                            + new com.google.gson.Gson().toJson(firstName) + "}";
                } else {
                    response = "{\"loggedIn\":false}";
                }

            } catch (SQLException e) {
                System.err.println("Session database error: " + e.getMessage());
                response = "{\"loggedIn\":false}";
            }
        } else {
            response = "{\"loggedIn\":false}";
        }

        // Prevent browsers from caching session information.
        exchange.getResponseHeaders().set(
            "Content-Type", "application/json; charset=utf-8"
        );

        exchange.getResponseHeaders().set(
            "Cache-Control", "no-store"
        );

        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);

        exchange.sendResponseHeaders(200, bytes.length);

        try (var output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private final UserDAO userDAO = new UserDAO();
}
