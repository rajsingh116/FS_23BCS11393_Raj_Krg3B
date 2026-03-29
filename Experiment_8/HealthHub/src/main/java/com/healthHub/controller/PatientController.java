package com.healthHub.controller;

import com.healthHub.dto.PatientDTO;
import com.healthHub.entity.Patient;
import com.healthHub.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/patient")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientController {
    PatientService patientService;
    public PatientController(PatientService patientService){
        this.patientService = patientService;
    }
    @PostMapping
    public ResponseEntity<?> createPatient(@Valid @RequestBody PatientDTO patientDTO,
                                           BindingResult result){
        if (result.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            result.getFieldErrors().forEach(error ->
                    errors.put(error.getField(), error.getDefaultMessage())
            );
            return ResponseEntity.badRequest().body(errors);
        }
        PatientDTO dto =  patientService.createPatient(patientDTO);
     return ResponseEntity.ok(dto);
    }
    // API URL   // GET http://localhost:8080/v1/patient
    @GetMapping
    public List<Patient> getAllPatients(){
        return patientService.getAllPatients();
    }
    @GetMapping("/disease")
    public List<Patient> getPatient(@RequestParam String disease){
        return patientService.findByDisease(disease);
    }





}
