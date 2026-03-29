package com.healthHub.service;

import com.healthHub.dto.PaymentEmailDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:no-reply@healthhub.example}")
    private String mailFrom;

    // Sends a payment confirmation email using Thymeleaf HTML template. Runs async with retry.
    @Override
    @Async
    @Retryable(
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2.0),
        retryFor = {Exception.class},
        noRetryFor = {IllegalArgumentException.class}
    )
    public void sendPaymentConfirmation(PaymentEmailDTO dto) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            Context ctx = new Context();
            ctx.setVariable("name", dto.getPatientName());
            ctx.setVariable("amountInPaise", dto.getAmountInPaise());
            ctx.setVariable("amountInRupees", String.format("%.2f", dto.getAmountInPaise() / 100.0));
            ctx.setVariable("transactionId", dto.getTransactionId());
            ctx.setVariable("appointmentId", dto.getAppointmentId());

            String html = templateEngine.process("payment-confirmation", ctx);

            helper.setText(html, true);
            helper.setTo(dto.getPatientEmail());
            helper.setSubject("Payment Confirmation - Appointment " + dto.getAppointmentId());
            helper.setFrom(mailFrom);

            mailSender.send(message);
            log.info("Payment confirmation email sent to {} for appointment {}", dto.getPatientEmail(), dto.getAppointmentId());
        }catch(Exception ex) {
            log.error("Failed to send email to {} for appointment {}. Error: {}", dto.getPatientEmail(), dto.getAppointmentId(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to send email: " + ex.getMessage(), ex);
        }
    }
}