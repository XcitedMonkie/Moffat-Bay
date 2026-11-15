
package moffatbay;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

// Handles database searches for registered users
public class UserDAO {

    // Find a user's stored password hash using their email
    public String findPasswordHashByEmail(String email)
            throws SQLException {

        String sql = "SELECT passwordHash FROM USERS WHERE email = ?";

        try (Connection connection = DatabaseConnection.open();
             PreparedStatement statement =
                 connection.prepareStatement(sql)) {

            statement.setString(1, email);

            try (ResultSet results = statement.executeQuery()) {

                if (results.next()) {
                    return results.getString("passwordHash");
                }
            }
        }

        // No matching email was found
        return null;
    }
}
