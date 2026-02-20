package com.loginTemplate.apiGateway.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class APIGatewayHealthController {
    @GetMapping("/actuator/health")
    public String health() {
        return "OK - api-gateway";
    }
}
