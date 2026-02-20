package com.loginTemplate.authService.service;

import com.loginTemplate.authService.DTO.AuthResponse;
import com.loginTemplate.authService.DTO.LoginRequest;
import com.loginTemplate.authService.DTO.SignUpRequest;
import com.loginTemplate.authService.entity.User;
import com.loginTemplate.authService.exceptions.CustomException;
import com.loginTemplate.authService.repositories.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
/*
* Change this service according to your business logic of validating user details
* */
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User validateCredentials(LoginRequest request) {

        // Find user by email or username
        User user = userRepository
                .findByEmailOrUsername(
                        request.identifier(),
                        request.identifier()
                )
                .orElseThrow(() ->
                        new CustomException.InvalidCredentialsException("Invalid credentials")
                );

        if (!user.isEnabled()) {
            throw new CustomException.InvalidCredentialsException("User account is disabled");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new CustomException.InvalidCredentialsException("Invalid credentials");
        }

        return user;
    }

    public AuthResponse authenticateUser(LoginRequest request) {

        try {
            User user = validateCredentials(request);

            return new AuthResponse(
                    HttpStatus.OK,
                    Map.of(
                            "userId", user.getId().toString(),
                            "userName", user.getUsername(),
                            "userMail", user.getEmail(),
                            "userRoles", user.getRoles()
                    ),
                    "Login successful",
                    0
            );

        } catch (CustomException.InvalidCredentialsException e) {
            return new AuthResponse(
                    HttpStatus.BAD_REQUEST,
                    null,
                    e.getMessage(),
                    1
            );
        } catch (Exception e) {
            return new AuthResponse(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    null,
                    "Something went wrong: " + e.getMessage(),
                    1
            );
        }
    }


    public AuthResponse getRoles(String userId) {

        try {
            User user = userRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() ->
                            new CustomException.UserNotFoundException("User not found")
                    );

            return new AuthResponse(HttpStatus.OK, Map.of("userRoles",user.getRoles()), "Roles Fetched", 0);

        } catch (CustomException.UserNotFoundException e) {
            return new AuthResponse(HttpStatus.NOT_FOUND, null, e.getMessage(), 1);
        }
    }

    @Transactional(rollbackOn = Exception.class)
    public AuthResponse registerUser(SignUpRequest request) {

        try {
            // Check if email already exists
            if (userRepository.findByEmail(request.email()).isPresent()) {
                throw new CustomException.EmailAlreadyExistsException("Email already in use");
            }

            // Check if username already exists
            if (userRepository.findByUsername(request.userName()).isPresent()) {
                throw new CustomException.UsernameAlreadyExistsException("Username already taken");
            }

            // Create user
            User user = User.builder()
                    .email(request.email())
                    .username(request.userName())
                    .password(passwordEncoder.encode(request.password()))
                    .roles(Set.of("ROLE_USER")) //every user gets default role, later you can manually change it from database, whom to assign admin role for example
                    .enabled(true)
                    .build();
            userRepository.save(user);
            return new AuthResponse(HttpStatus.CREATED, Map.of("userName",user.getUsername(),"userMail",user.getEmail(), "userRoles",user.getRoles()),"Created User : "+user.getUsername(),0);

        } catch (CustomException.EmailAlreadyExistsException e) {
            return new AuthResponse(HttpStatus.BAD_REQUEST, null,"Email Already In Use",1);
        } catch (CustomException.UsernameAlreadyExistsException e) {
            return new AuthResponse(HttpStatus.BAD_REQUEST, null,"Username Already Taken",1);
        } catch (Exception e) {
            return new AuthResponse(HttpStatus.INTERNAL_SERVER_ERROR, null,"Something Went Wrong "+e.getMessage(),1);
        }
    }

}
