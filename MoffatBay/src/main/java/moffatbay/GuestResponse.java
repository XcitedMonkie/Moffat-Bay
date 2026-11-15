
package moffatbay;

/**
 * Holds the guest information returned to the
 * frontend after successful registration.
 */
public record GuestResponse(
    int guestId,
    String first,
    String last,
    String email,
    String phone
) {}


// package com.moffatbay.dto;

// public record GuestResponse(
//     Long guestId,
//     String first,
//     String last,
//     String email,
//     String phone
// ) {}
