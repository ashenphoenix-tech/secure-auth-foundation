package com.loginTemplate.authService.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthServiceHealthController {
    @GetMapping("/actuator/health")
    public String health() {
        return "OK - auth-service";
    }
}
