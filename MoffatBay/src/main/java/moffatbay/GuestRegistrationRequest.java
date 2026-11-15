
package moffatbay;

/**
 * Holds the information submitted by a guest
 * when registering for a Moffat Bay Lodge account.
 */
public record GuestRegistrationRequest(
    String first,
    String last,
    String email,
    String phone,
    String password
) {}

// package com.moffatbay.dto;

// import jakarta.validation.constraints.Email;
// import jakarta.validation.constraints.NotBlank;
// import jakarta.validation.constraints.Size;

// public record GuestRegistrationRequest(
//     @NotBlank(message = "First name is required")
//     String first,

//     @NotBlank(message = "Last name is required")
//     String last,

//     @NotBlank(message = "Email is required")
//     @Email(message = "Invalid email format")
//     String email,

//     @NotBlank(message = "Phone number is required")
//     String phone,

//     @NotBlank(message = "Password is required")
//     @Size(min = 8, message = "Password must be at least 8 characters")
//     String password
// ) {}