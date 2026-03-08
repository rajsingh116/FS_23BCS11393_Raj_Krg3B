package com.example.experiment_6.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {

    private String name;
    private int age;
    private String email;
    private String disease;
}