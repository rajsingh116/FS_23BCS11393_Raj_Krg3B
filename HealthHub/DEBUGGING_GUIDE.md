# HealthHub Payment System - Debugging Guide

## 🔧 Quick Debugging Checklist

### Backend Issues

#### ❌ Error: "Ambiguous mapping" on startup
```
Caused by: java.lang.IllegalStateException: Ambiguous mapping. 
Cannot map 'appointmentController' method to GET /api/appointments/{id}
```
**Status:** ✅ **FIXED** - RazorpayController now uses `/api/payment/*` endpoints instead of `/api/appointments/*`

**Verification:**
```bash
# Check RazorpayController uses /api/payment base path
grep -n "@RequestMapping" src/main/java/com/healthHub/controller/RazorpayController.java
# Should show: @RequestMapping("/api/payment")

# Check AppointmentController uses /api/appointments base path
grep -n "@RequestMapping" src/main/java/com/healthHub/controller/AppointmentController.java
# Should show: @RequestMapping("/api/appointments")
```

---

#### ❌ Error: "Appointment not found" at Stage 2
**Logs show:** `Appointment not found: 999`
**Cause:** Wrong appointmentId or appointment never created in Stage 1

**Debug Steps:**
```bash
# 1. Check if appointment exists in database
mysql -u root -p -e "USE crudapi; SELECT * FROM appointments WHERE id = 999;"
# If NO results → appointment not created

# 2. Check Stage 1 response in browser DevTools
# Network tab → POST /api/appointments/create → Response
# Should contain: "appointmentId": 1 (or actual ID)

# 3. Verify you're using CORRECT appointmentId
# Stage 1 returns: { "appointmentId": 1, ... }
# Stage 2 should send: POST /api/payment/1/create-payment
```

**Resolution:**
- ✅ Ensure Stage 1 CREATE endpoint returns correct appointmentId
- ✅ Copy-paste appointmentId from Stage 1 response to Stage 2 request
- ✅ Check browser console for JavaScript errors

---

#### ❌ Error: "Signature mismatch" at Stage 4
**Logs show:** `Verifying signature. Payload='order_xxx|pay_yyy' generatedHex='abc123' incoming='def456'`
**Cause:** Razorpay key_secret is wrong or signature calculation failed

**Debug Steps:**
```bash
# 1. Verify Razorpay credentials in application.properties
grep razorpay /HealthHub/src/main/resources/application.properties
# Should show:
#   razorpay.key_id=rzp_test_SUtmFpZbeLLdGw
#   razorpay.key_secret=4qCtGrD63whhZnfMViwnoEbN

# 2. Check test keys are correct
# Login to Razorpay Dashboard:
# Settings → API Keys → Copy Test Key ID & Test Key Secret

# 3. Verify backend received correct signature from frontend
# Check logs for incoming signature value

# 4. Test manual signature calculation
# Order ID: order_LdxXgQ1e9lpxYz
# Payment ID: pay_LdyCrJSvF57eS2
# Expected signature calculated backend-side (in logs)
# Actual signature from frontend (in logs)
# If different → frontend sending wrong data
```

**Resolution:**
- ✅ Use CORRECT Razorpay test keys from dashboard
- ✅ Verify frontend passes exact signature from Razorpay modal
- ✅ Check order_id and payment_id match exactly (case-sensitive)

---

#### ❌ Error: "No patient email configured"
**Logs show:** `No patient email configured for appointment 1 - skipping email`
**Cause:** Patient record doesn't have email set

**Debug Steps:**
```bash
# 1. Check patient record
mysql -u root -p -e "USE crudapi; SELECT id, name, email FROM patients WHERE id = 1;"
# If email is NULL or empty → need to update

# 2. Update patient email
mysql -u root -p -e "USE crudapi; UPDATE patients SET email = 'jhaprabhakarindia@gmail.com' WHERE id = 1;"

# 3. Verify update
mysql -u root -p -e "USE crudapi; SELECT email FROM patients WHERE id = 1;"
```

**Resolution:**
- ✅ Ensure patient email is set in database
- ✅ For test data, use: jhaprabhakarindia@gmail.com
- ✅ Email must be valid format (pass Spring's @Email validation)

---

#### ❌ Error: "Failed to send email" (retrying)
**Logs show:** `Failed to send payment confirmation email to X@Y.com: ... (will retry)`
**Cause:** SMTP connection failed (wrong credentials, Gmail 2FA, etc.)

**Debug Steps:**
```bash
# 1. Check SMTP configuration
grep spring.mail /HealthHub/src/main/resources/application.properties
# Should show:
#   spring.mail.host=smtp.gmail.com
#   spring.mail.port=587
#   spring.mail.username=kundanjeeindia@gmail.com
#   spring.mail.password=umohxruduohrkato  (app-specific password)

# 2. Generate Gmail App-Specific Password
# - Open Gmail: myaccount.google.com/security
# - Enable 2-Factor Authentication (if not already)
# - Generate App-Specific Password for "Mail" on "macOS"
# - Copy exact password (no spaces)
# - Update application.properties

# 3. Test SMTP connection
# Telnet to Gmail:
telnet smtp.gmail.com 587
# Type: STARTTLS
# Then: quit

# 4. Check retry attempts in logs
# Logs show: "will retry" message
# After 3 failed attempts (2s, 4s, 8s backoff), email is abandoned
```

**Resolution for Gmail:**
- ✅ Enable 2-Factor Authentication on Gmail account
- ✅ Generate App-Specific Password (not regular password)
- ✅ Update `spring.mail.password` with exact app-specific password
- ✅ Restart backend application
- ✅ Check logs show "Payment confirmation email sent to..."

---

### Database Issues

#### ❌ Problem: Appointments table is EMPTY
**Symptom:** `SELECT COUNT(*) FROM appointments;` returns 0
**Causes:**
1. Stage 1 create endpoint not called
2. Stage 1 failed validation (patient/doctor not found)
3. Database INSERT failed

**Debug Steps:**
```bash
# 1. Verify test data exists
mysql -u root -p -e "USE crudapi; SELECT COUNT(*) FROM doctors; SELECT COUNT(*) FROM patients;"
# Must both show: 1 (at minimum)

# 2. Check patient table structure
mysql -u root -p -e "USE crudapi; DESCRIBE patients;"
# Must have: id, name, age, disease, email, doctor_id

# 3. Check appointment table structure
mysql -u root -p -e "USE crudapi; DESCRIBE appointments;"
# Must include: id, appointment_date, payment_status, razorpay_order_id, razorpay_payment_id, patient_id, doctor_id

# 4. Check logs for Stage 1 errors
# Backend logs should show: "Creating appointment for patient 1 with doctor 1..."

# 5. Test Stage 1 endpoint manually
curl -X POST http://localhost:8080/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{"patientId": 1, "doctorId": 1, "date": "2026-04-10"}'
# Should return: { "appointmentId": X, ... }

# 6. Verify appointment was actually inserted
mysql -u root -p -e "USE crudapi; SELECT * FROM appointments;"
```

**Resolution:**
- ✅ Run SQL setup: `mysql -u root -p < SETUP_DATABASE_AND_TEST_DATA.sql`
- ✅ Verify test data: `SELECT * FROM doctors; SELECT * FROM patients;`
- ✅ Test Stage 1 manually with curl command above
- ✅ Check backend logs for exact error messages

---

#### ❌ Problem: Foreign Key Constraint Violation
**Error:** `Caused by: java.sql.SQLIntegrityConstraintViolationException: Cannot add or update a child row`
**Cause:** Trying to create appointment with non-existent patient_id or doctor_id

**Debug Steps:**
```bash
# 1. Verify foreign keys exist
mysql -u root -p -e "USE crudapi; SELECT id FROM doctors WHERE id = 1;"
mysql -u root -p -e "USE crudapi; SELECT id FROM patients WHERE id = 1;"
# Both must return 1 row

# 2. Check foreign key constraints
mysql -u root -p -e "USE crudapi; SHOW CREATE TABLE appointments\G"
# Should show CONSTRAINT for patient_id and doctor_id

# 3. Re-run setup SQL
mysql -u root -p < SETUP_DATABASE_AND_TEST_DATA.sql
```

**Resolution:**
- ✅ Ensure doctor (ID 1) and patient (ID 1) exist in database
- ✅ Use POST /api/appointments/create with patientId=1, doctorId=1
- ✅ Re-run setup SQL if constraints broken

---

### Frontend Issues

#### ❌ Error: "npm run dev: command not found"
**Cause:** Node.js or npm not installed, or wrong directory

**Debug Steps:**
```bash
# 1. Check if npm installed
which npm
npm --version
# Should show version number

# 2. Check if in right directory
pwd
# Should end with: .../Experiment_8/frontend

# 3. Check if node_modules exists
ls -la node_modules | head -5
# If doesn't exist: npm install

# 4. Check package.json
cat package.json | grep -A 2 '"scripts"'
# Should show: "dev": "vite"
```

**Resolution:**
- ✅ Install Node.js if needed: `brew install node`
- ✅ Navigate to frontend directory: `cd frontend`
- ✅ Run `npm install` if node_modules missing
- ✅ Run `npm run dev`

---

#### ❌ Frontend shows "Appointment created but payment failed"
**Cause:** Stage 1 succeeded, Stage 2 failed

**Debug Steps:**
```bash
# 1. Check browser DevTools → Network tab
# POST /api/payment/1/create-payment → Check Response
# Should show: { "razorpayOrderId": "order_...", ... }
# If error: check error message in Response

# 2. Check backend logs
# Should show: "Creating Razorpay payment order for appointment 1"

# 3. Check Razorpay API credentials
# Verify key_id is correct (starts with rzp_test_)

# 4. Check appointment exists in database
mysql -u root -p -e "USE crudapi; SELECT * FROM appointments WHERE id = 1;"
# Must exist with doctor_id populated (so fee can be calculated)
```

**Resolution:**
- ✅ Verify Razorpay test keys in application.properties
- ✅ Check appointment has doctor_id (needed to calculate fee)
- ✅ Check backend logs for "Creating Razorpay order..." message
- ✅ See RazorpayService.createOrderForAppointment() in code

---

#### ❌ Frontend shows "Payment verified but no success page"
**Cause:** API returned error or frontend not handling response

**Debug Steps:**
```bash
# 1. Check browser DevTools → Console
# Look for JavaScript errors

# 2. Check Network tab → POST /api/payment/verify-payment
# Response should be: { "status": "success" }
# If different: check response details

# 3. Check backend logs for verify-payment
# Should show: "Verifying payment for appointment 1..."
# Then: either "Payment verified successfully" or "signature mismatch"

# 4. Check if email was sent async
# Wait 5-10 seconds, check logs for: "Payment confirmation email sent to..."
```

**Resolution:**
- ✅ Check Network response is `{ "status": "success" }`
- ✅ Check browser console for JavaScript errors
- ✅ Wait 5-10 seconds for async email
- ✅ Check backend logs for verify-payment messages

---

### Logs & Monitoring

#### How to Enable Detailed Logging

**1. Backend Logs (Spring Boot)**
```properties
# Add to application.properties
logging.level.root=INFO
logging.level.com.healthHub=DEBUG
logging.level.org.springframework.web=DEBUG
logging.level.org.springframework.mail=DEBUG

# Show SQL queries
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

**2. View Backend Logs**
```bash
cd HealthHub
mvn spring-boot:run 2>&1 | tee app.log
# Logs saved to app.log and displayed on screen
```

**3. View Specific Logs**
```bash
# Search for appointment creation
tail -f app.log | grep "Creating appointment"

# Search for payment verification
tail -f app.log | grep "Verifying payment"

# Search for email sending
tail -f app.log | grep "Payment confirmation email"
```

**4. Frontend Styling (Browser DevTools)**
- Press `F12` on frontend
- Network tab: Monitor API calls
- Console: Check JavaScript errors
- Application tab → Local Storage: Check stored data

---

## 🧪 Manual Testing Commands

### Test Create Appointment (Stage 1)
```bash
curl -X POST http://localhost:8080/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "doctorId": 1,
    "date": "2026-04-10"
  }'
```

### Test Create Razorpay Order (Stage 2)
```bash
# First get appointmentId from Stage 1 response (e.g., 1)
curl -X POST http://localhost:8080/api/payment/1/create-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000}'
```

### Test Get Appointment Status
```bash
curl http://localhost:8080/api/appointments/1
```

### Test Get Payment Status
```bash
curl http://localhost:8080/api/payment/status/1
```

---

## 🎯 Quick Fix Matrix

| Issue | Solution |
|-------|----------|
| Ambiguous mapping error | ✅ Already fixed - RazorpayController uses /api/payment |
| Appointment not found at Stage 2 | Ensure Stage 1 succeeded, check appointmentId |
| Signature mismatch | Verify Razorpay credentials, check key_secret |
| Email not sent | Set patient email, generate Gmail app-specific password |
| Appointments table empty | Run Stage 1, verify patient/doctor IDs exist |
| Frontend payment failed | Check Razorpay order creation in backend logs |

---

## 📞 Support Summary

**Key Files to Check:**
1. Backend logs: `mvn spring-boot:run` console output
2. Database: `mysql -u root -p -e "USE crudapi; SELECT ..."`
3. Browser DevTools: Network tab for API responses
4. Configuration: `application.properties` for credentials

**Key Logs to Search:**
- "Creating appointment": Stage 1 progress
- "Creating Razorpay order": Stage 2 progress
- "Verifying signature": Stage 4 progress
- "Payment confirmation email sent": Stage 5 success

**Email Confirmations:**
- Check jhaprabhakarindia@gmail.com inbox
- Subject: "Payment Confirmation - Appointment X"
- May take 5-10 seconds to arrive (async processing)
