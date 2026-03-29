package com.healthHub.controller;

import com.healthHub.entity.Appointment;
import com.healthHub.entity.Doctor;
import com.healthHub.entity.Patient;
import com.healthHub.repository.AppointmentRepository;
import com.healthHub.repository.DoctorRepository;
import com.healthHub.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin("http://localhost:5173")
public class TestDataController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @PostMapping("/create-dummy-appointment")
    public ResponseEntity<?> createDummy(@RequestParam(required = false, defaultValue = "500") Long fee) {
        Doctor d = new Doctor();
        d.setName("Dr. Test");
        d.setSpecialization("General");
        d.setExperience(5);
        d.setConsultationFee(fee);
        doctorRepository.save(d);

        Patient p = new Patient();
        p.setName("Test Patient");
        p.setDisease("None");
        patientRepository.save(p);

        Appointment appt = new Appointment();
        appt.setDoctor(d);
        appt.setPatient(p);
        appt.setPaymentStatus("NEW");
        appointmentRepository.save(appt);

        return ResponseEntity.ok(java.util.Map.of("appointmentId", appt.getId(), "doctorId", d.getId(), "patientId", p.getId(), "fee", fee));
    }
}
