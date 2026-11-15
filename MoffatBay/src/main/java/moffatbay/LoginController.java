package moffatbay;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;

// Handles login requests for Moffat Bay Lodge
public class LoginController implements HttpHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final UserDAO userDAO = new UserDAO();

    @Override
    public void handle(HttpExchange exchange) throws IOException {

        // Only allow POST requests
        if (!exchange.getRequestMethod().equals("POST")) {
            sendResponse(exchange, 405, "Method not allowed");
            return;
        }

        // Read the email and password sent by JavaScript
        Map<String, String> login;

        try {
            login = mapper.readValue(
                exchange.getRequestBody(),
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {}
            );
        } catch (IOException e) {
            sendResponse(exchange, 400, "Invalid login request");
            return;
        }

        if (login == null) {
            sendResponse(exchange, 400, "Email and password are required");
            return;
        }

        String email = login.get("email");
        String password = login.get("password");

        if (email == null || email.isBlank()
                || password == null || password.isEmpty()) {
            sendResponse(exchange, 400, "Email and password are required");
            return;
        }

        try {
            // Look up the user's stored password hash
            String storedHash = userDAO.findPasswordHashByEmail(email);
            UserDAO.UserLogin user = userDAO.findUserByEmail(email);

            boolean valid = false;

            if (storedHash != null) {
                try {
                    valid = BCrypt.checkpw(password, storedHash);
                } catch (IllegalArgumentException e) {
                    // The stored hash is not in a supported format
                    valid = false;
                }
            }

            if (user != null) {
                try {
                    valid = BCrypt.checkpw(password, user.passwordHash());
                } catch (IllegalArgumentException e) {
                    // The stored hash is not in a supported format
                    valid = false;
                }
            }

            if (valid) {
                SessionManager.createSession(exchange, user.userId());
                sendResponse(exchange, 200, "Login successful");
            } else {
                sendResponse(exchange, 401, "Invalid email or password");
            }

        } catch (SQLException e) {
            System.err.println("Login database error: " + e.getMessage());
            sendResponse(exchange, 500, "Server error");
        }
    }

    // Send a response back to the login page
    private void sendResponse(HttpExchange exchange, int status, String message)
            throws IOException {

        byte[] response = message.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
            "Content-Type", "text/plain; charset=UTF-8"
        );

        exchange.getResponseHeaders().set(
            "Cache-Control", "no-store"
        );

        exchange.sendResponseHeaders(status, response.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(response);
        }
    }
}