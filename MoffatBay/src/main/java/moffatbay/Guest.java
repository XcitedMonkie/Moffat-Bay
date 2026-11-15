

package moffatbay;

/**
 * Represents a registered user in the
 * Moffat Bay Lodge database.
 */
public class Guest {

    private int guestId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String passwordHash;

    // Default constructor
    public Guest() {
    }

    // Constructor with all fields
    public Guest(int guestId, String firstName,
                 String lastName, String email,
                 String phone, String passwordHash) {

        this.guestId = guestId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.passwordHash = passwordHash;
    }

    // Getters and Setters

    public int getGuestId() {
        return guestId;
    }

    public void setGuestId(int guestId) {
        this.guestId = guestId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}


// package com.moffatbay.model;

// import jakarta.persistence.*;
// import java.time.LocalDateTime;

// @Entity
// @Table(name = "guests")
// public class Guest {

//     @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     @Column(name = "guest_id")
//     private Long guestId;

//     @Column(name = "first_name", nullable = false, length = 50)
//     private String firstName;

//     @Column(name = "last_name", nullable = false, length = 50)
//     private String lastName;

//     @Column(nullable = false, unique = true, length = 100)
//     private String email;

//     @Column(nullable = false, length = 20)
//     private String phone;

//     @Column(name = "password_hash", nullable = false)
//     private String passwordHash;

//     @Column(name = "created_at", updatable = false)
//     private LocalDateTime createdAt = LocalDateTime.now();

//     // Getters and Setters
//     public Long getGuestId() { return guestId; }
//     public void setGuestId(Long guestId) { this.guestId = guestId; }

//     public String getFirstName() { return firstName; }
//     public void setFirstName(String firstName) { this.firstName = firstName; }

//     public String getLastName() { return lastName; }
//     public void setLastName(String lastName) { this.lastName = lastName; }

//     public String getEmail() { return email; }
//     public void setEmail(String email) { this.email = email; }

//     public String getPhone() { return phone; }
//     public void setPhone(String phone) { this.phone = phone; }

//     public String getPasswordHash() { return passwordHash; }
//     public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

//     public LocalDateTime getCreatedAt() { return createdAt; }
// }