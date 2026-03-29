package com.healthHub.entity;


import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;


    private String specialization;
    private int experience;
    private Long consultationFee;

    public int getExperience() {
        return experience;
    }

    public void setExperience(int experience) {
        this.experience = experience;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public List<Appointment> getAppointments() {
        return appointments;
    }

    public void setAppointments(List<Appointment> appointments) {
        this.appointments = appointments;
    }

    public Long getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(Long consultationFee) {
        this.consultationFee = consultationFee;
    }

    @OneToMany(mappedBy = "doctor" ,cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Appointment> appointments;

}