package com.healthHub.service;

import com.healthHub.dto.PatientDTO;
import com.healthHub.entity.Patient;
import com.healthHub.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    @Autowired
    PatientRepository patientRepository;


    public PatientDTO createPatient(PatientDTO patientDTO) {
        Patient patient = mapToEntity(patientDTO);
        Patient savedPatient = patientRepository.save(patient);
        PatientDTO savedDto = mapToDto(savedPatient);
        return savedDto;
    }
    public Patient mapToEntity(PatientDTO patientDTO){
        Patient patient = new Patient();
        patient.setName(patientDTO.getName());
        patient.setAge(patientDTO.getAge());
        patient.setDisease(patientDTO.getDisease());
        return patient;
    }
    public PatientDTO mapToDto(Patient patient){
        PatientDTO dto = new PatientDTO();
        dto.setName(patient.getName());
        dto.setAge(patient.getAge());
        dto.setDisease(patient.getDisease());
        return dto;
    }

    public List<Patient> getAllPatients() {
        List<Patient> allPatient = patientRepository.findAll();
        return allPatient;
    }
    public List<Patient> findByDisease(String disease){
        return patientRepository.findByDisease(disease);
    }




}
