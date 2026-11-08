CREATE DATABASE IF NOT EXISTS nsproperties CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nsproperties;
CREATE TABLE IF NOT EXISTS admin_users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(80) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS properties (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(120) NOT NULL,
 listing_type ENUM('buy','rent','commercial','new-project') NOT NULL,
 category VARCHAR(80) NOT NULL,
 locality VARCHAR(120) NOT NULL,
 city VARCHAR(120) NOT NULL,
 address VARCHAR(500) NOT NULL,
 state VARCHAR(100) NOT NULL,
 pincode CHAR(6) NOT NULL,
 price DECIMAL(15,2) NOT NULL,
 area DECIMAL(12,2) NOT NULL,
 bhk SMALLINT UNSIGNED DEFAULT 0,
 bathrooms SMALLINT UNSIGNED DEFAULT 0,
 availability VARCHAR(80) NOT NULL DEFAULT 'Ready to Move',
 description TEXT NOT NULL,
 amenities JSON,
 image_urls JSON,
 contact_name VARCHAR(120) NOT NULL,
 contact_phone CHAR(10) NOT NULL,
 contact_email VARCHAR(254) NOT NULL,
 status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 approved_at TIMESTAMP NULL,
 INDEX idx_status_created (status,created_at),
 INDEX idx_listing (status,listing_type,category)
);
CREATE TABLE IF NOT EXISTS enquiries (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 property_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(120) NOT NULL,
 phone CHAR(10) NOT NULL,
 email VARCHAR(254),
 enquiry_type VARCHAR(60) NOT NULL,
 message TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);
