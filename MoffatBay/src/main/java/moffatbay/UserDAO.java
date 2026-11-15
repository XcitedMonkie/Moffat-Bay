
package moffatbay;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

// Handles database searches for registered users.
public class UserDAO {

    // Store the user ID and hashed password together.
    public record UserLogin(int userId, String passwordHash) {}

    // Find a registered user using their email address.
    public UserLogin findUserByEmail(String email)
            throws SQLException {

        String sql = "SELECT userId, passwordHash "
                   + "FROM USERS WHERE email = ?";

        try (Connection connection = DatabaseConnection.open();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setString(1, email);

            try (ResultSet results = statement.executeQuery()) {

                if (results.next()) {
                    return new UserLogin(
                        results.getInt("userId"),
                        results.getString("passwordHash")
                    );
                }
            }
        }

        // Return null if no matching user was found.
        return null;
    }

    // Keep Jasmine's original method for compatibility.
    public String findPasswordHashByEmail(String email)
            throws SQLException {

        UserLogin user = findUserByEmail(email);

        return user == null ? null : user.passwordHash();
    }

    
    // DF - Added this to get the user's name from the database to display on the Index page
    public String findFirstNameById(int userId) throws SQLException {

        String sql = "SELECT firstName FROM USERS WHERE userId = ?";

        try (Connection connection = DatabaseConnection.open();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, userId);

            try (ResultSet results = statement.executeQuery()) {
                if (results.next()) {
                    return results.getString("firstName");
                }
            }
        }

        return null;
    }

}
