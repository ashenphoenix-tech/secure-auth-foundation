package com.loginTemplate.authService.DTO;
import org.springframework.http.HttpStatus;
import java.util.Map;

public record AuthResponse(HttpStatus statusCode, Map<Object, Object> responseData, String responseMessage, Integer responseStatus){};
