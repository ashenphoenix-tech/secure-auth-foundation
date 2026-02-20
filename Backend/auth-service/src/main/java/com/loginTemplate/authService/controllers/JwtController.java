package com.loginTemplate.authService.controllers;

import com.loginTemplate.authService.DTO.AuthResponse;
import com.loginTemplate.authService.DTO.LoginRequest;
import com.loginTemplate.authService.DTO.SignUpRequest;
import com.loginTemplate.authService.service.JwtService;
import com.loginTemplate.authService.service.UserService;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/auth")
public class JwtController {

    private final JWKSet jwkSet;
    private final JwtService jwtService;
    private final UserService userService;

    public JwtController(JWKSet jwkSet,JwtService jwtService, UserService userService) {
        this.jwkSet = jwkSet;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @GetMapping(value = "/.well-known/jwks.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public String jwks() {
        return jwkSet.toJSONObject(true).toString();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {

        try {
            // 1. Validate user credentials
            AuthResponse authResponse = userService.authenticateUser(request);

            if (authResponse.responseStatus() == 1) {
                return ResponseEntity
                        .status(authResponse.statusCode())
                        .body(authResponse);
            }

            // 2. Generate tokens & return in case of error
                //Access Token
                AuthResponse accessTokenCreationResponse = jwtService.createAccessToken(authResponse.responseData().get("userId").toString(),Map.of("roles", authResponse.responseData().get("userRoles")));
                if(accessTokenCreationResponse.responseStatus() == 1){
                    return ResponseEntity.status(accessTokenCreationResponse.statusCode()).body(accessTokenCreationResponse);
                }

                //Refresh Token
                AuthResponse refreshTokenResponse = jwtService.createRefreshToken(request.identifier());
                if(refreshTokenResponse.responseStatus() == 1){
                    return ResponseEntity.status(refreshTokenResponse.statusCode()).body(refreshTokenResponse);
                }
                String refreshToken = refreshTokenResponse.responseData().get("refreshToken").toString();


            // 3. Build secure cookie
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(true) //HTTPS only
                    .path("/auth/refresh")
                    .maxAge(jwtService.getRefreshTokenExpiry()) // 30 days
                    .sameSite("Lax")
                    .build();

            return ResponseEntity.status(accessTokenCreationResponse.statusCode())
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(accessTokenCreationResponse);

        } catch (JOSEException e) {
            AuthResponse exceptionResponse = new AuthResponse(HttpStatus.INTERNAL_SERVER_ERROR,new HashMap<>(),"Something went wrong "+e.getMessage(),1);
            return ResponseEntity.status(exceptionResponse.responseStatus()).body(exceptionResponse);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        try {

            if (refreshToken == null || refreshToken.isEmpty()) {
                AuthResponse exceptionResponse = new AuthResponse(HttpStatus.BAD_REQUEST,new HashMap<>(),"Refresh Token Missing in Cookie",1);
            }

            AuthResponse refreshTokenServiceResponse = jwtService.validateRefreshToken(refreshToken);

            //return if token parsing fails
            if(refreshTokenServiceResponse.responseStatus() == 1){
                return ResponseEntity.status(refreshTokenServiceResponse.statusCode()).body(refreshTokenServiceResponse);
            }

            String userId = refreshTokenServiceResponse.responseData().get("userDetails").toString();

            // Fetch roles again & return if it fails
            AuthResponse userServiceRolesResponse = userService.getRoles(userId);
            if(userServiceRolesResponse.responseStatus() == 1){
                return ResponseEntity.status(userServiceRolesResponse.statusCode()).body(userServiceRolesResponse);
            }
            Set<String> roles = (Set<String>) userServiceRolesResponse.responseData().get("userRoles");


            //Create access token & return if it fails
            AuthResponse newAccessToken = jwtService.createAccessToken(userId, Map.of("roles", roles));
            if(newAccessToken.responseStatus() == 1){
                return ResponseEntity.status(newAccessToken.statusCode()).body(newAccessToken);
            }

            //Create refresh token & return if it fails
            AuthResponse createRefreshTokenResponse = jwtService.createRefreshToken(userId);
            if(createRefreshTokenResponse.responseStatus() == 1){
                return ResponseEntity.status(createRefreshTokenResponse.statusCode()).body(createRefreshTokenResponse);
            }

            String newRefreshToken = createRefreshTokenResponse.responseData().get("refreshToken").toString();
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", newRefreshToken)
                    .httpOnly(true)
                    .secure(true)
                    .path("/auth/refresh")
                    .maxAge(jwtService.getRefreshTokenExpiry())
                    .sameSite("Lax")
                    .build();

            return ResponseEntity.status(HttpStatus.OK)
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(newAccessToken);

        }
        catch (JOSEException e) {
            throw new RuntimeException(e);
        }
        catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request){
        AuthResponse response = userService.registerUser(request);
        return ResponseEntity.status(response.statusCode()).body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout() {

        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/auth/refresh")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        AuthResponse response = new AuthResponse(
                HttpStatus.OK,
                new HashMap<>(),
                "Logged out successfully",
                0
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(response);
    }

}