# HealthHub Payment & Email System - Complete Testing & Debugging Guide

## 📋 Overview of the Payment + Email Flow

```
1. Frontend: User clicks "Pay Securely" button on CheckoutForm.jsx
                    ↓
2. Frontend→Backend: POST /api/appointments/{id}/create-payment
                    ↓
3. Backend (RazorpayController): Accepts appointment ID
                    ↓
4. Backend (RazorpayService): Creates Razorpay order via REST API
       - Calculates amount from Doctor consultation_fee (or override)
       - Calls https://api.razorpay.com/v1/orders (with Basic Auth)
       - Saves razorpay_order_id and payment_status='CREATED' to DB
                    ↓
5. Backend→Frontend: Returns { razorpayOrderId, amount, currency, keyId }
                    ↓
6. Frontend: Opens Razorpay checkout modal with order_id
                    ↓
7. User: Completes payment in Razorpay (test card: 4111 1111 1111 1111)
                    ↓
8. Razorpay: Returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }
                    ↓
9. Frontend→Backend: POST /api/appointments/verify-payment
       Payload: {
         appointmentId: 1,
         razorpay_order_id: "order_XXXX",
         razorpay_payment_id: "pay_YYYY",
         razorpay_signature: "computed_signature"
       }
                    ↓
10. Backend (RazorpayController): Parses flexible JSON payload
                    ↓
11. Backend (RazorpayService.verifyAndNotify):
       - Verifies HMAC-SHA256 signature
       - If valid:
         * Updates appointment: payment_status='SUCCESS'
         * Saves razorpay_payment_id and razorpay_order_id
         * Builds PaymentEmailDTO
         * Calls EmailService.sendPaymentConfirmation(dto) [ASYNC]
                    ↓
12. Backend (EmailServiceImpl, @Async + @Retryable):
       - Processes Thymeleaf template with variables
       - Sends HTML email via SMTP (Gmail or configured provider)
       - Runs asynchronously (non-blocking)
       - Retries up to 3 times with exponential backoff (2s→4s→8s) on failure
       - Logs success/failure
```

---

## 🚀 Step-by-Step Setup & Testing

### Step 1: Database Setup
```bash
# 1. Open MySQL client
mysql -u root -p

# 2. Use the crudapi database (or your configured DB)
USE crudapi;

# 3. Run the SQL setup script
SOURCE /path/to/HealthHub/SQL_SETUP_AND_TEST_DATA.sql;

# 4. Verify data was inserted
SELECT * FROM doctors;
SELECT * FROM patients;
SELECT * FROM appointments;
```

**Expected Output:**
```
doctors:
| id | name             | specialization          | experience | consultation_fee |
| 1  | Dr. A. Sharma    | General Consultation    | 10         | 500              |

patients:
| id | name      | age | disease      | email                       | doctor_id |
| 1  | Prabhakar | 22  | General Check-up | jhaprabhakarindia@gmail.com | 1         |

appointments:
| id | appointment_date | payment_status | razorpay_order_id | razorpay_payment_id | patient_id | doctor_id |
| 1  | 2026-04-10       | CREATED        | NULL              | NULL                | 1          | 1         |
```

---

### Step 2: Configure SMTP Credentials

**Option A: Set Environment Variables (Recommended for Dev)**
```bash
# For Gmail, use an App Password (not your main password)
# Generate here: https://myaccount.google.com/apppasswords

export MAIL_USERNAME=youremail@gmail.com
export MAIL_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char app password

# Or keep them in application.properties (not for production!)
```

**Option B: Check application.properties**
```bash
cat HealthHub/src/main/resources/application.properties
```
Verify these properties exist:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=youremail@gmail.com  # or ${MAIL_USERNAME}
spring.mail.password=your_app_password     # or ${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Verify Razorpay credentials also:**
```properties
razorpay.key_id=rzp_test_XXXXXXX
razorpay.key_secret=XXXXXXX
```

---

### Step 3: Start the Backend Application

```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/HealthHub

# Build and run
mvn clean package
mvn spring-boot:run

# Or run directly from IDE
# (open the project in VS Code and run HealthHubApplication.java)
```

**Expected Logs on Startup:**
```
INFO  : HealthHub started successfully
INFO  : Tomcat started on port(s): 8080
INFO  : Started HealthHubApplication in X.XXX seconds
```

---

### Step 4: Start the Frontend Application

```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/frontend

# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE v4.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

**Access the app:** http://localhost:5173

---

### Step 5: Test the Payment Flow (Manual Testing)

#### 5.1 Navigate to Appointment & Payment Page
- Open http://localhost:5173 in your browser
- Locate the appointment with ID=1 (Doctor: Dr. A. Sharma, Fee: ₹500)
- You should see the CheckoutForm with:
  - Doctor name
  - Service/Appointment title
  - Base fee (₹500)
  - Payment input field
  - "Pay Securely" button

#### 5.2 Trigger Order Creation (Backend Test)
Open another terminal and run this curl command:
```bash
curl -X POST http://localhost:8080/api/appointments/1/create-payment \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v
```

**Expected Response:**
```json
{
  "razorpayOrderId": "order_xxx123xxx",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_XXXXXXX"
}
```

**Backend Logs Should Show:**
```
INFO  com.healthHub.service.RazorpayService:
     Creating Razorpay order for appointment 1 with amount 50000 paise

INFO  com.healthHub.service.RazorpayService:
     Razorpay create order response for appointment 1: {id=order_xxx123xxx, ...}
```

If you see an error, it's likely one of:
- **Razorpay credentials invalid:** Check `razorpay.key_id` and `razorpay.key_secret`
- **Appointment not found:** Verify appointment ID=1 exists in DB
- **Doctor fee not set:** Ensure Doctor has a consultation_fee > 0

#### 5.3 Simulate Frontend Payment (With Razorpay Modal)
- Click "Pay Securely" button on CheckoutForm
- Razorpay modal opens with the order_id
- Enter test card: **4111 1111 1111 1111**
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)
- Click "Pay"

**Razorpay will return:**
- razorpay_payment_id: pay_xxx456xxx
- razorpay_order_id: order_xxx123xxx (same as above)
- razorpay_signature: computed_hmac_signature

#### 5.4 Verify Payment on Backend (Manual Verification Test)
Run this curl command (replace values from step 5.3):
```bash
curl -X POST http://localhost:8080/api/appointments/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "razorpay_order_id": "order_xxx123xxx",
    "razorpay_payment_id": "pay_xxx456xxx",
    "razorpay_signature": "signature_from_razorpay_response"
  }' \
  -v
```

**Expected Response (Success):**
```json
{
  "status": "success"
}
```

**Expected Response (Failure - Invalid Signature):**
```json
{
  "status": "failed",
  "reason": "signature_mismatch"
}
```

#### 5.5 Check Backend Logs for Signature Verification
```
INFO  com.healthHub.service.RazorpayService:
     Verifying signature. Payload='order_xxx123xxx|pay_xxx456xxx' 
     generatedHex='computed_hex_signature' 
     generatedBase64='computed_base64_signature' 
     incoming='incoming_signature_from_razorpay'

INFO  com.healthHub.service.RazorpayService:
     PaymentEmailDTO built for appointment 1, sending email asynchronously

INFO  com.healthHub.service.EmailServiceImpl:
     Payment confirmation email sent to jhaprabhakarindia@gmail.com for appointment 1
```

#### 5.6 Verify Payment Status in Database
After successful payment:
```sql
SELECT 
  id, patient_id, doctor_id, payment_status, 
  razorpay_order_id, razorpay_payment_id 
FROM appointments WHERE id = 1;
```

**Expected Output:**
```
| id | patient_id | doctor_id | payment_status | razorpay_order_id | razorpay_payment_id |
| 1  | 1          | 1         | SUCCESS        | order_xxx123xxx   | pay_xxx456xxx       |
```

#### 5.7 Verify Email Was Sent
- Check your Gmail inbox (or configured SMTP email)
- Look for email from: `kundanjeeindia@gmail.com` (configured in properties)
- Subject: "Payment Confirmation - Appointment 1"
- Body should contain:
  - Patient name: "Prabhakar"
  - Amount paid: "₹5.00" (500 paise = ₹5)
  - Transaction ID: pay_xxx456xxx
  - Appointment ID: 1

**If email not received:**
- Check backend logs for email errors
- Ensure `spring.mail.username` and `spring.mail.password` are correct
- Check Gmail app passwords: https://myaccount.google.com/apppasswords
- Check spam/trash folder
- Verify firewall allows SMTP port 587

---

## 🔥 Troubleshooting Checklist

### Issue: Order Creation Fails (500 Error)

**Logs show:**
```
java.lang.RuntimeException: Appointment not found: 1
```

**Fix:**
1. Verify appointment exists in database
2. Ensure you're using the correct appointment ID
3. Run: `SELECT * FROM appointments;`

**Logs show:**
```
java.lang.RuntimeException: Appointment has no doctor assigned
```

**Fix:**
1. Ensure appointment.doctor_id is set
2. Ensure doctor exists: `SELECT * FROM doctors WHERE id = 1;`
3. Update appointment: `UPDATE appointments SET doctor_id = 1 WHERE id = 1;`

**Logs show Razorpay auth error:**
```
401 Unauthorized: ...
```

**Fix:**
1. Verify `razorpay.key_id` in application.properties
2. Verify `razorpay.key_secret` in application.properties
3. Get keys from: https://dashboard.razorpay.com/settings/api-keys
4. Use TEST keys (starts with `rzp_test_`), not LIVE keys

---

### Issue: Payment Verification Fails (Signature Mismatch)

**Logs show:**
```
INFO  : Verifying signature. Payload='order_xxx|pay_xxx' 
        generatedHex='abc123' generatedBase64='xyz789' incoming='different'
```

**Fix:**
1. Verify `razorpay.key_secret` is identical to Razorpay dashboard
2. Verify frontend is sending the exact signature from Razorpay
3. Ensure no encoding issues (UTF-8)
4. Try a fresh payment with a new order

**Frontend shows: "❌ Verification Failed"**
```javascript
// This is in CheckoutForm.jsx - review the catch block
catch {
  setError('❌ Verification Failed')
}
```

**Fix:**
1. Open browser DevTools (F12) → Network tab
2. Click "Pay Securely" button
3. Look for the POST request to `/api/appointments/verify-payment`
4. Check response: is it a 400/500, or is the response body showing error details?
5. If 400, the backend rejected the payload (check logs)
6. If 500, the backend crashed (check console logs)

---

### Issue: Email Not Sent

**Logs show:**
```
WARN  : Failed to send payment confirmation email to jhaprabhakarindia@gmail.com: 
        SMTPConnectException: Connection refused
```

**Fix:**
1. Verify SMTP credentials: `grep spring.mail application.properties`
2. For Gmail:
   - Use an app password (not main password): https://myaccount.google.com/apppasswords
   - Ensure "Less secure app access" is OFF (Gmail requires app passwords now)
   - Or generate a 16-char app password and use that
3. Verify SMTP port 587 is open (firewall)
4. Verify Gmail allows SMTP forwarding

**Logs show:**
```
ERROR : Failed to send payment confirmation email to jhaprabhakarindia@gmail.com: 
        AuthenticationFailedException: 535 5.7.8 ...
```

**Fix:**
1. SMTP password is wrong
2. Re-generate app password at: https://myaccount.google.com/apppasswords
3. Update application.properties or env var MAIL_PASSWORD
4. Restart application

**Logs show:**
```
WARN  : Failed to send payment confirmation email to jhaprabhakarindia@gmail.com: 
        will retry (will retry)
```
(This message appears 3 times, then email gives up)

**Fix:**
1. This is expected behavior with @Retryable
2. It will retry up to 3 times with exponential backoff
3. If all 3 retries fail, the error is logged but payment is NOT rolled back
4. Check why the transient failure happened (check logs before the WARN message for the root cause)

---

### Issue: Frontend Not Connecting to Backend

**Frontend error:**
```
❌ Payment Failed
```
(in browser console)

**Check:**
```javascript
// Check browser DevTools Network tab:
// Look for POST request to http://localhost:8080/api/appointments/1/create-payment
// Status: 0 (network error) or CORS error
```

**Fix:**
1. Ensure backend is running: `http://localhost:8080/actuator/health`
2. Should return: `{"status":"UP"}`
3. If it fails, backend is not running
4. Start backend: `cd HealthHub && mvn spring-boot:run`
5. Verify CORS is enabled in controller:
   ```java
   @CrossOrigin("http://localhost:5173")
   ```
6. If not configured, add it or use wildcard: `@CrossOrigin("*")`

---

## 📊 Database Verification Queries

### Query 1: Full Payment Flow Status
```sql
SELECT 
  a.id AS appointment_id,
  p.name AS patient_name,
  p.email AS patient_email,
  d.name AS doctor_name,
  d.consultation_fee AS fee_paise,
  CONCAT(d.consultation_fee / 100, '.00') AS fee_rupees,
  a.appointment_date,
  a.payment_status,
  a.razorpay_order_id,
  a.razorpay_payment_id,
  IF(a.razorpay_payment_id IS NOT NULL, 'EMAIL SHOULD HAVE BEEN SENT', 'AWAITING PAYMENT') AS email_status
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
INNER JOIN doctors d ON a.doctor_id = d.id
ORDER BY a.id DESC;
```

### Query 2: Find Stuck Payments
```sql
SELECT 
  a.id AS appointment_id,
  p.name AS patient_name,
  a.payment_status,
  TIME_FORMAT(TIMEDIFF(NOW(), a.created_at), '%Hh %im %ss') AS time_since_creation
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.id
WHERE a.payment_status = 'CREATED' 
  AND a.created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY a.created_at ASC;
```

### Query 3: Successful Payments
```sql
SELECT 
  COUNT(*) AS total_successful_payments,
  SUM(d.consultation_fee) / 100 AS total_revenue_rupees
FROM appointments a
INNER JOIN doctors d ON a.doctor_id = d.id
WHERE a.payment_status = 'SUCCESS';
```

---

## 🔑 Key Files & Their Roles

| File | Purpose |
|------|---------|
| `RazorpayController.java` | HTTP endpoints for payment creation & verification |
| `RazorpayService.java` | Core Razorpay API integration, signature verification |
| `EmailService.java` | Interface for email sending contract |
| `EmailServiceImpl.java` | Email implementation with async (@Async) + retry (@Retryable) |
| `PaymentEmailDTO.java` | Data transfer object (no JPA entity exposed) |
| `payment-confirmation.html` | Thymeleaf HTML template for email body |
| `application.properties` | SMTP & Razorpay configuration |
| `CheckOutForm.jsx` | Frontend payment UI & Razorpay modal |
| `SQL_SETUP_AND_TEST_DATA.sql` | Database initialization script |

---

## 📝 Feature Summary & Highlights

✅ **Async Email Sending** — @Async ensures email doesn't block payment response
✅ **Automatic Retry** — @Retryable handles transient SMTP failures (3 attempts, exponential backoff)
✅ **Signature Verification** — HMAC-SHA256 signature validated against Razorpay API key secret
✅ **Flexible Payload Parsing** — Controller accepts appointmentId as number or string
✅ **HTML Email Template** — Thymeleaf-processed professional email design
✅ **Environment-based Config** — SMTP credentials support env variables
✅ **Comprehensive Logging** — SLF4J logs at each stage for debugging
✅ **Service-Layer Orchestration** — Email triggered from service, not controller

---

## ✅ Final Checklist Before Production

- [ ] Database initialized with test data
- [ ] SMTP credentials verified (Gmail app password generated)
- [ ] Razorpay credentials (TEST keys) confirmed
- [ ] Backend compiled and running without errors
- [ ] Frontend running and can access backend (no CORS errors)
- [ ] Test payment created successfully (order_id returned)
- [ ] Test payment verified successfully (signature matched)
- [ ] Email received in inbox or spam folder
- [ ] Backend logs show all expected log messages
- [ ] Database shows payment_status='SUCCESS' and razorpay_payment_id populated
- [ ] Application restart doesn't clear in-flight async emails (confirm retry mechanism works)

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add Payment Receipt PDF** — Generate PDF report and attach to email
2. **Add Webhook Handler** — Listen for Razorpay webhooks instead of polling
3. **Add Email Queueing** — Use RabbitMQ/Kafka for reliable email delivery
4. **Add Unit Tests** — Mock JavaMailSender and test EmailServiceImpl
5. **Add Integration Tests** — Test full payment flow with test Razorpay sandbox
6. **Add Admin Dashboard** — View payment status, resend emails, generate reports

---

**End of Guide**
