package com.Experiment_7.experiment_7.service;

import com.Experiment_7.experiment_7.dto.PatientDTO;
import com.Experiment_7.experiment_7.entity.Patient;
import com.Experiment_7.experiment_7.repository.PatientRepository;
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
    public List<Patient> findByDisease(String disease) {
        // You can add business logic here (e.g., logging or validation)
        return repository.findByDisease(disease);
    }
}