# HealthHub - Complete Appointment + Payment + Email Flow Guide

## 🎯 Problem Statement (What Was Broken)

**Original Issue:** Payment was being processed **without** an appointment being saved in the database first.

**Root Cause:** The flow tried to:
1. Verify payment first (Stripe)
2. Then create appointment
3. Result: Appointment table empty, payment failed, email never sent

---

## ✅ Corrected Flow (Stage-by-Stage)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 1: APPOINTMENT CREATION (BEFORE PAYMENT)                     │
└─────────────────────────────────────────────────────────────────────┘

Frontend User:
  ├─ Selects Doctor (Dr. A. Sharma)
  ├─ Selects Appointment Date (2026-04-10)
  └─ Clicks "Book Appointment"
  
Frontend sends:
  POST /api/appointments/create
  {
    "patientId": 1,
    "doctorId": 1,
    "date": "2026-04-10"
  }
  
Backend (AppointmentController.createAppointment):
  ├─ Receives appointment details
  ├─ Calls AppointmentService.createAppointmentForPayment()
  └─ Returns appointment to frontend
  
Backend (AppointmentService.createAppointmentForPayment):
  ├─ Fetch Patient from DB (patient_id = 1)
  ├─ Fetch Doctor from DB (doctor_id = 1)
  ├─ Create Appointment object:
  │   - patient = Patient(id=1, name="Prabhakar", email="jhaprabhakarindia@gmail.com")
  │   - doctor = Doctor(id=1, name="Dr. A. Sharma", consultationFee=500)
  │   - appointmentDate = 2026-04-10
  │   - paymentStatus = "CREATED"  ← ✅ KEY POINT: NOT "SUCCESS" yet!
  ├─ Save appointment to DB (INSERT into appointments table)
  └─ Return to frontend:
      {
        "appointmentId": 1,
        "patientName": "Prabhakar",
        "doctorName": "Dr. A. Sharma",
        "consultationFee": 500,
        "appointmentDate": "2026-04-10"
      }

✅ DATABASE STATE AFTER STAGE 1:
┌─────────┬──────────────────┬────────────────┬───────────────┬──────────┬────────────┐
│ id      │ appointment_date │ payment_status │ razorpay_*    │ patient  │ doctor_id  │
├─────────┼──────────────────┼────────────────┼───────────────┼──────────┼────────────┤
│ 1       │ 2026-04-10       │ CREATED        │ NULL          │ 1        │ 1          │
└─────────┴──────────────────┴────────────────┴───────────────┴──────────┴────────────┘

---

┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 2: RAZORPAY ORDER CREATION                                   │
└─────────────────────────────────────────────────────────────────────┘

Frontend sends:
  POST /api/appointments/1/create-payment
  {} (no body needed, appointment_id in URL)
  
Backend (RazorpayController.createPayment):
  ├─ Receives appointment_id = 1
  ├─ Calls RazorpayService.createOrderForAppointment(1, null)
  └─ Returns Razorpay order details to frontend

Backend (RazorpayService.createOrderForAppointment):
  ├─ Fetch Appointment from DB (id = 1)
  ├─ Get Doctor consultationFee = 500 rupees
  ├─ Calculate amount = 500 * 100 = 50000 paise
  ├─ Create Razorpay API request:
  │   POST https://api.razorpay.com/v1/orders
  │   {
  │     "amount": 50000,
  │     "currency": "INR",
  │     "receipt": "appointment_1",
  │     "payment_capture": 1
  │   }
  │   (with Basic Auth header: keyId:keySecret base64)
  ├─ Razorpay responds with order_id
  ├─ Save razorpay_order_id to appointment in DB
  └─ Return to frontend:
      {
        "razorpayOrderId": "order_1234567890",
        "amount": 50000,
        "currency": "INR",
        "keyId": "rzp_test_XXXXXXX"
      }

✅ DATABASE STATE AFTER STAGE 2:
┌─────────┬──────────────────┬────────────────┬──────────────────────┬──────────┬────────────┐
│ id      │ appointment_date │ payment_status │ razorpay_order_id    │ patient  │ doctor_id  │
├─────────┼──────────────────┼────────────────┼──────────────────────┼──────────┼────────────┤
│ 1       │ 2026-04-10       │ CREATED        │ order_1234567890 ✅  │ 1        │ 1          │
└─────────┴──────────────────┴────────────────┴──────────────────────┴──────────┴────────────┘

Note: razorpay_payment_id still NULL (payment not verified yet)

---

┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 3: USER COMPLETES PAYMENT (ON RAZORPAY MODAL)                │
└─────────────────────────────────────────────────────────────────────┘

Frontend (CheckoutForm.jsx):
  ├─ Opens Razorpay modal with order_id
  ├─ User enters card: 4111 1111 1111 1111
  ├─ User enters Expiry: 12/25
  ├─ User enters CVV: 123
  └─ User clicks "Pay"
  
Razorpay processes payment and returns:
  {
    "razorpay_payment_id": "pay_1234567890",
    "razorpay_order_id": "order_1234567890",
    "razorpay_signature": "abc123def456..."
  }

📝 NOTE: At this point, the payment is processed ON RAZORPAY's side.
    Our database doesn't know yet because verification hasn't happened.

---

┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 4: VERIFY PAYMENT & UPDATE APPOINTMENT (SERVICE LAYER)       │
└─────────────────────────────────────────────────────────────────────┘

Frontend sends:
  POST /api/appointments/verify-payment
  {
    "appointmentId": 1,
    "razorpay_order_id": "order_1234567890",
    "razorpay_payment_id": "pay_1234567890",
    "razorpay_signature": "abc123def456..."
  }

Backend (RazorpayController.verifyPayment):
  ├─ Receives flexible payload
  ├─ Parses appointmentId safely (handles number or string)
  ├─ Calls RazorpayService.verifyAndNotify(1, "order_...", "pay_...", "sig_...")
  └─ Returns response to frontend

Backend (RazorpayService.verifyAndNotify):
  ├─ Extract signature from payload
  ├─ Compute HMAC-SHA256(orderId|paymentId, keySecret)
  ├─ Compare:
  │   generated_hex OR generated_base64 == incoming_signature?
  ├─ If ✅ VALID:
  │   ├─ Fetch Appointment from DB (id = 1)
  │   ├─ Update appointment:
  │   │   - paymentStatus = "SUCCESS" ← ✅ KEY: Now marked as SUCCESS
  │   │   - razorpayPaymentId = "pay_1234567890"
  │   │   - razorpayOrderId = "order_1234567890"
  │   ├─ Save to DB
  │   ├─ Build PaymentEmailDTO:
  │   │   - patientName = "Prabhakar"
  │   │   - patientEmail = "jhaprabhakarindia@gmail.com"
  │   │   - doctorName = "Dr. A. Sharma"
  │   │   - amountInPaise = 50000
  │   │   - transactionId = "pay_1234567890"
  │   │   - appointmentId = 1
  │   └─ Call EmailService.sendPaymentConfirmation(dto) [NON-BLOCKING, @Async]
  │
  └─ If ❌ INVALID:
      └─ Update appointment: paymentStatus = "FAILED"

✅ DATABASE STATE AFTER STAGE 4:
┌─────────┬──────────────────┬────────────────┬──────────────────────┬───────────────────────┬────────────┐
│ id      │ appointment_date │ payment_status │ razorpay_order_id    │ razorpay_payment_id   │ doctor_id  │
├─────────┼──────────────────┼────────────────┼──────────────────────┼───────────────────────┼────────────┤
│ 1       │ 2026-04-10       │ SUCCESS ✅     │ order_1234567890     │ pay_1234567890 ✅     │ 1          │
└─────────┴──────────────────┴────────────────┴──────────────────────┴───────────────────────┴────────────┘

✅ RESPONSE TO FRONTEND:
{
  "status": "success"
}

Frontend shows: "🎉 Payment Successful!"

---

┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 5: EMAIL SENT ASYNCHRONOUSLY (BACKGROUND THREAD)             │
└─────────────────────────────────────────────────────────────────────┘

Backend (EmailServiceImpl.sendPaymentConfirmation) [ASYNC, @Async]:
  ├─ Runs in thread pool (NON-BLOCKING, doesn't delay HTTP response)
  ├─ Process Thymeleaf template:
  │   templates/payment-confirmation.html
  ├─ Set variables:
  │   - name = "Prabhakar"
  │   - amountInRupees = "5.00" (50000 / 100)
  │   - transactionId = "pay_1234567890"
  │   - appointmentId = "1"
  ├─ Generate HTML email body
  ├─ Create MIME message
  ├─ Send via SMTP (JavaMailSender):
  │   Host: smtp.gmail.com
  │   Port: 587
  │   From: kundanjeeindia@gmail.com
  │   To: jhaprabhakarindia@gmail.com
  │   Subject: "Payment Confirmation - Appointment 1"
  │   Body: HTML rendered email
  └─ On failure: @Retryable Auto-retries up to 3 times:
      Attempt 1 (immediate) → fails (transient SMTP error)
      Wait 2 seconds
      Attempt 2 → fails
      Wait 4 seconds (2 * 2.0 multiplier)
      Attempt 3 → SUCCESS (email sent)
      OR all 3 fail → logged as error (payment NOT rolled back)

✅ EMAIL RECEIVED BY PATIENT:
From: kundanjeeindia@gmail.com
To: jhaprabhakarindia@gmail.com
Subject: Payment Confirmation - Appointment 1

Body:
  Hi Prabhakar,
  
  Thank you for your payment. Appointment confirmation:
  
  Appointment ID: 1
  Amount Paid: ₹5.00
  Transaction ID: pay_1234567890
  
  If you have questions, reply to this email.
  
  Regards,
  HealthHub Team
```

---

## 📊 Database State Summary

| Stage | payment_status | razorpay_order_id | razorpay_payment_id | Email Status |
|-------|----------------|-------------------|---------------------|--------------|
| After create appointment | CREATED | NULL | NULL | Not sent |
| After create Razorpay order | CREATED | order_xxx | NULL | Not sent |
| After payment verification | SUCCESS ✅ | order_xxx | pay_yyy ✅ | Sent async ✅ |
| If verification fails | FAILED ❌ | order_xxx | NULL | Not sent |

---

## 🔧 API Endpoints Summary

### 1. Create Appointment (Stage 1)
```
POST /api/appointments/create
Content-Type: application/json

Request:
{
  "patientId": 1,
  "doctorId": 1,
  "date": "2026-04-10"
}

Response:
{
  "appointmentId": 1,
  "patientName": "Prabhakar",
  "doctorName": "Dr. A. Sharma",
  "consultationFee": 500,
  "appointmentDate": "2026-04-10"
}
```

### 2. Create Razorpay Order (Stage 2)
```
POST /api/appointments/1/create-payment
Content-Type: application/json

Request: {} (no body, ID in URL)

Response:
{
  "razorpayOrderId": "order_1234567890",
  "amount": 50000,
  "currency": "INR",
  "keyId": "rzp_test_XXXXXXX"
}
```

### 3. Verify Payment (Stage 4)
```
POST /api/appointments/verify-payment
Content-Type: application/json

Request:
{
  "appointmentId": 1,
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "abc123def456..."
}

Response:
{
  "status": "success"
}

OR (if verification fails):
{
  "status": "failed",
  "reason": "signature_mismatch"
}
```

---

## 💻 Frontend Integration Example

```javascript
// Stage 1: Create appointment
const createAppointment = async () => {
  const res = await fetch('http://localhost:8080/api/appointments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: 1,
      doctorId: 1,
      date: '2026-04-10'
    })
  });
  
  const { appointmentId, consultationFee } = await res.json();
  return { appointmentId, consultationFee };
};

// Stage 2: Create Razorpay order
const createRazorpayOrder = async (appointmentId) => {
  const res = await fetch(
    `http://localhost:8080/api/appointments/${appointmentId}/create-payment`,
    { method: 'POST' }
  );
  
  return await res.json();
};

// Stage 3 & 4: Combined - open Razorpay modal, handle payment
const handlePayment = async () => {
  const { appointmentId } = await createAppointment();
  const { razorpayOrderId, amount, keyId } = await createRazorpayOrder(appointmentId);
  
  const options = {
    key: keyId,
    order_id: razorpayOrderId,
    amount: amount,
    handler: async (response) => {
      // Stage 4: Verify payment
      await fetch('http://localhost:8080/api/appointments/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })
      });
      
      alert('🎉 Payment Successful!');
    }
  };
  
  new window.Razorpay(options).open();
};
```

---

## 🐛 Troubleshooting

### Problem: "Appointment not found" error
**Cause:** Appointment not created in DB before payment attempt
**Fix:** Ensure frontend calls `/api/appointments/create` FIRST

### Problem: "Doctor consultation fee not set"
**Cause:** Doctor record missing or has NULL consultation_fee
**Fix:** Verify doctor exists and has consultation_fee set:
```sql
SELECT id, name, consultation_fee FROM doctors WHERE id = 1;
```

### Problem: "Signature mismatch"
**Cause:** Razorpay key_secret incorrect or signature encoding mismatch
**Fix:** Verify Razorpay credentials in application.properties match dashboard

### Problem: Email not received
**Cause:** SMTP credentials wrong or transient network issue
**Fix:** Check backend logs for email sending attempts; verify Gmail app password

---

## ✅ Setup Instructions

```bash
# 1. Setup Database
mysql -u root -p < APPOINTMENT_PAYMENT_FLOW_SETUP.sql

# 2. Start Backend
cd HealthHub
mvn spring-boot:run

# 3. Start Frontend
cd frontend
npm run dev

# 4. Test in Browser
# http://localhost:5173

# 5. Follow the flow:
# - Click "Book Appointment" (creates appointment #1)
# - Click "Pay Securely" (creates Razorpay order)
# - Complete Razorpay payment (verifies and updates appointment)
# - Receive confirmation email
```

---

**END OF FLOW GUIDE**
