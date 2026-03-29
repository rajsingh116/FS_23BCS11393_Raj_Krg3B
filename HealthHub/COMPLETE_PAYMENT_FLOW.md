# HealthHub Payment System - Complete Flow Guide

## 📋 Quick Overview

This document explains the **complete end-to-end payment flow** from appointment creation to email notification.

**Key Fix:** Appointment MUST be created and saved in the database BEFORE payment processing.

---

## 🔄 Complete Flow (5 Stages)

### Stage 1: Create Appointment in Database ✅

**Endpoint:** `POST /api/appointments/create`

**What Happens:**
1. Frontend sends: patient ID, doctor ID, appointment date
2. Backend validates patient and doctor exist
3. Backend creates Appointment entity with `paymentStatus="CREATED"`
4. **CRITICAL:** Saves appointment to database
5. Returns appointment ID to frontend

**Request:**
```json
{
  "patientId": 1,
  "doctorId": 1,
  "date": "2026-04-10"
}
```

**Response:**
```json
{
  "appointmentId": 1,
  "patientName": "Prabhakar",
  "doctorName": "Dr. A. Sharma",
  "consultationFee": 500,
  "appointmentDate": "2026-04-10"
}
```

**Database State After Stage 1:**
```
appointments table:
┌─────────────────────────────────────────────────────────────┐
│ id │ patient_id │ doctor_id │ payment_status │ razorpay_order_id │
├────┼────────────┼───────────┼────────────────┼───────────────────┤
│ 1  │ 1          │ 1         │ CREATED        │ NULL              │
└─────────────────────────────────────────────────────────────┘
```

**Debugging:** Check database
```bash
mysql -u root -p -e "USE crudapi; SELECT * FROM appointments WHERE id = 1;"
# Expected: paymentStatus = CREATED, razorpay_order_id = NULL
```

---

### Stage 2: Create Razorpay Order 🔐

**Endpoint:** `POST /api/payment/{appointmentId}/create-payment`

**What Happens:**
1. Backend fetches the appointment from database
2. Calculates amount from `doctor.consultationFee`
3. Calls Razorpay API to create an order
4. Stores `razorpay_order_id` in database
5. Returns order details to frontend

**Request:**
```json
{
  "amount": 50000  // Optional: paise (₹500 = 50000 paise)
}
```

**Response:**
```json
{
  "razorpayOrderId": "order_LdxXgQ1e9lpxYz",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_SUtmFpZbeLLdGw"
}
```

**What Razorpay API Does:**
- Creates an order on Razorpay servers
- Order ID is valid for 30 minutes
- User can complete payment within this time

**Database State After Stage 2:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ id │ patient_id │ payment_status │ razorpay_order_id                  │
├────┼────────────┼────────────────┼────────────────────────────────────┤
│ 1  │ 1          │ CREATED        │ order_LdxXgQ1e9lpxYz (populated!)  │
└──────────────────────────────────────────────────────────────────────┘
```

**Debugging:** Check Razorpay order creation
```bash
# Check logs for:
# "Creating Razorpay order for appointment 1 with amount 50000 paise"
# "Razorpay create order response for appointment 1: {...}"
```

---

### Stage 3: User Completes Payment on Razorpay Modal 💳

**What Happens:**
1. Frontend opens Razorpay payment modal
2. Frontend passes:
   - `razorpayOrderId` (from Stage 2)
   - `keyId` (merchant key)
3. User enters payment details or uses test card
4. Razorpay processes payment
5. **Razorpay returns to frontend:**
   - `razorpay_payment_id` (e.g., "pay_LdyCrJSvF57eS2")
   - `razorpay_signature` (HMAC-SHA256 signature)

**Test Card:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)

**Frontend JavaScript Example:**
```javascript
const options = {
  key: "rzp_test_SUtmFpZbeLLdGw",        // keyId from Stage 2 response
  amount: 50000,                          // Amount in paise
  currency: "INR",
  order_id: "order_LdxXgQ1e9lpxYz",      // razorpayOrderId from Stage 2
  handler: function(response) {
    // Payment successful, send to backend for verification
    verifyPayment({
      appointmentId: appointmentId,
      razorpay_order_id: "order_LdxXgQ1e9lpxYz",
      razorpay_payment_id: response.razorpay_payment_id,    // from Razorpay
      razorpay_signature: response.razorpay_signature       // from Razorpay
    });
  }
};
const rzp = new Razorpay(options);
rzp.open();
```

**No Database Changes Yet** - Waiting for backend verification.

---

### Stage 4: Verify Payment Signature on Backend ✔️

**Endpoint:** `POST /api/payment/verify-payment`

**What Happens:**
1. Frontend sends payment details to backend
2. Backend calculates expected HMAC-SHA256 signature:
   - Input: `razorpay_order_id|razorpay_payment_id`
   - Key: `razorpay.key_secret` (from environment)
   - Algorithm: HMAC-SHA256
3. Backend compares calculated signature with incoming signature
4. If valid:
   - Updates `paymentStatus = "SUCCESS"`
   - Stores `razorpay_payment_id` in database
   - **Triggers email service (async)**
5. If invalid:
   - Updates `paymentStatus = "FAILED"`
   - Returns error to frontend

**Request:**
```json
{
  "appointmentId": 1,
  "razorpay_order_id": "order_LdxXgQ1e9lpxYz",
  "razorpay_payment_id": "pay_LdyCrJSvF57eS2",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a..."
}
```

**Response (Success):**
```json
{
  "status": "success"
}
```

**Response (Failure):**
```json
{
  "status": "failed",
  "reason": "signature_mismatch"
}
```

**Database State After Stage 4 (Success):**
```
┌───────────────────────────────────────────────────────────────────────────┐
│ id │ patient_id │ payment_status │ razorpay_order_id │ razorpay_payment_id │
├────┼────────────┼────────────────┼───────────────────┼─────────────────────┤
│ 1  │ 1          │ SUCCESS ✅     │ order_Ldx...      │ pay_LdyCr... ✅     │
└───────────────────────────────────────────────────────────────────────────┘
```

**Debugging:** Check signature verification
```bash
# Check logs for:
# "Verifying signature. Payload='order_xxx|pay_yyy' generatedHex='abc123' incoming='abc123'"
# "Payment verified successfully for appointment 1"
```

---

### Stage 5: Send Email Notification 📧

**What Happens:**
1. Backend's `RazorpayService.verifyAndNotify()` creates email DTO:
   ```java
   PaymentEmailDTO dto = new PaymentEmailDTO();
   dto.setPatientName("Prabhakar");
   dto.setPatientEmail("jhaprabhakarindia@gmail.com");
   dto.setTransactionId("pay_LdyCrJSvF57eS2");
   dto.setAmountInPaise(50000);
   dto.setAppointmentId(1);
   ```

2. Calls `EmailServiceImpl.sendPaymentConfirmation(dto)`
   - Marked with `@Async` → runs in background thread
   - Marked with `@Retryable` → retries 3 times if fails (2s, 4s, 8s backoff)

3. Email service:
   - Processes Thymeleaf template `payment-confirmation.html`
   - Connects to Gmail SMTP (smtp.gmail.com:587)
   - Sends HTML email to patient

4. **No Database Changes** - Email tracking is in logs only

**Debugging:** Check email sending
```bash
# Check logs for:
# "Sending email to jhaprabhakarindia@gmail.com for appointment 1..."
# "Payment confirmation email sent to jhaprabhakarindia@gmail.com for appointment 1"
```

**Check Inbox:**
- Gmail: jhaprabhakarindia@gmail.com
- Email subject: "Payment Confirmation - Appointment 1"
- Contains: Patient name, doctor name, amount, appointment date

---

## 🧪 Complete End-to-End Test

### Prerequisites
1. MySQL database running with test data inserted
2. Backend running on `http://localhost:8080`
3. Frontend running on `http://localhost:5173`
4. SMTP credentials configured in `application.properties`
5. Razorpay test keys configured

### Step-by-Step Test

**Step 1: Setup Database**
```bash
cd HealthHub
mysql -u root -p < SETUP_DATABASE_AND_TEST_DATA.sql
```

**Step 2: Start Backend**
```bash
cd HealthHub
mvn clean package
mvn spring-boot:run
# Wait for: "Started HealthHubApplication in X seconds"
```

**Step 3: Start Frontend**
```bash
cd frontend
npm run dev
# Should show: "VITE v5.x.x  ready in X ms"
```

**Step 4: Open Browser and Create Appointment**
- Navigate to `http://localhost:5173`
- Click "Book Appointment"
- Select:
  - Patient: "Prabhakar" (Patient ID: 1)
  - Doctor: "Dr. A. Sharma" (Doctor ID: 1)
  - Date: Any future date
- Click "Confirm"
- **Check database:**
  ```bash
  mysql -u root -p -e "USE crudapi; SELECT * FROM appointments;"
  # Expected: id=2 (or next), paymentStatus=CREATED
  ```

**Step 5: Click "Pay Securely"**
- Razorpay modal opens
- Use test card: `4111 1111 1111 1111`
- Any future expiry (e.g., 12/25)
- Any CVV (e.g., 123)
- Click "Pay ₹500"

**Step 6: Verify Payment**
- Page should show "Payment successful!"
- **Check database:**
  ```bash
  mysql -u root -p -e "USE crudapi; SELECT * FROM appointments WHERE id = 2;"
  # Expected: paymentStatus=SUCCESS, razorpay_payment_id populated
  ```

**Step 7: Check Email (Wait ~5-10 seconds)**
- Open Gmail: jhaprabhakarindia@gmail.com
- **Check for email:**
  - Subject: "Payment Confirmation - Appointment 2"
  - Contains appointment details

---

## 🔍 Debugging Common Issues

### Issue 1: "Ambiguous mapping" error on startup
**Cause:** Duplicate `GET /api/appointments/{id}` in two controllers.
**Fix:** ✅ Already fixed - RazorpayController now uses `/api/payment/*` paths.

### Issue 2: "Appointment not found" when creating Razorpay order
**Cause:** Appointment not created in Stage 1, or wrong appointment ID sent.
**Fix:** 
- Verify Stage 1 returns correct appointmentId
- Check database: `SELECT * FROM appointments;`
- Ensure you use the EXACT appointmentId from Stage 1 response

### Issue 3: "Signature mismatch" error after payment
**Cause:** 
- Razorpay key_secret is wrong or not set
- Signature calculation failed
**Fix:**
- Check `application.properties`:
  ```properties
  razorpay.key_id=rzp_test_SUtmFpZbeLLdGw
  razorpay.key_secret=4qCtGrD63whhZnfMViwnoEbN
  ```
- Check backend logs for signature mismatch details

### Issue 4: Email not received
**Causes:**
- Patient email not set in database
- Gmail credentials wrong
- Gmail app-specific password not generated
**Fix:**
- Verify patient email: `SELECT email FROM patients WHERE id = 1;`
- Check SMTP config in `application.properties`
- For Gmail, use app-specific password not regular password
- Check logs: `"Failed to send payment confirmation email"`

### Issue 5: Frontend shows "Payment failed" but no error message
**Cause:** Verify-payment API returned error.
**Debug:**
- Check backend logs for verify-payment errors
- Check payment details are passed (appointmentId, order_id, payment_id, signature)
- Use browser DevTools → Network tab → check /api/payment/verify-payment response

---

## 📊 Database Schema Reference

### Doctors Table
```sql
CREATE TABLE doctors (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  specialization VARCHAR(255),
  experience INT,
  consultation_fee BIGINT
);
```

### Patients Table
```sql
CREATE TABLE patients (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  age INT,
  disease VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  doctor_id BIGINT,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  appointment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'CREATED',    -- CREATED, SUCCESS, FAILED
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  patient_id BIGINT,
  doctor_id BIGINT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

---

## 🧩 API Endpoints Summary

| Stage | Method | Endpoint | Purpose |
|-------|--------|----------|---------|
| 1 | POST | `/api/appointments/create` | Create appointment in DB |
| 2 | POST | `/api/payment/{id}/create-payment` | Create Razorpay order |
| 4 | POST | `/api/payment/verify-payment` | Verify signature & email |
| Helper | GET | `/api/appointments/{id}` | Get appointment details |
| Helper | GET | `/api/payment/status/{id}` | Get payment status |

---

## 💡 Key Takeaways

1. **Two-Phase Flow:** Appointment MUST be created BEFORE payment
2. **Database State:** Check database at each stage to verify progress
3. **Async Email:** Email sent asynchronously (may take 1-10 seconds)
4. **Signature Verification:** Critical security step - validates payment genuineness
5. **Retry Logic:** Email service retries 3 times with exponential backoff
6. **Logging:** All steps logged - check backend console for debugging

---

## 📞 Support & Troubleshooting

**Quick Checklist:**
- ✅ Database contains test data (Dr. Sharma, Prabhakar)
- ✅ Backend starts without "ambiguous mapping" error
- ✅ Frontend runs without errors
- ✅ Razorpay keys configured in application.properties
- ✅ SMTP credentials set in application.properties
- ✅ Each stage logged to backend console

**Next Steps if Stuck:**
1. Check backend logs carefully (timestamps help)
2. Verify database state with SELECT queries
3. Check network tab in browser DevTools
4. Inspect Network → verify payment → Response field
