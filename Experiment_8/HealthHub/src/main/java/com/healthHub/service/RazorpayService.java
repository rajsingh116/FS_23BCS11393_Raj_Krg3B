package com.healthHub.service;

import com.healthHub.config.RazorpayConfig;
import com.healthHub.entity.Appointment;
import com.healthHub.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import com.healthHub.dto.PaymentEmailDTO;
import com.healthHub.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private RazorpayConfig razorpayConfig;

    @Autowired
    private EmailService emailService;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> createOrderForAppointment(Long appointmentId, Long overrideAmountInPaise) throws Exception {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));

        long amountInPaise;

        if (overrideAmountInPaise != null && overrideAmountInPaise > 0) {
            amountInPaise = overrideAmountInPaise;
        } else {
            if (appt.getDoctor() == null) {
                throw new RuntimeException("Appointment has no doctor assigned");
            }

            Long fee = appt.getDoctor().getConsultationFee();
            if (fee == null) {
                throw new RuntimeException("Doctor consultation fee not set");
            }

            amountInPaise = fee * 100L;
        }

        String url = "https://api.razorpay.com/v1/orders";

        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountInPaise);
        body.put("currency", "INR");
        body.put("receipt", "appointment_" + appointmentId);
        body.put("payment_capture", 1);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String auth = razorpayConfig.getKeyId() + ":" + razorpayConfig.getKeySecret();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encodedAuth);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        log.info("Creating Razorpay order for appointment {} with amount {} paise", appointmentId, amountInPaise);
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = restTemplate.postForObject(url, request, Map.class);

        log.info("Razorpay create order response for appointment {}: {}", appointmentId, resp);

        if (resp == null || resp.get("id") == null) {
            throw new RuntimeException("Failed to create Razorpay order");
        }

        String razorpayOrderId = resp.get("id").toString();

        appt.setRazorpayOrderId(razorpayOrderId);
        appt.setPaymentStatus("CREATED");
        appointmentRepository.save(appt);

        Map<String, Object> result = new HashMap<>();
        result.put("razorpayOrderId", razorpayOrderId);
        result.put("amount", amountInPaise);
        result.put("currency", "INR");
        result.put("keyId", razorpayConfig.getKeyId());

        return result;
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) throws Exception {
        String payload = orderId + "|" + paymentId;

        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(razorpayConfig.getKeySecret().getBytes(), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] digest = mac.doFinal(payload.getBytes());
        String generatedHex = bytesToHex(digest);
        String generatedBase64 = Base64.getEncoder().encodeToString(digest);

        log.info("Verifying signature. Payload='{}' generatedHex='{}' generatedBase64='{}' incoming='{}'", payload, generatedHex, generatedBase64, signature);

        // Accept either hex (common) or base64 encoded HMAC digests to be tolerant
        return generatedHex.equalsIgnoreCase(signature) || generatedBase64.equals(signature);
    }

    /**
     * Verify payment signature, update appointment state and send confirmation email (service layer).
     */
    public boolean verifyAndNotify(Long appointmentId, String orderId, String paymentId, String signature) throws Exception {
        boolean valid = verifySignature(orderId, paymentId, signature);

        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (valid) {
            appt.setPaymentStatus("SUCCESS");
            appt.setRazorpayPaymentId(paymentId);
            appt.setRazorpayOrderId(orderId);
            appointmentRepository.save(appt);

            // Build email DTO and send asynchronously
            try {
                PaymentEmailDTO dto = new PaymentEmailDTO();
                if (appt.getPatient() != null) {
                    dto.setPatientName(appt.getPatient().getName());
                    dto.setPatientEmail(appt.getPatient().getEmail());
                }
                dto.setTransactionId(paymentId);
                dto.setAppointmentId(appt.getId());

                Long amountInPaise = null;
                if (appt.getDoctor() != null && appt.getDoctor().getConsultationFee() != null) {
                    amountInPaise = appt.getDoctor().getConsultationFee() * 100L;
                }
                dto.setAmountInPaise(amountInPaise);

                if (dto.getPatientEmail() != null && !dto.getPatientEmail().isBlank()) {
                    emailService.sendPaymentConfirmation(dto);
                } else {
                    log.warn("No patient email configured for appointment {} - skipping email", appt.getId());
                }
            } catch (Exception ex) {
                log.error("Failed to prepare/send payment email for appointment {}: {}", appt.getId(), ex.getMessage(), ex);
            }

        } else {
            appt.setPaymentStatus("FAILED");
            appointmentRepository.save(appt);
        }

        return valid;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
