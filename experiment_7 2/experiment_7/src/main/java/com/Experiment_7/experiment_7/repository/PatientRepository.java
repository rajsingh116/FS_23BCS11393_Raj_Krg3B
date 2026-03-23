package com.Experiment_7.experiment_7.repository;

import com.Experiment_7.experiment_7.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    @Query("SELECT p FROM Patient p WHERE p.disease = :disease")
    List<Patient> findByDisease(@Param("disease") String disease);
}