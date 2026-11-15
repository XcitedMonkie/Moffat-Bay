
package moffatbay;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Handles database operations for registered guests
 * using JDBC and the existing users table.
 */
public class GuestRepository {

    /**
     * Checks whether an email address already exists.
     */
    public boolean existsByEmailIgnoreCase(String email)
            throws SQLException {

        String sql = "SELECT COUNT(*) FROM users "
                   + "WHERE LOWER(email) = LOWER(?)";

        try (Connection connection = DatabaseConnection.open();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setString(1, email);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        }

        return false;
    }

    /**
     * Inserts a new guest into the users table.
     * Returns the guest with its generated database ID.
     */
    public Guest save(Guest guest) throws SQLException {

        String sql = "INSERT INTO users "
                   + "(firstName, lastName, email, phone, passwordHash) "
                   + "VALUES (?, ?, ?, ?, ?)";

        try (Connection connection = DatabaseConnection.open();
             PreparedStatement statement =
                     connection.prepareStatement(
                         sql, Statement.RETURN_GENERATED_KEYS)) {

            statement.setString(1, guest.getFirstName());
            statement.setString(2, guest.getLastName());
            statement.setString(3, guest.getEmail());
            statement.setString(4, guest.getPhone());
            statement.setString(5, guest.getPasswordHash());

            int rowsAffected = statement.executeUpdate();

            if (rowsAffected == 0) {
                throw new SQLException("Guest registration failed.");
            }

            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    guest.setGuestId(keys.getInt(1));
                } else {
                    throw new SQLException(
                        "Registration succeeded but no ID was returned."
                    );
                }
            }
        }

        return guest;
    }
}

// package com.moffatbay.repository;

// import com.moffatbay.model.Guest;
// import org.springframework.data.jpa.repository.JpaRepository;
// import java.util.Optional;

// public interface GuestRepository extends JpaRepository<Guest, Long> {
//     boolean existsByEmailIgnoreCase(String email);
//     Optional<Guest> findByEmailIgnoreCase(String email);
// }