package com.Experiment_7.experiment_7.dto;

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