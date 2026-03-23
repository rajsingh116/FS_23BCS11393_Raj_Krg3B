package com.Experiment_7.experiment_7.service;

import org.springframework.stereotype.Service;
import com.Experiment_7.experiment_7.entity.Appointment;
import com.Experiment_7.experiment_7.repository.AppointmentRepository;

@Service
public class AppointmentService {

  private final AppointmentRepository AppointmentRepository;

  public AppointmentService(AppointmentRepository repository) {
    this.AppointmentRepository = repository;
  }

  public void createAppointment(long doctorId, long patientId, String appointmentDate) {
    Appointment appointment = new Appointment();
    appointment.setDoctorId(doctorId);
    appointment.setPatientId(patientId);
    appointment.setAppointmentDate(appointmentDate);
    AppointmentRepository.save(appointment);
  }

  void cancelAppointment(long appointmentId) {
    AppointmentRepository.deleteById(appointmentId);
  }

  void rescheduleAppointment(long appointmentId, String newDate) {
    Appointment appointment = AppointmentRepository.findById(appointmentId).orElseThrow(() -> new RuntimeException("Appointment not found"));
    appointment.setAppointmentDate(newDate);
    AppointmentRepository.save(appointment);
  }

}
