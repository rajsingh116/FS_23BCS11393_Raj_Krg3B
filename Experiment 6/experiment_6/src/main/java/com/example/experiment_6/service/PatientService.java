package com.example.experiment_6.service;

import com.example.experiment_6.dto.PatientDTO;
import com.example.experiment_6.entity.Patient;
import com.example.experiment_6.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository repository;

    public PatientService(PatientRepository repository) {
        this.repository = repository;
    }

    public Patient createPatient(PatientDTO dto){

        Patient patient = new Patient();
        patient.setName(dto.getName());
        patient.setAge(dto.getAge());
        patient.setEmail(dto.getEmail());
        patient.setDisease(dto.getDisease());

        return repository.save(patient);
    }

    public List<Patient> getAllPatients(){
        return repository.findAll();
    }

    public Patient getPatientById(Long id){
        return repository.findById(id).orElseThrow();
    }

    public void deletePatient(Long id){
        repository.deleteById(id);
    }
}