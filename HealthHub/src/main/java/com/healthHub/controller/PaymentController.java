package com.healthHub.controller;

import com.healthHub.repository.AppointmentRepository;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin("http://localhost:5173")
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> data) throws Exception {
        System.out.println("request recieved ************** ");
        Long amount = Long.parseLong(data.get("amount").toString());

        PaymentIntentCreateParams params =
                PaymentIntentCreateParams.builder()

                        .setAmount(amount * 100) // paise
                        .setCurrency("inr")
                        .build();

        PaymentIntent intent = PaymentIntent.create(params);
        System.out.println(intent.getStatus());

        return ResponseEntity.ok(Map.of(
                "clientSecret", intent.getClientSecret()
        ));
    }


}
