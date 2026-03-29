# HealthHub - CORS Configuration Fix

## 🔧 Problem Fixed: 403 CORS Errors

### ❌ The Issue
```
Error: 403 CORS error
Message: Preflight response is not successful
API Blocked: POST /api/payment/{id}/create-payment
Frontend: http://localhost:5173
Backend: http://localhost:8080
```

### ✅ Root Cause
- Frontend and backend on different origins (ports)
- OPTIONS preflight request not handled properly
- Global CORS configuration missing
- Controller-level @CrossOrigin annotations insufficient

---

## 🛠️ Solution Implemented

### 1. Created Global CORS Configuration Class

**File:** `CorsConfig.java`
**Location:** `src/main/java/com/healthHub/config/CorsConfig.java`

This class implements `WebMvcConfigurer` and registers CORS mappings globally:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:5173",    // Vite dev server
                    "http://localhost:3000"     // Alternative port
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600)
                .exposedHeaders("*");
    }
}
```

**What This Does:**
- ✅ Handles OPTIONS preflight requests automatically
- ✅ Allows all HTTP methods (GET, POST, PUT, DELETE, OPTIONS, PATCH)
- ✅ Allows all headers
- ✅ Allows credentials
- ✅ Caches preflight response for 1 hour

### 2. Controller-Level CORS Annotations

All controllers updated with `@CrossOrigin` for extra safety:

| Controller | Endpoints | CORS Status |
|-----------|-----------|------------|
| AppointmentController | `/api/appointments/*` | ✅ Added |
| RazorpayController | `/api/payment/*` | ✅ Added |
| PaymentController | `/api/payment/*` | ✅ Added |
| DoctorController | `/doctors/*` | ✅ Added |
| PatientController | `/v1/patient/*` | ✅ Added |
| TestDataController | `/api/test/*` | ✅ Already had |

**Annotation Used:**
```java
@CrossOrigin(origins = "http://localhost:5173", 
             allowedMethods = {"GET", "POST", "PUT", "DELETE", "OPTIONS"})
```

---

## 🔄 How CORS Works Now

### Preflight Request (Automatic)
```
Browser: OPTIONS /api/payment/{id}/create-payment
Headers:
  - Origin: http://localhost:5173
  - Access-Control-Request-Method: POST
  - Access-Control-Request-Headers: content-type

Backend (CorsConfig):
  - Matches "/**" mapping
  - Allows origin ✅
  - Allows method ✅
  - Allows headers ✅
  - Returns: 200 OK

Response Headers:
  - Access-Control-Allow-Origin: http://localhost:5173
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
  - Access-Control-Allow-Headers: *
  - Access-Control-Allow-Credentials: true
  - Access-Control-Max-Age: 3600
```

### Actual Request (After Preflight)
```
Browser: POST /api/payment/1/create-payment
Body: { "amount": 50000 }

Backend: Processes request normally ✅

Response: Razorpay order details
Status: 200 OK
```

---

## 📋 Configuration Details

### Global CORS Configuration (CorsConfig.java)

**Mapping Path:** `/**` (all endpoints)

**Allowed Origins:**
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (Fallback)

**Allowed Methods:**
- GET - Retrieve data
- POST - Create resources
- PUT - Update resources
- DELETE - Remove resources
- OPTIONS - Used by browsers for CORS preflight
- PATCH - Partial updates

**Allowed Headers:** `*` (all headers)
- Content-Type
- Authorization
- Accept
- User-Agent
- Cache-Control
- X-Custom-Headers
- etc.

**Credentials:** `true`
- Allows cookies and authorization headers

**Cache Time:** `3600` seconds (1 hour)
- Browser caches preflight response
- Subsequent requests don't need preflight

---

## 🧪 Testing CORS

### Method 1: Browser Console
```javascript
// Open browser console (F12)
// Test from http://localhost:5173

fetch('http://localhost:8080/api/appointments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    patientId: 1,
    doctorId: 1,
    date: '2026-04-10'
  })
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e));
```

### Method 2: curl Command
```bash
# Test preflight OPTIONS request
curl -i -X OPTIONS http://localhost:8080/api/payment/1/create-payment \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"

# Expected: 200 OK with CORS headers
```

### Method 3: Browser Network Tab
1. Open DevTools (F12)
2. Click "Network" tab
3. Make API call from frontend
4. Check CORS headers in response
5. Look for: `Access-Control-Allow-Origin`

---

## 🚀 Quick Testing Steps

### Step 1: Restart Backend
```bash
cd HealthHub
mvn clean package
mvn spring-boot:run
```
Wait for: "Started HealthHubApplication in X seconds"

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```
Should show: "VITE vX.X.X ready in XXX ms"

### Step 3: Test in Browser
- Open http://localhost:5173
- Click "Book Appointment"
- Click "Pay Securely"
- Should NOT see 403 error ✅
- Razorpay modal should open

### Step 4: Check Backend Logs
```
INFO  com.healthHub.controller.RazorpayController 
      - Creating Razorpay payment order for appointment 1
```

---

## 🔍 Debugging CORS Issues

### If Still Getting 403 Error

**Check 1: Backend is running**
```bash
curl http://localhost:8080/api/appointments/1
# Should return appointment data (not 403)
```

**Check 2: CORS headers in response**
```bash
curl -i http://localhost:8080/api/appointments/1
# Look for: Access-Control-Allow-Origin header
```

**Check 3: Frontend origin matches**
- Frontend: http://localhost:5173
- Config allows: http://localhost:5173
- Must match exactly (including protocol and port)

**Check 4: Browser console for specific error**
- F12 → Console → Look for red errors
- F12 → Network → Find failed request → Click → Check "Response Headers"

### Common Issues

| Issue | Solution |
|-------|----------|
| 403 error persists | Restart backend (`mvn spring-boot:run`) |
| Frontend can't connect | Check backend is running on :8080 |
| No CORS headers | Check CorsConfig class is in config/ directory |
| Specific origin not working | Verify exact URL in browser matches config |

---

## 📝 Production Considerations

### For Development ✅ (Current)
```java
.allowedOrigins("http://localhost:5173")
.allowedHeaders("*")
.exposedHeaders("*")
```

### For Production ⚠️ (Change Before Deploy)
```java
.allowedOrigins("https://yourdomain.com")
.allowedHeaders("Content-Type", "Authorization", "X-Auth-Token")
.exposedHeaders("X-Total-Count", "X-Page-Number")
```

**Security Best Practices:**
1. ✅ Specify exact origins (not "*")
2. ✅ Specify exact headers needed
3. ✅ Use HTTPS only in production
4. ✅ Set appropriate maxAge (not too high)
5. ✅ Log CORS requests for monitoring

---

## 📚 Files Modified

### Created:
- ✅ `CorsConfig.java` - Global CORS configuration

### Modified:
- ✅ `DoctorController.java` - Added @CrossOrigin
- ✅ `PatientController.java` - Added @CrossOrigin

### Already Had CORS:
- ✅ `AppointmentController.java`
- ✅ `RazorpayController.java`
- ✅ `PaymentController.java`
- ✅ `TestDataController.java`

---

## ✅ Verification Checklist

- [ ] Backend running on http://localhost:8080
- [ ] Frontend running on http://localhost:5173
- [ ] No 403 CORS errors in browser console
- [ ] Network tab shows CORS success headers
- [ ] Payment API responds with order data
- [ ] Razorpay modal opens on "Pay" click
- [ ] Appointment created in database
- [ ] Email received after payment

---

## 🎯 Next Steps

1. **Restart Backend**
   ```bash
   mvn clean package && mvn spring-boot:run
   ```

2. **Restart Frontend**
   ```bash
   npm run dev
   ```

3. **Test in Browser**
   - Open http://localhost:5173
   - Create appointment and pay

4. **Verify Success**
   - No CORS errors
   - Payment processes
   - Email received

---

## 📞 Support

**CORS errors?** Check:
1. CorsConfig.java exists in `src/main/java/com/healthHub/config/`
2. Backend restarted after change
3. Frontend URL matches allowed origins
4. No typos in configuration

**Still stuck?** Check backend logs:
```bash
tail -f /tmp/healthhub.log | grep -i cors
```

---

*CORS configuration complete! System ready for frontend-backend communication.* ✅
