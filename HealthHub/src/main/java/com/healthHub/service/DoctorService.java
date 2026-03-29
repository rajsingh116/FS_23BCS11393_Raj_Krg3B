package com.healthHub.service;

import com.healthHub.entity.Doctor;
import com.healthHub.repository.DoctorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository repo;

    public DoctorService(DoctorRepository repo){
        this.repo=repo;
    }
    public List<Doctor> getDoctorsBySpecialization(String spec){
        return repo.findBySpecialization(spec);
    }


    public Page<Doctor> getDoctorsPage(int page, int size){

        Pageable pageable = PageRequest.of(page,size);

        return repo.findAll(pageable);
    }

    public List<Doctor> getNextDoctors(Long cursor,int size){

        Pageable pageable = PageRequest.of(0,size);

        return repo.findNextDoctors(cursor,pageable);
    }




}
