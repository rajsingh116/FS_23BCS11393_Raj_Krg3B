package com.Experiment_7.experiment_7.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Experiment_7.experiment_7.entity.Doctor;


@Repository
public interface DoctorRepository extends JpaRepository<Doctor,Long> {

  
}
