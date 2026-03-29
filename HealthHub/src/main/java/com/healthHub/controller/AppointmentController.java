package com.healthHub.controller;

import com.healthHub.dto.AppointmentRequest;
import com.healthHub.service.AppointmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AppointmentController handles appointment booking flow.
 * 
 * FLOW:
 * Stage 1: POST /api/appointments/create → Create appointment (saves to DB)
 * Stage 2: POST /api/payment/{id}/create-payment → Create Razorpay order
 * Stage 3: User completes payment on Razorpay modal
 * Stage 4: POST /api/payment/verify-payment → Verify signature & send email
 * 
 * ENDPOINTS:
 * - POST /create → Stage 1 (create appointment)
 * - GET /{id} → Get appointment details
 * 
 * Payment endpoints moved to RazorpayController (/api/payment/*).
 */
@RestController
@RequestMapping("/api/appointments")
@CrossOrigin("http://localhost:5173")
public class AppointmentController {
    private static final Logger log = LoggerFactory.getLogger(AppointmentController.class);

    @Autowired
    private AppointmentService appointmentService;

    /**
     * Stage 1: Create appointment (BEFORE payment).
     * Frontend sends patient, doctor, and appointment date.
     * Returns appointmentId (used for Razorpay order creation).
     * 
     * Request: { "patientId": 1, "doctorId": 1, "date": "2026-04-10" }
     * Response: { "appointmentId": 1, "patientName": "Prabhakar", "doctorName": "Dr. Sharma", 
     *             "consultationFee": 500, "appointmentDate": "2026-04-10" }
     */
    @PostMapping("/create")
    public ResponseEntity<?> createAppointment(@RequestBody AppointmentRequest request) {
        try {
            log.info("Received request to create appointment: {}", request);
            Map<String, Object> response = appointmentService.createAppointmentForPayment(request);
            log.info("Appointment created successfully with ID: {}", response.get("appointmentId"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating appointment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get appointment details by ID.
     * Returns: appointment details including payment status.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointment(@PathVariable("id") Long id) {
        try {
            log.info("Fetching appointment {}", id);
            var appointment = appointmentService.getAppointmentById(id);
            return ResponseEntity.ok(Map.of(
                    "id", appointment.getId(),
                    "patientName", appointment.getPatient() != null ? appointment.getPatient().getName() : "Unknown",
                    "doctorName", appointment.getDoctor() != null ? appointment.getDoctor().getName() : "Unknown",
                    "appointmentDate", appointment.getAppointmentDate(),
                    "paymentStatus", appointment.getPaymentStatus(),
                    "razorpayOrderId", appointment.getRazorpayOrderId(),
                    "razorpayPaymentId", appointment.getRazorpayPaymentId()
            ));
        } catch (Exception e) {
            log.error("Error fetching appointment {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}

