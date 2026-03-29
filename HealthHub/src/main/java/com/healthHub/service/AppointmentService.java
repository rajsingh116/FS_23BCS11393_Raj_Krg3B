package com.healthHub.service;

import com.healthHub.dto.AppointmentRequest;
import com.healthHub.entity.Appointment;
import com.healthHub.entity.Doctor;
import com.healthHub.entity.Patient;
import com.healthHub.repository.AppointmentRepository;
import com.healthHub.repository.DoctorRepository;
import com.healthHub.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * AppointmentService handles appointment booking.
 * 
 * CORRECT FLOW:
 * 1. Create Appointment with paymentStatus=CREATED (BEFORE payment)
 * 2. Return appointment ID to frontend
 * 3. Frontend initiates Razorpay payment using appointment ID
 * 4. After payment success, RazorpayService updates appointment with payment details
 */
@Service
public class AppointmentService {
    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    /**
     * Stage 1: Create appointment BEFORE payment. This saves the appointment
     * with paymentStatus='CREATED' and returns appointment ID to frontend.
     * 
     * @param request Contains patientId, doctorId, appointmentDate
     * @return Map with appointmentId (used for payment)
     * @throws RuntimeException if patient or doctor not found
     */
    public Map<String, Object> createAppointmentForPayment(AppointmentRequest request) throws Exception {
        log.info("Creating appointment for patient {} with doctor {} on date {}", 
                 request.getPatientId(), request.getDoctorId(), request.getDate());

        // Validate patient exists
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found: " + request.getPatientId()));

        // Validate doctor exists
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + request.getDoctorId()));

        // Create appointment with CREATED status (payment not yet done)
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(request.getDate());
        appointment.setPaymentStatus("CREATED");

        // Save appointment to database
        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment created with ID: {} and status: CREATED", saved.getId());

        // Return appointment ID to frontend (used for Razorpay order creation)
        Map<String, Object> response = new HashMap<>();
        response.put("appointmentId", saved.getId());
        response.put("patientName", patient.getName());
        response.put("doctorName", doctor.getName());
        response.put("consultationFee", doctor.getConsultationFee());
        response.put("appointmentDate", saved.getAppointmentDate());

        return response;
    }

    /**
     * Retrieve appointment by ID (used to fetch details after payment verification).
     */
    public Appointment getAppointmentById(Long appointmentId) throws Exception {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));
    }
}
