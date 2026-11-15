
package moffatbay;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import org.mindrot.jbcrypt.BCrypt;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Locale;

/**
 * Handles guest registration requests.
 */
public class GuestController implements HttpHandler {

    private final GuestRepository repository = new GuestRepository();
    private final Gson gson = new Gson();

    @Override
    public void handle(HttpExchange exchange) throws IOException {

        if (!exchange.getRequestURI().getPath()
                .equals("/api/guests/register")) {
            send(exchange, 404, "{\"error\":\"Not found\"}");
            return;
        }

        if (!exchange.getRequestMethod().equals("POST")) {
            exchange.getResponseHeaders().set("Allow", "POST");
            send(exchange, 405,
                "{\"error\":\"Method not allowed\"}");
            return;
        }

        try {
            String body = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
            );

            GuestRegistrationRequest req =
                gson.fromJson(body, GuestRegistrationRequest.class);

            if (req == null ||
                isBlank(req.first()) ||
                isBlank(req.last()) ||
                isBlank(req.email()) ||
                isBlank(req.phone()) ||
                isBlank(req.password())) {

                sendError(exchange, 400,
                    "All registration fields are required.");
                return;
            }

            String email = req.email().trim()
                .toLowerCase(Locale.ROOT);

            if (!email.matches(
                    "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {

                sendError(exchange, 400,
                    "Invalid email address.");
                return;
            }

            if (req.password().length() < 8) {
                sendError(exchange, 400,
                    "Password must be at least 8 characters.");
                return;
            }

            if (req.first().trim().length() > 100 ||
                req.last().trim().length() > 100 ||
                email.length() > 255 ||
                req.phone().trim().length() > 20) {

                sendError(exchange, 400,
                    "One or more fields exceed the allowed length.");
                return;
            }

            if (repository.existsByEmailIgnoreCase(email)) {
                sendError(exchange, 409,
                    "An account with this email already exists.");
                return;
            }

            Guest guest = new Guest();
            guest.setFirstName(req.first().trim());
            guest.setLastName(req.last().trim());
            guest.setEmail(email);
            guest.setPhone(req.phone().trim());

            // Hash the password before storing it.
            String hash = BCrypt.hashpw(
                req.password(), BCrypt.gensalt(12)
            );
            guest.setPasswordHash(hash);

            Guest saved = repository.save(guest);

            GuestResponse response = new GuestResponse(
                saved.getGuestId(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getEmail(),
                saved.getPhone()
            );

            send(exchange, 201, gson.toJson(response));

        } catch (JsonParseException | IllegalStateException e) {
            sendError(exchange, 400,
                "Invalid registration request.");
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) {
                sendError(exchange, 409,
                    "An account with this email already exists.");
            } else {
                System.err.println(
                    "Registration database error: " + e.getMessage()
                );
                sendError(exchange, 503,
                    "Registration temporarily unavailable.");
            }
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void sendError(
            HttpExchange exchange, int status, String message)
            throws IOException {

        send(exchange, status,
            gson.toJson(java.util.Map.of("error", message)));
    }

    private static void send(
            HttpExchange exchange, int status, String body)
            throws IOException {

        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
            "Content-Type", "application/json; charset=utf-8"
        );
        exchange.getResponseHeaders().set(
            "Cache-Control", "no-store"
        );

        exchange.sendResponseHeaders(status, bytes.length);

        try (var out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }
}


// package com.moffatbay.controller;

// import com.moffatbay.dto.GuestRegistrationRequest;
// import com.moffatbay.dto.GuestResponse;
// import com.moffatbay.model.Guest;
// import com.moffatbay.repository.GuestRepository;
// import jakarta.validation.Valid;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.web.bind.annotation.*;

// import java.util.Map;

// @RestController
// @RequestMapping("/api/guests")
// public class GuestController {

//     private final GuestRepository guestRepository;
//     private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

//     public GuestController(GuestRepository guestRepository) {
//         this.guestRepository = guestRepository;
//     }

//     @PostMapping("/register")
//     public ResponseEntity<?> registerGuest(@Valid @RequestBody GuestRegistrationRequest req) {
//         if (guestRepository.existsByEmailIgnoreCase(req.email().trim())) {
//             return ResponseEntity
//                 .status(HttpStatus.CONFLICT)
//                 .body(Map.of("error", "An account with this email already exists."));
//         }

//         Guest guest = new Guest();
//         guest.setFirstName(req.first().trim());
//         guest.setLastName(req.last().trim());
//         guest.setEmail(req.email().trim().toLowerCase());
//         guest.setPhone(req.phone().trim());
//         guest.setPasswordHash(passwordEncoder.encode(req.password()));

//         Guest saved = guestRepository.save(guest);

//         GuestResponse response = new GuestResponse(
//             saved.getGuestId(),
//             saved.getFirstName(),
//             saved.getLastName(),
//             saved.getEmail(),
//             saved.getPhone()
//         );

//         return ResponseEntity.status(HttpStatus.CREATED).body(response);
//     }
// }