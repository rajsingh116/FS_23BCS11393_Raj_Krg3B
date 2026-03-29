-- ============================================================================
-- HealthHub - Complete Appointment + Payment Flow Setup
-- ============================================================================
-- 
-- This SQL script sets up the database for the corrected appointment + payment flow:
-- 1. Create Appointment (CREATED status)
-- 2. Create Razorpay Order (via API)
-- 3. Complete Payment (via Razorpay checkout)
-- 4. Verify Signature (service layer)
-- 5. Update Appointment (SUCCESS status)
-- 6. Send Email (async)
--
-- Database: crudapi
-- ============================================================================

USE crudapi;

-- ============================================================================
-- 1. VERIFY/CREATE TABLES
-- ============================================================================

-- Add email column to patients if missing
ALTER TABLE patients ADD COLUMN email VARCHAR(255) UNIQUE;

-- Ensure payment_status field on appointments exists
-- (Should be created automatically by Hibernate, but verify)
ALTER TABLE appointments MODIFY COLUMN payment_status VARCHAR(50);

-- ============================================================================
-- 2. INSERT TEST DATA
-- ============================================================================

-- Clear existing test data (OPTIONAL - uncomment only if needed)
-- DELETE FROM appointments WHERE doctor_id IN (SELECT id FROM doctors WHERE name = 'Dr. A. Sharma');
-- DELETE FROM patients WHERE name = 'Prabhakar';
-- DELETE FROM doctors WHERE name = 'Dr. A. Sharma';

-- ---- INSERT DOCTOR ----
INSERT INTO doctors (name, specialization, experience, consultation_fee)
VALUES ('Dr. A. Sharma', 'General Consultation', 10, 500)
ON DUPLICATE KEY UPDATE experience = 10, consultation_fee = 500;

-- Get the doctor ID (usually 1 if first record, but get it from DB)
SET @doctor_id = LAST_INSERT_ID();

-- ---- INSERT PATIENT ----
INSERT INTO patients (name, age, disease, email)
VALUES ('Prabhakar', 22, 'General Checkup', 'jhaprabhakarindia@gmail.com')
ON DUPLICATE KEY UPDATE age = 22, disease = 'General Checkup';

-- Get the patient ID
SET @patient_id = LAST_INSERT_ID();

-- ---- INSERT APPOINTMENT (CREATED status - before payment) ----
INSERT INTO appointments (appointment_date, payment_status, patient_id, doctor_id)
VALUES 
  (DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'CREATED', @patient_id, @doctor_id),
  (DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'CREATED', @patient_id, @doctor_id)
ON DUPLICATE KEY UPDATE payment_status = 'CREATED';

-- ============================================================================
-- 3. VERIFY DATA WAS INSERTED
-- ============================================================================

SELECT '===== DOCTORS =====' AS section;
SELECT id, name, specialization, experience, consultation_fee FROM doctors;

SELECT '===== PATIENTS =====' AS section;
SELECT id, name, age, disease, email FROM patients;

SELECT '===== APPOINTMENTS =====' AS section;
SELECT 
  id, 
  appointment_date, 
  payment_status, 
  razorpay_order_id, 
  razorpay_payment_id, 
  patient_id, 
  doctor_id 
FROM appointments;

-- ============================================================================
-- 4. VERIFY RELATIONSHIPS (JOIN QUERY)
-- ============================================================================

SELECT 
  'APPOINTMENT_DETAILS' AS section,
  a.id AS appointment_id,
  p.name AS patient_name,
  p.email AS patient_email,
  d.name AS doctor_name,
  d.consultation_fee AS consultation_fee_rupees,
  (d.consultation_fee * 100) AS consultation_fee_paise,
  a.appointment_date,
  a.payment_status,
  COALESCE(a.razorpay_order_id, 'NULL (awaiting payment)') AS razorpay_order_id,
  COALESCE(a.razorpay_payment_id, 'NULL (awaiting payment)') AS razorpay_payment_id
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
INNER JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.id DESC;

-- ============================================================================
-- 5. SAMPLE QUERIES FOR TESTING FLOW
-- ============================================================================

-- Query 1: Get appointment ready for payment (CREATED status)
SELECT 'Query 1: Get CREATED appointment' AS test;
SELECT id, patient_id, doctor_id, appointment_date, payment_status 
FROM appointments 
WHERE payment_status = 'CREATED' 
LIMIT 1;

-- Query 2: Get patient email for appointment
SELECT 'Query 2: Get patient email' AS test;
SELECT p.email FROM patients p 
INNER JOIN appointments a ON a.patient_id = p.id
WHERE a.id = 1;

-- Query 3: Get doctor fee for appointment
SELECT 'Query 3: Get doctor fee' AS test;
SELECT d.consultation_fee FROM doctors d 
INNER JOIN appointments a ON a.doctor_id = d.id
WHERE a.id = 1;

-- Query 4: Check if appointment has payment saved (after payment)
SELECT 'Query 4: Check payment status' AS test;
SELECT id, payment_status, razorpay_order_id, razorpay_payment_id 
FROM appointments 
WHERE id = 1;

-- ============================================================================
-- 6. IMPORTANT NOTES FOR TESTING
-- ============================================================================
/*
APPOINTMENT CREATION FLOW:
1. Frontend calls: POST /api/appointments/create
   Payload: { patientId: 1, doctorId: 1, date: "2026-04-10" }
   
2. Backend creates appointment with paymentStatus='CREATED'
   Returns: { appointmentId: 1, consultationFee: 500, ... }
   
3. Frontend calls: POST /api/appointments/1/create-payment
   Backend creates Razorpay order (amount = 500 * 100 = 50000 paise)
   Returns: { razorpayOrderId: "order_xxx", amount: 50000, ... }
   
4. Frontend opens Razorpay modal and user completes payment
   Razorpay returns: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
   
5. Frontend calls: POST /api/appointments/verify-payment
   Payload: { appointmentId: 1, razorpay_order_id: "...", razorpay_payment_id: "...", razorpay_signature: "..." }
   
6. Backend verifies signature and updates:
   UPDATE appointments 
   SET payment_status = 'SUCCESS', 
       razorpay_order_id = '...', 
       razorpay_payment_id = '...'
   WHERE id = 1;
   
7. Backend sends email asynchronously (@Async) with payment confirmation
   
8. Frontend shows: "🎉 Payment Successful!"

DATABASE STATE AT EACH STAGE:
Stage 1 (After POST /create):
  payment_status = 'CREATED'
  razorpay_order_id = NULL
  razorpay_payment_id = NULL

Stage 2 (After POST /create-payment):
  payment_status = 'CREATED'
  razorpay_order_id = 'order_xxx' ← Set
  razorpay_payment_id = NULL

Stage 3 (After POST /verify-payment with valid signature):
  payment_status = 'SUCCESS' ← Updated
  razorpay_order_id = 'order_xxx'
  razorpay_payment_id = 'pay_yyy' ← Set
  
Email sent async (not stored in DB, but logged and sent to patient email)

TESTING COMMANDS:
1. Create appointment:
   curl -X POST http://localhost:8080/api/appointments/create \
   -H "Content-Type: application/json" \
   -d '{"patientId": 1, "doctorId": 1, "date": "2026-04-10"}'

2. Create Razorpay order:
   curl -X POST http://localhost:8080/api/appointments/1/create-payment \
   -H "Content-Type: application/json" \
   -d '{}'

3. Verify payment (after getting from Razorpay):
   curl -X POST http://localhost:8080/api/appointments/verify-payment \
   -H "Content-Type: application/json" \
   -d '{"appointmentId": 1, "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..."}'

4. Check DB:
   SELECT * FROM appointments WHERE id = 1;
   
EXPECTED FINAL STATE:
| id | appointment_date | payment_status | razorpay_order_id | razorpay_payment_id | patient_id | doctor_id |
| 1  | 2026-04-10       | SUCCESS        | order_xxx         | pay_yyy             | 1          | 1         |

And patient receives email at: jhaprabhakarindia@gmail.com
*/

-- ============================================================================
