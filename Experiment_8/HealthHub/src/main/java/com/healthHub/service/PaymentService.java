package com.healthHub.service;

import com.healthHub.dto.PaymentRequest;
import com.healthHub.entity.Appointment;
import com.healthHub.repository.AppointmentRepository;
import com.healthHub.repository.DoctorRepository;
import com.healthHub.repository.PatientRepository;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {


    @Autowired
    private AppointmentRepository repo;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

//    @Autowired
//    private PaymentService paymentService;

    public String bookAppointment(PaymentRequest request) throws Exception {

    //ONLY VERIFY payment
        PaymentIntent intent = PaymentIntent.retrieve(request.getPaymentIntentId());

        System.out.println("STATUS: " + intent.getStatus());

        if (!"succeeded".equals(intent.getStatus())) {
            throw new RuntimeException("Payment not successful");
        }

        // Save appointment
        Appointment appt = new Appointment();

        appt.setPatient(patientRepository.findById(request.getPatientId()).get());
        appt.setDoctor(doctorRepository.findById(request.getDoctorId()).get());
        appt.setAppointmentDate(request.getDate());

        appt.setPaymentIntentId(request.getPaymentIntentId());
        appt.setPaymentStatus("SUCCESS");

        repo.save(appt);

        return "Appointment booked successfully";
    }



}
