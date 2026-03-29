# HealthHub - Razorpay Payment + SMTP Email System

**Complete Spring Boot MVC implementation** for secure payments and automated email notifications.

---

## 📖 Quick Links

| Document | Purpose |
|----------|---------|
| **IMPLEMENTATION_SUMMARY.md** | 👈 **START HERE** — Overview of all deliverables & architecture |
| **PAYMENT_AND_EMAIL_TESTING_GUIDE.md** | Step-by-step testing & troubleshooting instructions |
| **ROOT_CAUSE_ANALYSIS.md** | Deep-dive into payment failures & root causes |
| **SQL_SETUP_AND_TEST_DATA.sql** | Database initialization script |

---

## 🚀 30-Second Start

```bash
# 1. Setup Database
mysql -u root -p crudapi < SQL_SETUP_AND_TEST_DATA.sql

# 2. Start Backend
cd HealthHub
mvn spring-boot:run

# 3. Start Frontend (new terminal)
cd frontend
npm run dev

# 4. Open Browser
# http://localhost:5173
```

---

## 🎯 What's Included

✅ **Razorpay Integration**
- Order creation via REST API
- HMAC-SHA256 signature verification
- Support for hex & base64 encoding
- Comprehensive logging

✅ **SMTP Email Service**
- Gmail or custom SMTP provider
- Async execution (@Async)
- Auto-retry on failure (@Retryable)
- 3 attempts with exponential backoff
- HTML Thymeleaf templates

✅ **Database**
- Patient entity with validated email field
- Appointment → Payment relationship
- Full schema with indexes

✅ **Documentation**
- Complete testing guide
- Root cause analysis of payment failures
- SQL setup script
- Production deployment checklist

---

## 🔧 Configuration

### SMTP Setup (Gmail)
```bash
# Generate app password: https://myaccount.google.com/apppasswords
export MAIL_USERNAME=your@gmail.com
export MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password
```

### Razorpay Setup
Get TEST keys from: https://dashboard.razorpay.com/settings/api-keys

```properties
# application.properties
razorpay.key_id=rzp_test_xxx
razorpay.key_secret=rzp_test_secret
```

---

## 📊 Payment Flow

```
1. User clicks "Pay Securely" on frontend
                    ↓
2. Backend creates Razorpay order
                    ↓
3. Frontend opens Razorpay modal
                    ↓
4. User completes payment
                    ↓
5. Frontend verifies signature with backend
                    ↓
6. Backend updates appointment: payment_status='SUCCESS'
                    ↓
7. Email sent asynchronously (with auto-retry)
                    ↓
8. User receives confirmation email
```

---

## 🐛 Troubleshooting

### Payment Fails
→ See `PAYMENT_AND_EMAIL_TESTING_GUIDE.md` → Troubleshooting Checklist

### Email Not Sent
→ Check backend logs for "Payment confirmation email sent..."  
→ Verify SMTP credentials  
→ See troubleshooting guide

### Signature Mismatch
→ Verify `razorpay.key_secret` matches Razorpay dashboard  
→ Check backend logs for signature comparison details

**For detailed troubleshooting:** See `ROOT_CAUSE_ANALYSIS.md`

---

## 📚 Key Files

```
Backend:
  src/main/java/com/healthHub/
    ├── controller/RazorpayController.java (HTTP endpoints)
    ├── service/RazorpayService.java (Razorpay API integration)
    ├── service/EmailService.java (Email interface)
    ├── service/EmailServiceImpl.java (Email implementation)
    ├── dto/PaymentEmailDTO.java (Data transfer object)
    ├── entity/Patient.java (Patient with email field)
    └── HealthHubApplication.java (Main app class)
  
  resources/
    ├── application.properties (SMTP + Razorpay config)
    └── templates/payment-confirmation.html (Email template)

Database:
  SQL_SETUP_AND_TEST_DATA.sql (Schema + test data)

Documentation:
  ├── IMPLEMENTATION_SUMMARY.md (Overview)
  ├── PAYMENT_AND_EMAIL_TESTING_GUIDE.md (Step-by-step guide)
  ├── ROOT_CAUSE_ANALYSIS.md (Architecture + root causes)
  └── README.md (This file)
```

---

## ✅ Verified & Production-Ready

- ✅ Flexible JSON parsing (handles number & string types)
- ✅ Robust signature verification (hex & base64 support)
- ✅ Async email execution (non-blocking HTTP response)
- ✅ Auto-retry on failure (exponential backoff)
- ✅ Comprehensive logging (debugging at each stage)
- ✅ Clean architecture (Service → DTO → Controller)
- ✅ Environment-based config (no hardcoded credentials)
- ✅ Error handling (graceful failures with logging)

---

## 📖 Documentation Guide

**New to this system?**
1. Start with: `IMPLEMENTATION_SUMMARY.md`
2. Then follow: `PAYMENT_AND_EMAIL_TESTING_GUIDE.md`
3. Debug using: `ROOT_CAUSE_ANALYSIS.md`

**Want to understand payment failures?**
→ Go to: `ROOT_CAUSE_ANALYSIS.md`

**Need to test the system?**
→ Go to: `PAYMENT_AND_EMAIL_TESTING_GUIDE.md`

**Need production checklist?**
→ See: `PAYMENT_AND_EMAIL_TESTING_GUIDE.md` → Final Checklist

---

## 🤝 Support

### Common Questions

**Q: How do I know if the payment was successful?**  
A: Backend logs will show "Verifying signature..." followed by either "payment confirmed" or "signature mismatch". Database will show `payment_status='SUCCESS'` and email will be sent.

**Q: What if email sending fails?**  
A: SystemCall will retry 3 times automatically. If all retry, failure is logged but payment is NOT rolled back (user still paid).

**Q: Can I use a different email provider?**  
A: Yes! Update `spring.mail.host` and credentials in `application.properties`. Works with any SMTP provider (AWS SES, SendGrid, Office365, etc.).

**Q: How do I deploy to production?**  
A: See `PAYMENT_AND_EMAIL_TESTING_GUIDE.md` → Production Deployment Checklist

---

## 📅 Version Info

- **Built:** March 29, 2026
- **Spring Boot:** 3.5.12
- **Java:** 17+
- **Database:** MySQL
- **Frontend:** React + Vite
- **Payment Gateway:** Razorpay (Test Keys)
- **Email Provider:** Gmail SMTP (configurable)

---

## 🎓 What You'll Learn

From this implementation, you'll learn:
- Razorpay API integration & signature verification
- Spring Boot async processing (@Async)
- Spring Retry with exponential backoff (@Retryable)
- JavaMailSender & SMTP configuration
- Thymeleaf email templates
- MVC architecture best practices
- Error handling & logging
- Testing strategies for payment systems

---

**Ready to get started?** → Open `IMPLEMENTATION_SUMMARY.md`

**Want to test immediately?** → Follow the "30-Second Start" section above
