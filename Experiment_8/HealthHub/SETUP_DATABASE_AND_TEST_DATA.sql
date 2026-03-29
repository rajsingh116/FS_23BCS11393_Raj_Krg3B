-- ============================================================================
-- HealthHub Payment System - Database Setup & Test Data
-- ============================================================================
-- This SQL script:
-- 1. Creates all tables (if not exist)
-- 2. Inserts test data (Doctor, Patient)
-- 3. Provides verification queries to check flow status
--
-- Flow Overview:
-- Stage 1: Create Appointment (POST /api/appointments/create)
--          → Backend saves appointment with paymentStatus='CREATED'
--          → Database: INSERT INTO appointments
-- 
-- Stage 2: Create Razorpay Order (POST /api/payment/{id}/create-payment)
--          → Backend fetches appointment
--          → Creates Razorpay order via API
--          → Database: UPDATE razorpay_order_id
--
-- Stage 3: User Pays on Razorpay Modal
--          → User completes payment (test card: 4111 1111 1111 1111)
--          
-- Stage 4: Verify Payment (POST /api/payment/verify-payment)
--          → Backend verifies signature
--          → Database: UPDATE paymentStatus='SUCCESS', razorpay_payment_id
--          → Email sent async to patient
-- ============================================================================

USE crudapi;

-- ============================================================================
-- STEP 1: CREATE TABLES (if they don't exist)
-- ============================================================================

-- Table: doctors
-- Stores doctor information including consultation fees
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `experience` int DEFAULT NULL,
  `consultation_fee` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_specialization` (`specialization`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: patients
-- Stores patient information including email (required for notifications)
CREATE TABLE IF NOT EXISTS `patients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `age` int DEFAULT NULL,
  `disease` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `doctor_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_disease` (`disease`),
  KEY `fk_doctor_id` (`doctor_id`),
  CONSTRAINT `fk_patients_doctor_id` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: appointments
-- Stores appointment bookings with payment tracking
-- paymentStatus values: CREATED (before payment) → SUCCESS (after verification) or FAILED (invalid sig)
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `appointment_date` date DEFAULT NULL,
  `payment_intent_id` varchar(255) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT 'CREATED' COMMENT 'CREATED, SUCCESS, FAILED',
  `razorpay_order_id` varchar(255) DEFAULT NULL COMMENT 'Razorpay order ID from API response',
  `razorpay_payment_id` varchar(255) DEFAULT NULL COMMENT 'Razorpay payment ID from frontend',
  `patient_id` bigint DEFAULT NULL,
  `doctor_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_doctor_id` (`doctor_id`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `fk_appointments_doctor_id` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `fk_appointments_patient_id` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- STEP 2: INSERT TEST DATA
-- ============================================================================

-- Insert Doctor: Dr. A. Sharma (Consultation Fee: ₹500)
-- Doctor ID: 1
INSERT IGNORE INTO `doctors` (`id`, `name`, `specialization`, `experience`, `consultation_fee`)
VALUES (1, 'Dr. A. Sharma', 'General Medicine', 5, 500);

-- Insert Patient: Prabhakar (Email: jhaprabhakarindia@gmail.com)
-- Patient ID: 1
INSERT IGNORE INTO `patients` (`id`, `name`, `age`, `disease`, `email`, `doctor_id`)
VALUES (1, 'Prabhakar', 28, 'Fever', 'jhaprabhakarindia@gmail.com', 1);

-- ============================================================================
-- STEP 3: VERIFY TEST DATA (Run these queries to verify setup)
-- ============================================================================

-- Check if doctors table is populated
SELECT 'DOCTORS TABLE' as info;
SELECT id, name, specialization, experience, consultation_fee FROM doctors;

-- Check if patients table is populated
SELECT 'PATIENTS TABLE' as info;
SELECT id, name, age, disease, email, doctor_id FROM patients;

-- Check if appointments table is empty (should have 0 rows before any booking)
SELECT 'APPOINTMENTS TABLE (should be empty initially)' as info;
SELECT COUNT(*) as appointment_count FROM appointments;

-- ============================================================================
-- STEP 4: FLOW TEST QUERIES (Run after each API call to verify state)
-- ============================================================================

-- After Stage 1 (Create Appointment):
-- Expected: ONE appointment with paymentStatus='CREATED'
-- Query:
-- SELECT * FROM appointments WHERE id = 1;
-- Expected result:
--   id: 1
--   payment_status: 'CREATED'
--   razorpay_order_id: NULL (not yet)
--   razorpay_payment_id: NULL (not yet)

-- After Stage 2 (Create Razorpay Order):
-- Expected: razorpay_order_id populated
-- Query:
-- SELECT id, payment_status, razorpay_order_id, razorpay_payment_id FROM appointments WHERE id = 1;
-- Expected result:
--   id: 1
--   payment_status: 'CREATED'
--   razorpay_order_id: 'order_xxx...' (populated)
--   razorpay_payment_id: NULL (not yet)

-- After Stage 4 (Verify Payment & Email):
-- Expected: paymentStatus='SUCCESS', razorpay_payment_id populated
-- Query:
-- SELECT id, payment_status, razorpay_order_id, razorpay_payment_id FROM appointments WHERE id = 1;
-- Expected result:
--   id: 1
--   payment_status: 'SUCCESS'
--   razorpay_order_id: 'order_xxx...'
--   razorpay_payment_id: 'pay_yyy...'

-- ============================================================================
-- STEP 5: CLEANUP (Run if you want to reset and test again)
-- ============================================================================

-- DELETE FROM appointments WHERE id > 0;
-- DELETE FROM patients WHERE id > 1;
-- DELETE FROM doctors WHERE id > 1;
-- ALTER TABLE appointments AUTO_INCREMENT = 1;
-- ALTER TABLE patients AUTO_INCREMENT = 1;
-- ALTER TABLE doctors AUTO_INCREMENT = 1;
