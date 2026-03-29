package com.healthHub.repository;

import com.healthHub.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PatientRepository extends JpaRepository<Patient,Long> {

    @Query("SELECT p FROM Patient p WHERE p.disease= :disease")
    List<Patient> findByDisease(String disease);

}

