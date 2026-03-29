package com.healthHub.controller;

import com.healthHub.entity.Doctor;
import com.healthHub.repository.DoctorRepository;
import com.healthHub.service.DoctorService;

import org.springframework.data.domain.Page;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {


    DoctorService doctorService;
    private final DoctorRepository repo;
    public DoctorController(DoctorRepository repo ,DoctorService doctorService){
        this.repo = repo;
        this.doctorService = doctorService;
    }

    @PostMapping
    public Doctor addDoctor(@RequestBody Doctor doctor){
        return repo.save(doctor);
    }
    @GetMapping
    public List<Doctor> getDoctors(){
        return repo.findAll();
    }

    @GetMapping("/specialization/{spec}")
    public List<Doctor> getBySpecialization(@PathVariable String spec){
        return doctorService.getDoctorsBySpecialization(spec);
    }

    @GetMapping("/page")
    public Page<Doctor> getDoctorsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue =  "2") int size){

        return doctorService.getDoctorsPage(page,size);
    }

    @GetMapping("/cursor")
    public List<Doctor> getNextDoctors(
            @RequestParam Long cursor,
            @RequestParam int size){

        return doctorService.getNextDoctors(cursor,size);
    }


}

