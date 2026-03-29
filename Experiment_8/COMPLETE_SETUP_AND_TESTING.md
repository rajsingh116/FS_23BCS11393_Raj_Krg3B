# HealthHub Payment System - Complete Setup & Testing Guide

## ✅ Quick Start (5 Minutes)

### Prerequisites Checklist
- ✅ Java 17+ installed
- ✅ MySQL 8.0+ running on localhost:3306
- ✅ Node.js 18+ & npm installed
- ✅ Port 8080 (backend) & 5173 (frontend) available

### Quick Setup Steps

**Step 1: Setup Database**
```bash
mysql -u root -p < /Users/prabhakarkumarjha/Desktop/Experiment_8/HealthHub/SETUP_DATABASE_AND_TEST_DATA.sql
# When prompted, enter MySQL password: Prabhakar@147
```

**Step 2: Start Backend (Terminal 1)**
```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/HealthHub
mvn clean package
mvn spring-boot:run
# Wait for: "Started HealthHubApplication in X seconds"
```

**Step 3: Start Frontend (Terminal 2)**
```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/frontend
npm install  # (if node_modules doesn't exist)
npm run dev
# Should show: "VITE vX.X.X ready in XXX ms"
```

**Step 4: Open Browser**
- Navigate to: `http://localhost:5173`
- Click "Book Appointment"
- Select Prabhakar (Patient) and Dr. A. Sharma (Doctor)
- Click "Confirm"
- Click "Pay Now"
- Test Card: `4111 1111 1111 1111` | Expiry: `12/25` | CVV: `123`
- Verify appointment created with email sent

---

## 🔧 CRITICAL FIXES APPLIED

### 1. ✅ Fixed: Ambiguous Mapping Error
**Problem:** Both AppointmentController and RazorpayController had `GET /api/appointments/{id}`
**Solution:** Refactored RazorpayController to use `/api/payment/*` base path

**Changes Made:**
```
AppointmentController:  @RequestMapping("/api/appointments")
RazorpayController:     @RequestMapping("/api/payment")  ← CHANGED from /api/appointments
```

**New API Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/appointments/create` | POST | Create appointment (Stage 1) |
| `/api/appointments/{id}` | GET | Get appointment details |
| `/api/payment/{id}/create-payment` | POST | Create Razorpay order (Stage 2) |
| `/api/payment/verify-payment` | POST | Verify payment (Stage 4) |
| `/api/payment/status/{id}` | GET | Get payment status |

---

### 2. ✅ Fixed: Appointment Creation Flow
**Problem:** Appointment was not being saved before payment
**Solution:** AppointmentService now saves appointment in Stage 1

**Code Change:**
```java
// Stage 1: Create Appointment
Appointment appointment = new Appointment();
appointment.setPatient(patient);
appointment.setDoctor(doctor);
appointment.setAppointmentDate(request.getDate());
appointment.setPaymentStatus("CREATED");

// ← CRITICAL: Save to database
Appointment saved = appointmentRepository.save(appointment);

// Return appointmentId to frontend
return Map.of("appointmentId", saved.getId(), ...);
```

---

### 3. ✅ Verified: Email Configuration
**Status:** All components in place
- ✅ Patient entity has `@Email` validated email field
- ✅ EmailService with `@Async` and `@Retryable`
- ✅ SMTP configured for Gmail (application.properties)
- ✅ Thymeleaf HTML template for emails
- ✅ pom.xml has all dependencies (spring-mail, thymeleaf, etc.)
- ✅ HealthHubApplication has @EnableAsync and @EnableRetry

---

## 📋 Complete Endpoint Reference

### Stage 1: Create Appointment

```http
POST /api/appointments/create
Content-Type: application/json

{
  "patientId": 1,
  "doctorId": 1,
  "date": "2026-04-10"
}
```

**Response (Success):**
```json
{
  "appointmentId": 1,
  "patientName": "Prabhakar",
  "doctorName": "Dr. A. Sharma",
  "consultationFee": 500,
  "appointmentDate": "2026-04-10"
}
```

**Response (Error):**
```json
{
  "error": "Patient not found: 999"
}
```

---

### Stage 2: Create Razorpay Order

```http
POST /api/payment/{appointmentId}/create-payment
Content-Type: application/json

{
  "amount": 50000
}
```

**Response (Success):**
```json
{
  "razorpayOrderId": "order_LdxXgQ1e9lpxYz",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_SUtmFpZbeLLdGw"
}
```

---

### Stage 4: Verify Payment

```http
POST /api/payment/verify-payment
Content-Type: application/json

{
  "appointmentId": 1,
  "razorpay_order_id": "order_LdxXgQ1e9lpxYz",
  "razorpay_payment_id": "pay_LdyCrJSvF57eS2",
  "razorpay_signature": "9ef4dffbfd84f1318f67..."
}
```

**Response (Success):**
```json
{
  "status": "success"
}
```

---

## 🧪 Manual Testing with curl

### Test Appointment Creation
```bash
curl -X POST http://localhost:8080/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": 1,
    "doctorId": 1,
    "date": "2026-04-10"
  }'

# If successful, note the "appointmentId" from response (e.g., 1)
```

### Test Razorpay Order Creation
```bash
# Use appointmentId from previous step
curl -X POST http://localhost:8080/api/payment/1/create-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000}'

# If successful, note the "razorpayOrderId" from response
```

### Get Payment Status
```bash
curl http://localhost:8080/api/payment/status/1

# Response: shows paymentStatus, razorpayOrderId, razorpayPaymentId
```

---

## 🗄️ Database Verification

### Verify Initial Setup
```bash
# Check doctors table
mysql -u root -p -e "USE crudapi; SELECT id, name, consultation_fee FROM doctors;"
# Expected: id=1, name='Dr. A. Sharma', fee=500

# Check patients table
mysql -u root -p -e "USE crudapi; SELECT id, name, email FROM patients;"
# Expected: id=1, name='Prabhakar', email='jhaprabhakarindia@gmail.com'

# Check appointments table (should be empty initially)
mysql -u root -p -e "USE crudapi; SELECT COUNT(*) FROM appointments;"
# Expected: 0
```

### Verify After Stage 1 (Create Appointment)
```bash
mysql -u root -p -e "USE crudapi; SELECT id, patient_id, doctor_id, payment_status, razorpay_order_id FROM appointments WHERE id = 1;"
# Expected: payment_status='CREATED', razorpay_order_id=NULL
```

### Verify After Stage 2 (Create Order)
```bash
mysql -u root -p -e "USE crudapi; SELECT id, payment_status, razorpay_order_id, razorpay_payment_id FROM appointments WHERE id = 1;"
# Expected: razorpay_order_id populated with 'order_...'
```

### Verify After Stage 4 (Verify Payment)
```bash
mysql -u root -p -e "USE crudapi; SELECT id, payment_status, razorpay_order_id, razorpay_payment_id FROM appointments WHERE id = 1;"
# Expected: payment_status='SUCCESS', razorpay_payment_id populated with 'pay_...'
```

---

## 📧 Email Verification

### Check Email Configuration
```bash
grep spring.mail /Users/prabhakarkumarjha/Desktop/Experiment_8/HealthHub/src/main/resources/application.properties
```

### Expected Console Logs
After Stage 4 (verify payment), you should see in backend console:
```
INFO  com.healthHub.service.EmailServiceImpl - Payment confirmation email sent to jhaprabhakarindia@gmail.com for appointment 1
```

### Gmail Inbox Check
- Account: jhaprabhakarindia@gmail.com
- Check inbox for emails with subject: "Payment Confirmation - Appointment 1"
- Email arrives within 5-10 seconds (async processing)

---

## 🔍 Key Debugging Points

### Backend Console Key Messages

**Stage 1 - Create Appointment:**
```
Received request to create appointment: AppointmentRequest(patientId=1, doctorId=1, date=2026-04-10)
Creating appointment for patient 1 with doctor 1 on date 2026-04-10
Appointment created with ID: 1 and status: CREATED
```

**Stage 2 - Create Order:**
```
Creating Razorpay payment order for appointment 1
Creating Razorpay order for appointment 1 with amount 50000 paise
Razorpay create order response for appointment 1: {...}
```

**Stage 4 - Verify Payment:**
```
Verifying payment for appointment 1 with paymentId pay_xxx
Verifying signature. Payload='order_xxx|pay_yyy' generatedHex='abc123' incoming='abc123'
Payment verified successfully for appointment 1
```

**Stage 5 - Send Email:**
```
Payment confirmation email sent to jhaprabhakarindia@gmail.com for appointment 1
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Ambiguous mapping" on backend startup
**Status:** ✅ FIXED
**If still occurs:** Clean and rebuild
```bash
cd HealthHub
mvn clean
mvn package
```

---

### Issue 2: Appointment table empty after Stage 1
**Cause:** AppointmentService.createAppointmentForPayment() not being called
**Debug:**
```bash
# Check if POST request succeeds
curl -v -X POST http://localhost:8080/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{"patientId": 1, "doctorId": 1, "date": "2026-04-10"}'

# Check database
mysql -u root -p -e "USE crudapi; SELECT * FROM appointments;"

# Check backend logs for "Appointment created with ID"
```

---

### Issue 3: "Signature mismatch" error
**Cause:** Razorpay key_secret wrong or signature not computed correctly
**Debug:**
```bash
# Verify credentials
grep razorpay /Users/prabhakarkumarjha/Desktop/Experiment_8/HealthHub/src/main/resources/application.properties

# Check Razorpay dashboard for correct test keys
# Login: https://dashboard.razorpay.com
# Navigate to: Settings → API Keys → Check Test Key ID & Secret
```

---

### Issue 4: Email not received
**Cause 1:** Gmail app-specific password not set
```bash
# Generate from: https://myaccount.google.com/security
# Settings → 2-Factor Authentication → App Passwords
# Select: Mail, macOS
# Copy exact password
# Update application.properties: spring.mail.password=<password>
```

**Cause 2:** Patient email not in database
```bash
mysql -u root -p -e "USE crudapi; UPDATE patients SET email = 'jhaprabhakarindia@gmail.com' WHERE id = 1;"
```

**Cause 3:** SMTP connection failed
```bash
# Check logs for: "Failed to send payment confirmation email"
# Verify internet connection
# Verify Gmail allows "Less secure app access" (if that's the setting)
```

---

## 🚀 Production Checklist

- ⚠️ **Security:** Move credentials to environment variables, not application.properties
- ⚠️ **Email:** Use actual Gmail account, generate app-specific password
- ⚠️ **Razorpay:** Use live keys (rzp_live_...) not test keys
- ⚠️ **HTTPS:** Enable SSL/TLS for frontend and backend
- ⚠️ **Logging:** Configure centralized logging (ELK stack, Splunk, etc.)
- ⚠️ **Monitoring:** Add APM (Application Performance Monitoring)
- ⚠️ **Database:** Set up automated backups
- ⚠️ **Testing:** Add unit tests and integration tests

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `SETUP_DATABASE_AND_TEST_DATA.sql` | SQL setup script |
| `COMPLETE_PAYMENT_FLOW.md` | Detailed flow explanation |
| `DEBUGGING_GUIDE.md` | Comprehensive debugging guide |
| `application.properties` | Backend configuration |
| `AppointmentController.java` | Appointment endpoints |
| `RazorpayController.java` | Payment endpoints |
| `AppointmentService.java` | Appointment business logic |
| `RazorpayService.java` | Payment processing logic |
| `EmailServiceImpl.java` | Email sending logic |

---

## 🎯 Success Criteria

✅ Backend starts without "ambiguous mapping" error  
✅ Appointment created with Stage 1 API call  
✅ Razorpay order created with Stage 2 API call  
✅ Payment signature verified successfully  
✅ Email received in Gmail inbox  
✅ Database shows paymentStatus=SUCCESS after completion  
✅ All logs show expected messages at each stage  

---

## 📞 Support

**Quick Help:**
1. Check backend logs for exact error
2. Verify database state with SELECT queries
3. Check browser Network tab for API responses
4. Review this guide's debugging section

**Key Commands for Debugging:**
```bash
# View backend logs in real-time
tail -f /tmp/healthhub.log

# Check database state
mysql -u root -p -e "USE crudapi; SELECT * FROM appointments;"

# Test backend endpoint
curl http://localhost:8080/api/appointments/1

# Test frontend connectivity
curl http://localhost:5173
```

---

## 🎉 Next Steps After Getting It Working

1. **Customize Test Data:** Update doctor name, patient name, fees
2. **Style Frontend:** Add CSS/Tailwind styling
3. **Add Dashboard:** Display appointment history
4. **Add Admin Panel:** Manage doctors and specialists
5. **Setup S3/Cloud:** Store prescription files
6. **Add Video Consultation:** Integrate Jitsi or Twilio
7. **Setup Webhooks:** Real-time Razorpay notifications
8. **Add Unit Tests:** JUnit for services
9. **Setup CI/CD:** GitHub Actions or Jenkins
10. **Deploy:** AWS, Azure, or GCP

Good luck! 🚀
