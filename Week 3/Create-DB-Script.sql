
-- Create database
CREATE DATABASE IF NOT EXISTS MoffatBay;
USE MoffatBay;

-- Create database user
CREATE USER IF NOT EXISTS 'admin'@'localhost'
IDENTIFIED BY 'pass';

-- Grant access
GRANT ALL PRIVILEGES ON MoffatBay.*
TO 'admin'@'localhost';

-- USERS TABLE
CREATE TABLE IF NOT EXISTS USERS (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    rowInserted DATETIME 
);

-- RES_STATUS TABLE
CREATE TABLE IF NOT EXISTS RES_STATUS (
    statusId INT AUTO_INCREMENT PRIMARY KEY,
    statusName VARCHAR(50) NOT NULL UNIQUE
);

-- ROOMTYPES TABLE
CREATE TABLE IF NOT EXISTS ROOMTYPES (
    roomTypeId INT AUTO_INCREMENT PRIMARY KEY,
    typeName VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    maxGuest INT NOT NULL,
    basePrice DECIMAL(10,2) NOT NULL,
    isActive BOOLEAN DEFAULT TRUE
);

-- ROOMS TABLE
CREATE TABLE IF NOT EXISTS ROOMS (
    roomId INT AUTO_INCREMENT PRIMARY KEY,
    roomTypeId INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    isActive BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_room_roomtype
        FOREIGN KEY (roomTypeId)
        REFERENCES ROOMTYPES(roomTypeId)
);

-- RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS RESERVATIONS (
    reservationId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    roomId INT NOT NULL,
    checkInDate DATE NOT NULL,
    checkOutDate DATE NOT NULL,
    numberOfGuest INT NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    statusId INT NOT NULL,
    rowInserted DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_user
        FOREIGN KEY (userId)
        REFERENCES USERS(userId),

    CONSTRAINT fk_reservation_room
        FOREIGN KEY (roomId)
        REFERENCES ROOMS(roomId),

    CONSTRAINT fk_reservation_status
        FOREIGN KEY (statusId)
        REFERENCES RES_STATUS(statusId),

    CONSTRAINT chk_reservation_dates
        CHECK (checkOutDate > checkInDate)
);


-- Show tables to make sure it all got created
SHOW TABLES;
