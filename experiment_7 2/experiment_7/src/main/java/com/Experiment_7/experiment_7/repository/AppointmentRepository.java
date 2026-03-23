package com.Experiment_7.experiment_7.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Experiment_7.experiment_7.entity.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

  
}