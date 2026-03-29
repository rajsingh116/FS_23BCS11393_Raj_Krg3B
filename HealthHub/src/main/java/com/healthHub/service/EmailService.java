package com.healthHub.service;

import com.healthHub.dto.PaymentEmailDTO;

public interface EmailService {
    void sendPaymentConfirmation(PaymentEmailDTO dto);
}
