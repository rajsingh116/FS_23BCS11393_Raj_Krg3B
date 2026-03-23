package com.Experiment_7.experiment_7.controller;

import com.Experiment_7.experiment_7.dto.PatientDTO;
import com.Experiment_7.experiment_7.entity.Patient;
import com.Experiment_7.experiment_7.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
public class PatientController {
    @Autowired
    PatientService patientService;

    private final PatientService service;

    public PatientController(PatientService service) {
        this.service = service;
    }

    @PostMapping("/addPatient")
    public Patient createPatient(@RequestBody PatientDTO dto){
        return service.createPatient(dto);
    }

    @GetMapping("/getPatients")
    public List<Patient> getAllPatients(){
        return service.getAllPatients();
    }

    @GetMapping("/{id}")
    public Patient getPatient(@PathVariable Long id){
        return service.getPatientById(id);
    }

    @DeleteMapping("/{id}")
    public String deletePatient(@PathVariable Long id){
        service.deletePatient(id);
        return "Patient Deleted";
    }
    @GetMapping("/disease")
    public List<Patient> getPatient(@RequestParam String disease) {
        return patientService.findByDisease(disease);
    }

}