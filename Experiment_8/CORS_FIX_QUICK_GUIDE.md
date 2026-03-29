# 🚀 CORS Fix - Quick Action Guide

## ✅ What Was Done

1. **Created Global CORS Config** → `CorsConfig.java`
2. **Updated All Controllers** → Added `@CrossOrigin` annotation
3. **Configured Allowed Origins** → http://localhost:5173
4. **Allowed All Methods** → GET, POST, PUT, DELETE, OPTIONS
5. **Enabled Credentials** → For authorization headers

---

## 📋 Quick Test (2 Minutes)

### Terminal 1: Start Backend
```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/HealthHub
mvn clean package
mvn spring-boot:run
```
✅ Wait for: "Started HealthHubApplication"

### Terminal 2: Start Frontend
```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/frontend
npm run dev
```
✅ Shows: "VITE vX.X.X ready"

### Browser Test
1. Open: http://localhost:5173
2. Click: "Book Appointment"
3. Click: "Pay Securely"
4. ✅ Should work (no 403 error)

---

## 🔍 Verify CORS is Working

### Check 1: Browser Console
```javascript
// F12 → Console → Paste & Enter
fetch('http://localhost:8080/api/appointments/1')
  .then(r => r.json())
  .then(d => console.log('✅ CORS working!', d))
  .catch(e => console.error('❌ CORS failed:', e))
```

### Check 2: Browser Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Make API call (click Pay button)
4. Find request to POST `/api/payment/1/create-payment`
5. Check Response Headers
6. Look for: `Access-Control-Allow-Origin: http://localhost:5173` ✅

### Check 3: curl Command
```bash
curl -i http://localhost:8080/api/appointments/1 \
  -H "Origin: http://localhost:5173"
# Look for: Access-Control-Allow-Origin ✅
```

---

## 🧪 Complete End-to-End Flow

```
1️⃣  Frontend creates appointment
    POST http://localhost:8080/api/appointments/create
    ✅ No CORS error

2️⃣  Frontend creates Razorpay order
    POST http://localhost:8080/api/payment/1/create-payment
    ✅ Gets order ID

3️⃣  User pays on Razorpay modal
    💳 Complete payment

4️⃣  Frontend verifies payment
    POST http://localhost:8080/api/payment/verify-payment
    ✅ Gets success

5️⃣  Email sent
    ✅ Check inbox
```

---

## ✨ Files Updated

| File | Status | Change |
|------|--------|--------|
| CorsConfig.java | ✅ Created | Global CORS setup |
| DoctorController.java | ✅ Updated | Added @CrossOrigin |
| PatientController.java | ✅ Updated | Added @CrossOrigin |
| AppointmentController.java | ✅ Already had | @CrossOrigin present |
| RazorpayController.java | ✅ Already had | @CrossOrigin present |

---

## 🚀 Getting Started NOW

### Copy-Paste These Commands

**Terminal 1:**
```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/HealthHub && mvn clean package && mvn spring-boot:run
```

**Terminal 2:**
```bash
cd /Users/prabhakarkumarjha/Desktop/Experiment_8/frontend && npm run dev
```

**Browser:**
- Open http://localhost:5173
- Test payment flow
- ✅ Done!

---

## ❌ If Still Getting 403 Error

### Debug Checklist

1. **Backend restarted?**
   ```bash
   # Kill old process
   ps aux | grep java
   kill -9 <PID>
   
   # Restart
   mvn spring-boot:run
   ```

2. **CorsConfig.java file exists?**
   ```bash
   ls -la src/main/java/com/healthHub/config/CorsConfig.java
   # Should show file exists
   ```

3. **Frontend URL is http://localhost:5173?**
   - Check browser address bar
   - Should be exactly: `http://localhost:5173`
   - NOT https, NOT different port

4. **Backend running on 8080?**
   ```bash
   curl http://localhost:8080/api/appointments/1
   # Should work (not 403)
   ```

5. **Check browser console errors**
   - F12 → Console tab
   - Look for red error messages
   - CORS errors will mention "origin"

---

## 🔗 API Endpoints (Should Work)

| Method | Endpoint | Should Work |
|--------|----------|-------------|
| POST | `/api/appointments/create` | ✅ Yes |
| GET | `/api/appointments/{id}` | ✅ Yes |
| POST | `/api/payment/{id}/create-payment` | ✅ Yes |
| POST | `/api/payment/verify-payment` | ✅ Yes |
| GET | `/api/payment/status/{id}` | ✅ Yes |
| GET | `/doctors` | ✅ Yes |
| GET | `/v1/patient` | ✅ Yes |

All should return data without CORS errors.

---

## 📞 Quick Troubleshooting

| Symptom | Fix |
|---------|-----|
| 403 CORS error | Restart backend: `mvn spring-boot:run` |
| "Origin not allowed" | Verify frontend URL is http://localhost:5173 |
| Network timeout | Backend not running on :8080 |
| Empty response | Check appointment ID exists in database |
| Payment fails | Check Razorpay keys in application.properties |

---

## ✅ Success Indicators

You'll know CORS is working when:

✅ Click "Pay Securely" → No error messages  
✅ Browser Network tab → Status 200 (not 403)  
✅ Backend logs → Show processing steps  
✅ Razorpay modal → Opens without blocking  
✅ Payment completes → Appointment updated  
✅ Email → Received in inbox  

---

## 🎯 Next Steps

1. **Restart both backend and frontend** (see commands above)
2. **Test payment flow** in browser
3. **Check success indicators** above
4. **If issues:** Check debug checklist
5. **Deploy:** When ready

---

*CORS configured and ready to use!* ✅
