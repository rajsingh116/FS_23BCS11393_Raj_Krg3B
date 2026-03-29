package com.healthHub.repository;

import com.healthHub.entity.Doctor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface DoctorRepository extends JpaRepository<Doctor,Long>{



    @Query("SELECT d FROM Doctor d WHERE d.specialization = :spec")
    List<Doctor> findBySpecialization(@Param("spec") String spec);

    @Query("SELECT d FROM Doctor d WHERE d.experience > :exp")
    List<Doctor> findExperiencedDoctors(@Param("exp") int exp);

    @Query("SELECT d FROM Doctor d ORDER BY d.experience DESC")
    List<Doctor> findTopDoctors();



    @Query("SELECT d FROM Doctor d WHERE d.id > :cursor ORDER BY d.id ASC")
    List<Doctor> findNextDoctors(@Param("cursor") Long cursor, Pageable pageable);


}
