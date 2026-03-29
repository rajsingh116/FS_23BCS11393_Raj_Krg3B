-- ============================================================================
-- HealthHub - Complete SQL Setup & Test Data
-- ============================================================================
-- This script sets up the database schema and inserts test data for 
-- the Razorpay payment + SMTP email notification system.
--
-- Database: crudapi (as configured in application.properties)
-- Run this script in MySQL before testing the application.
-- ============================================================================

USE crudapi;

-- ============================================================================
-- 1. SCHEMA VERIFICATION & CREATION
-- ============================================================================
-- If tables don't exist, they will be auto-created by Hibernate (ddl-auto=update)
-- But ensure the email column exists in patients table:

-- Check if email column exists; if not, add it
ALTER TABLE patients ADD COLUMN email VARCHAR(255) NOT NULL UNIQUE;

-- Ensure indexes for performance
ALTER TABLE doctors ADD INDEX idx_specialization (specialization);
ALTER TABLE appointments ADD INDEX idx_patient_id (patient_id);
ALTER TABLE appointments ADD INDEX idx_doctor_id (doctor_id);
ALTER TABLE appointments ADD INDEX idx_payment_status (payment_status);

-- ============================================================================
-- 2. CLEAR EXISTING TEST DATA (OPTIONAL - Run only if you want to reset)
-- ============================================================================
-- UNCOMMENT ONLY IF YOU WANT TO RESET:
-- DELETE FROM appointments;
-- DELETE FROM patients;
-- DELETE FROM doctors;
-- DELETE FROM doctor;  -- if table is named doctor (singular)

-- ============================================================================
-- 3. INSERT TEST DATA
-- ============================================================================

-- ---- 3.1 Insert Doctor ----
INSERT INTO doctors (name, specialization, experience, consultation_fee)
VALUES ('Dr. A. Sharma', 'General Consultation', 10, 500);

-- Get the doctor ID (usually 1 if it's the first record, but verify)
-- Query: SELECT * FROM doctors ORDER BY id DESC LIMIT 1;

-- ---- 3.2 Insert Patient ----
INSERT INTO patients (name, age, disease, email, doctor_id)
VALUES ('Prabhakar', 22, 'General Checkup', 'jhaprabhakarindia@gmail.com', 1);

-- ---- 3.3 Insert Appointment ----
-- Create an appointment linked to the patient and doctor (for payment testing)
INSERT INTO appointments (appointment_date, payment_intent_id, payment_status, razorpay_order_id, razorpay_payment_id, patient_id, doctor_id)
VALUES ('2026-04-10', NULL, 'CREATED', NULL, NULL, 1, 1);

-- ============================================================================
-- 4. VERIFY DATA INSERTION
-- ============================================================================
-- Run these queries to verify your data:

-- View all doctors
SELECT 'DOCTORS' AS table_name;
SELECT id, name, specialization, experience, consultation_fee FROM doctors;

-- View all patients
SELECT 'PATIENTS' AS table_name;
SELECT id, name, age, disease, email FROM patients;

-- View all appointments
SELECT 'APPOINTMENTS' AS table_name;
SELECT id, appointment_date, payment_status, razorpay_order_id, razorpay_payment_id, patient_id, doctor_id FROM appointments;

-- ============================================================================
-- 5. VERIFY RELATIONSHIPS
-- ============================================================================
-- Test JOIN queries to ensure relationships are correct:

SELECT 
  a.id AS appointment_id,
  p.name AS patient_name,
  p.email AS patient_email,
  d.name AS doctor_name,
  d.consultation_fee AS consultation_fee,
  a.appointment_date,
  a.payment_status
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
INNER JOIN doctors d ON a.doctor_id = d.id;

-- ============================================================================
-- 6. TEST DATA FOR ADDITIONAL APPOINTMENTS (OPTIONAL)
-- ============================================================================
-- If you want to test with multiple appointments, insert more doctors and patients:

-- Insert more doctors
INSERT INTO doctors (name, specialization, experience, consultation_fee)
VALUES 
  ('Dr. B. Patel', 'Cardiology', 15, 1000),
  ('Dr. C. Verma', 'Pediatrics', 8, 400),
  ('Dr. D. Singh', 'Orthopedics', 12, 750);

-- Insert more patients
INSERT INTO patients (name, age, disease, email, doctor_id)
VALUES 
  ('Rajesh Kumar', 35, 'Heart Condition', 'rajesh.k@example.com', 2),
  ('Priya Sharma', 6, 'Fever', 'priya.parent@example.com', 3),
  ('Amit Singh', 45, 'Back Pain', 'amit.s@example.com', 4);

-- Insert appointments for new patients
INSERT INTO appointments (appointment_date, payment_status, patient_id, doctor_id)
VALUES 
  ('2026-04-12', 'CREATED', 2, 2),
  ('2026-04-15', 'CREATED', 3, 3),
  ('2026-04-20', 'CREATED', 4, 4);

-- ============================================================================
-- 7. IMPORTANT NOTES
-- ============================================================================
-- 
-- a) Table Names:
--    - Verify your actual table names in the database. They should be:
--      - doctors (or doctor, depending on your Entity naming)
--      - patients
--      - appointments
--
-- b) Email Column:
--    - The email column must exist and be unique (for your Patient entity).
--    - If this query fails: ALTER TABLE patients ADD COLUMN ...
--    - It means the column already exists (which is fine).
--
-- c) Appointment Date:
--    - Use future dates (e.g., '2026-04-10') for realistic testing.
--
-- d) Payment Status:
--    - Valid values: 'CREATED', 'SUCCESS', 'FAILED'
--    - Start with 'CREATED' for each new appointment to test the payment flow.
--
-- e) Razorpay Fields:
--    - razorpay_order_id: Populated when Razorpay order is created (via POST /api/appointments/{id}/create-payment)
--    - razorpay_payment_id: Populated when payment is verified (after user completes checkout)
--    - These are NULL initially and filled during the payment flow.
--
-- ============================================================================
