package moffatbay;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public final class DatabaseConnection {
    private DatabaseConnection() {}
    public static Connection open() throws SQLException {
        String url = System.getenv().getOrDefault("MBL_DB_URL", "jdbc:mysql://localhost:3306/MoffatBay");
        String user = System.getenv().getOrDefault("MBL_DB_USER", "admin");
        //String password = System.getenv("MBL_DB_PASSWORD");
        String password = "pass";
        if (password == null) throw new SQLException("Set MBL_DB_PASSWORD before starting the server.");

        try {
        Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL JDBC driver not found", e);
        }

        return DriverManager.getConnection(url, user, password);
        //return DriverManager.getConnection(url, user, password);
    }
}
