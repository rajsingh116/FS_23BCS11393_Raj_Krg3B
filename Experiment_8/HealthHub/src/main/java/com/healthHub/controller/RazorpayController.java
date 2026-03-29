package com.healthHub.controller;

import com.healthHub.repository.AppointmentRepository;
import com.healthHub.service.RazorpayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * RazorpayController handles payment processing endpoints.
 * 
 * ENDPOINTS:
 * - POST /{id}/create-payment → Creates Razorpay order (Stage 2, called from AppointmentController)
 * - POST /verify-payment → Verifies payment signature (Stage 4, called from frontend)
 * - GET /status/{id} → Check payment status (helper endpoint)
 */
@RestController
@RequestMapping("/api/payment")
@CrossOrigin("http://localhost:5173")
public class RazorpayController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayController.class);

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    /**
     * Stage 2: Create payment order.
     * Frontend sends appointment ID. Backend creates Razorpay order.
     * Called from: /api/appointments/{id}/create-payment
     */
    @PostMapping("/{id}/create-payment")
    public ResponseEntity<?> createPayment(@PathVariable("id") Long id, @RequestBody(required = false) Map<String, Object> body) {
        try {
            Long overrideAmountInPaise = null;
            if (body != null && body.get("amount") != null) {
                try {
                    // accept amount as number (paise) or string
                    Object amtObj = body.get("amount");
                    if (amtObj instanceof Number) {
                        overrideAmountInPaise = ((Number) amtObj).longValue();
                    } else {
                        overrideAmountInPaise = Long.parseLong(amtObj.toString());
                    }
                } catch (Exception ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "invalid amount"));
                }
            }

            log.info("Creating Razorpay payment order for appointment {}", id);
            Map<String, Object> resp = razorpayService.createOrderForAppointment(id, overrideAmountInPaise);
            log.info("Payment order created successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Error creating payment order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Stage 4: Verify payment signature and update appointment.
     * Frontend sends: appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature
     * Backend: verifies signature, updates appointment, sends email (async)
     */
    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> payload) {
        try {
            Object appointmentIdObj = payload.get("appointmentId");
            Object orderIdObj = payload.get("razorpay_order_id");
            Object paymentIdObj = payload.get("razorpay_payment_id");
            Object signatureObj = payload.get("razorpay_signature");

            if (appointmentIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "appointmentId missing"));
            }

            Long appointmentId;
            if (appointmentIdObj instanceof Number) {
                appointmentId = ((Number) appointmentIdObj).longValue();
            } else {
                appointmentId = Long.parseLong(appointmentIdObj.toString());
            }

            String orderId = orderIdObj != null ? orderIdObj.toString() : null;
            String paymentId = paymentIdObj != null ? paymentIdObj.toString() : null;
            String signature = signatureObj != null ? signatureObj.toString() : null;

            log.info("Verifying payment for appointment {} with paymentId {}", appointmentId, paymentId);
            boolean valid = razorpayService.verifyAndNotify(appointmentId, orderId, paymentId, signature);

            if (valid) {
                log.info("Payment verified successfully for appointment {}", appointmentId);
                return ResponseEntity.ok(Map.of("status", "success"));
            } else {
                log.warn("Payment verification failed for appointment {}: signature mismatch", appointmentId);
                return ResponseEntity.badRequest().body(Map.of("status", "failed", "reason", "signature_mismatch"));
            }

        } catch (Exception e) {
            log.error("Error verifying payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Helper: Query payment status by appointment ID.
     * Returns: paymentStatus, razorpayOrderId, razorpayPaymentId
     */
    @GetMapping("/status/{appointmentId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable("appointmentId") Long appointmentId) {
        try {
            log.info("Fetching payment status for appointment {}", appointmentId);
            return appointmentRepository.findById(appointmentId)
                    .map(appt -> {
                        log.info("Payment status for appointment {}: {}", appointmentId, appt.getPaymentStatus());
                        return ResponseEntity.ok(Map.of(
                                "appointmentId", appt.getId(),
                                "paymentStatus", appt.getPaymentStatus(),
                                "razorpayOrderId", appt.getRazorpayOrderId(),
                                "razorpayPaymentId", appt.getRazorpayPaymentId()
                        ));
                    })
                    .orElseGet(() -> {
                        log.warn("Appointment {} not found", appointmentId);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error fetching payment status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}