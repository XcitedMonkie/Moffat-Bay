/*
Amanda Brock - Vanessa Espino - Jasmine Fontus - Daniel Fryer
Assignment 4 
*/

-- Create database
CREATE DATABASE IF NOT EXISTS MoffatBay;
USE MoffatBay;

-- Create database user
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'pass';

-- Grant access
GRANT ALL PRIVILEGES ON MoffatBay.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;

-- =========================================================================
-- TABLE CREATION
-- =========================================================================

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
    typeName VARCHAR(50) NOT NULL UNIQUE,
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

-- =========================================================================
-- DYNAMIC OVERLAP PROTECTION TRIGGER
-- =========================================================================
DROP TRIGGER IF EXISTS ts_prevent_room_overlap;

DELIMITER $$

CREATE TRIGGER ts_prevent_room_overlap
BEFORE INSERT ON RESERVATIONS
FOR EACH ROW
BEGIN
    DECLARE overlap_count INT;
    DECLARE cancelled_status_id INT;

    -- Find the ID for 'Cancelled' status
    SELECT statusId INTO cancelled_status_id FROM RES_STATUS WHERE statusName = 'Cancelled';

    -- If the incoming reservation itself is Cancelled, skip overlap verification entirely
    IF NEW.statusId != cancelled_status_id THEN
        
        -- Count active bookings that overlap with the new check-in/check-out window
        SELECT COUNT(*) INTO overlap_count
        FROM RESERVATIONS
        WHERE roomId = NEW.roomId
          AND statusId != cancelled_status_id  -- Ignore existing records that are cancelled
          AND NEW.checkInDate < checkOutDate   -- New start is before old end
          AND NEW.checkOutDate > checkInDate;  -- New end is after old start

        -- If any active overlapping rows are found, block the insert
        IF overlap_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Booking conflict: The selected room is already reserved during these dates.';
        END IF;
        
    END IF;
END$$

DELIMITER ;

-- =========================================================================
-- DATA INSERTS (SAFE AGAINST DUPLICATION & RERUNS)
-- =========================================================================

-- 1. INSERT INTO USERS
INSERT IGNORE INTO USERS (firstName, lastName, email, passwordHash, phone, rowInserted) VALUES 
('Meredith', 'Grey', 'grey.sloan21@gmail.com', '$2b$12$eImiTxuWVxuM71EGbFpyU.v.gG1mU/Uu9o9gT9Gg8qCjA9f6D3XyG', '404-645-2130', NOW()),
('Derek', 'Shepherd', 'shepherd.method@yahoo.com', '$2b$12$eImiTxuWVxuM71EGbFpyU.v.gG1mU/Uu9o9gT9Gg8qCjA9f6D3XyG', '770-014-6754', NOW()),
('Addison', 'Montgomery', 'montgomery.a@gmail.com', '$2b$12$eImiTxuWVxuM71EGbFpyU.v.gG1mU/Uu9o9gT9Gg8qCjA9f6D3XyG', '706-456-9087', NOW()),
('Christina', 'Yang', 'yang.mypersonM@gmail.com', '$2b$12$eImiTxuWVxuM71EGbFpyU.v.gG1mU/Uu9o9gT9Gg8qCjA9f6D3XyG', '506-234-6703', NOW());

-- 2. INSERT INTO RES_STATUS
INSERT IGNORE INTO RES_STATUS (statusName) VALUES 
('Pending'),
('Confirmed'),
('Cancelled');

-- 3. INSERT INTO ROOMTYPES
INSERT IGNORE INTO ROOMTYPES (typeName, description, maxGuest, basePrice, isActive) VALUES 
('The Morel the Merrier', 'Inspired by the quiet beauty of the forest floor, this cozy retreat brings together warm wood tones and natural textures for a restful island escape.', 4, 126.00, TRUE),
('The Knotty Pine', 'Inspired by the warmth of reclaimed pine timber, this inviting room combines rustic textures and soft comforts for a peaceful stay surrounded by nature.', 2, 141.75, TRUE),
('The Two Hoots', 'Named for the owls that call the island home, this spacious retreat offers a cozy place to gather, unwind, and enjoy the quiet magic of the forest.', 4, 157.50, TRUE),
('The Unbe-leaf-able Suite', 'Inspired by the island''s evergreen canopy, this spacious suite blends natural elegance with luxurious comfort for a truly relaxing getaway.', 2, 168.00, TRUE);

-- 4. INSERT INTO ROOMS
INSERT IGNORE INTO ROOMS (roomTypeId, roomNumber, description, isActive) VALUES 
((SELECT roomTypeId FROM ROOMTYPES WHERE typeName = 'The Morel the Merrier'), '100', 'Cozy lodge room featuring two full beds', TRUE),
((SELECT roomTypeId FROM ROOMTYPES WHERE typeName = 'The Knotty Pine'), '200', 'Comfortable queen room with a cozy bedspread', TRUE),
((SELECT roomTypeId FROM ROOMTYPES WHERE typeName = 'The Two Hoots'), '300', 'Spacious lodge room featuring two queen beds', TRUE),
((SELECT roomTypeId FROM ROOMTYPES WHERE typeName = 'The Unbe-leaf-able Suite'), '400', 'Rustic lodge suite featuring a king bed', TRUE);

-- 5. INSERT INTO RESERVATIONS 

-- Sample Reservation 1 (Meredith Grey)
INSERT INTO RESERVATIONS (userId, roomId, checkInDate, checkOutDate, numberOfGuest, totalPrice, statusId)
SELECT u.userId, r.roomId, '2026-11-10', '2026-11-13', 3, 360.00, st.statusId
FROM USERS AS u
JOIN ROOMS AS r ON r.roomNumber = '100'
JOIN RES_STATUS AS st ON st.statusName = 'Confirmed'
WHERE u.email = 'grey.sloan21@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM RESERVATIONS AS existing
      WHERE existing.userId = u.userId
        AND existing.roomId = r.roomId
        AND existing.checkInDate = '2026-11-10'
        AND existing.checkOutDate = '2026-11-13'
  );

-- Sample Reservation 2 (Derek Shepherd)
INSERT INTO RESERVATIONS (userId, roomId, checkInDate, checkOutDate, numberOfGuest, totalPrice, statusId)
SELECT u.userId, r.roomId, '2026-12-20', '2026-12-24', 2, 540.00, st.statusId
FROM USERS AS u
JOIN ROOMS AS r ON r.roomNumber = '200'
JOIN RES_STATUS AS st ON st.statusName = 'Pending'
WHERE u.email = 'shepherd.method@yahoo.com'
  AND NOT EXISTS (
      SELECT 1 FROM RESERVATIONS AS existing
      WHERE existing.userId = u.userId
        AND existing.roomId = r.roomId
        AND existing.checkInDate = '2026-12-20'
        AND existing.checkOutDate = '2026-12-24'
  );

-- Sample Reservation 3 (Addison Montgomery)
INSERT INTO RESERVATIONS (userId, roomId, checkInDate, checkOutDate, numberOfGuest, totalPrice, statusId)
SELECT u.userId, r.roomId, '2026-11-15', '2026-11-17', 4, 300.00, st.statusId
FROM USERS AS u
JOIN ROOMS AS r ON r.roomNumber = '300'
JOIN RES_STATUS AS st ON st.statusName = 'Cancelled'
WHERE u.email = 'montgomery.a@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM RESERVATIONS AS existing
      WHERE existing.userId = u.userId
        AND existing.roomId = r.roomId
        AND existing.checkInDate = '2026-11-15'
        AND existing.checkOutDate = '2026-11-17'
  );

-- Sample Reservation 4 (Christina Yang)
INSERT INTO RESERVATIONS (userId, roomId, checkInDate, checkOutDate, numberOfGuest, totalPrice, statusId)
SELECT u.userId, r.roomId, '2026-12-04', '2026-12-08', 2, 640.00, st.statusId
FROM USERS AS u
JOIN ROOMS AS r ON r.roomNumber = '400'
JOIN RES_STATUS AS st ON st.statusName = 'Confirmed'
WHERE u.email = 'yang.mypersonM@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM RESERVATIONS AS existing
      WHERE existing.userId = u.userId
        AND existing.roomId = r.roomId
        AND existing.checkInDate = '2026-12-04'
        AND existing.checkOutDate = '2026-12-08'
  );

-- Verify records
SELECT * FROM RESERVATIONS;