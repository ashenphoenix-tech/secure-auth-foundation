package com.loginTemplate.authService.controllers;

import com.loginTemplate.authService.DTO.AuthResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    //throw 400 when arguments are not fulfilled in API request
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthResponse> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<Object, Object> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors()
                .forEach(error ->
                        errors.put(error.getField(), error.getDefaultMessage())
                );

        AuthResponse response = new AuthResponse(
                HttpStatus.BAD_REQUEST,
                errors,
                "Validation Failed",
                400
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    //throw 405 when user sends request with wrong HTTP verb
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<AuthResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {

        AuthResponse response = new AuthResponse(
                HttpStatus.METHOD_NOT_ALLOWED,
                Map.of(),
                "HTTP method not allowed for this endpoint",
                405
        );

        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(response);
    }

}

