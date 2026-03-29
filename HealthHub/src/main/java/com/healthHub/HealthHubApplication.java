package com.healthHub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EnableAsync
@EnableRetry
public class HealthHubApplication {

	public static void main(String[] args) {
		SpringApplication.run(HealthHubApplication.class, args);
	}

}
