package com.loginTemplate.authService.service;

import com.loginTemplate.authService.DTO.AuthResponse;
import com.loginTemplate.authService.config.JWTProperties;
import com.loginTemplate.authService.config.KeyLoader;
import com.loginTemplate.authService.exceptions.CustomException;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.crypto.ECDSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final KeyLoader keyLoader;
    private final JWTProperties properties;

    public AuthResponse createAccessToken(String userId, Map<String, Object> additionalData){
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(properties.getExpiry().getAccess());

        try{

        // Start with builder
        JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                .subject(userId)
                .issuer(properties.getIssuer())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expiry))
                .jwtID(UUID.randomUUID().toString())
                .claim("type", "access");


        if (additionalData != null) {
            additionalData.forEach(claimsBuilder::claim);
        }

        JWTClaimsSet claims = claimsBuilder.build();

        // Header
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.ES256)
                .keyID(keyLoader.getCurrentKid())
                .type(JOSEObjectType.JWT)
                .build();

        SignedJWT signedJWT  = new SignedJWT(header, claims);

        JWSSigner signer = new ECDSASigner(keyLoader.getPrivateKey());
        signedJWT.sign(signer);

        Map<Object, Object> tokenDetails= new HashMap<>();
        tokenDetails.put("accessToken", signedJWT.serialize());

        return new AuthResponse(HttpStatus.OK, tokenDetails,"Access Token Successfully Created", 0);

        }catch (JOSEException joseException){
            return new AuthResponse(HttpStatus.INTERNAL_SERVER_ERROR, new HashMap<>(),"Error Occured While Siging JWT Token " + joseException.getMessage() , -1);
        }catch (Exception exception){
            return new AuthResponse(HttpStatus.INTERNAL_SERVER_ERROR, new HashMap<>(),"Something Went Wrong " + exception.getMessage() , -1);
        }
    }

    public AuthResponse createRefreshToken(String userId) throws JOSEException {
        try {
            Instant now = Instant.now();
            Instant expiry = now.plusSeconds(properties.getExpiry().getRefresh());

            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(userId)
                    .issuer(properties.getIssuer())
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiry))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("type", "refresh")
                    .build();

            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.ES256)
                    .keyID(keyLoader.getCurrentKid())
                    .type(JOSEObjectType.JWT)
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, claims);

            JWSSigner signer = new ECDSASigner(keyLoader.getPrivateKey());

            signedJWT.sign(signer);

            return new AuthResponse(HttpStatus.OK, Map.of("refreshToken", signedJWT.serialize()), "Token Created", 0);

        } catch (JOSEException e) {
            return new AuthResponse(HttpStatus.INTERNAL_SERVER_ERROR, null, "Something went wrong "+e.getMessage(), 1);
        }
    }

    public AuthResponse validateRefreshToken(String token) {

        try {
            //Parse token
            SignedJWT signedJWT = SignedJWT.parse(token);

            //Verify signature using public key
            JWSVerifier verifier = new ECDSAVerifier(keyLoader.getPublicKey());

            if (!signedJWT.verify(verifier)) {
                throw new CustomException.InvalidTokenException("Invalid refresh token signature");
            }

            //Extract claims
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            //Validate expiration
            Date expirationTime = claims.getExpirationTime();

            if (expirationTime == null || expirationTime.before(new Date())) {
                throw new CustomException.InvalidTokenException("Refresh token expired");
            }

            //Validate token type
            String tokenType = claims.getStringClaim("type");
            if (!"refresh".equals(tokenType)) {
                throw new CustomException.InvalidTokenException("Invalid token type");
            }

            //Return subject (userId)
            return new AuthResponse(HttpStatus.OK, Map.of("userDetails", claims.getSubject()),"Token parsed successfully", 0);

        }
        catch (CustomException.InvalidTokenException e){
            return new AuthResponse(HttpStatus.BAD_REQUEST, null,e.getMessage(), 1);
        }
        catch (ParseException e) {
            return new AuthResponse(HttpStatus.INTERNAL_SERVER_ERROR, null,"Unable to parse token" + e.getMessage(), 1);
        } catch (JOSEException e) {
            return new AuthResponse(HttpStatus.INTERNAL_SERVER_ERROR, null,"Something went wrong in token service " + e.getMessage(), 1);
        }
    }


    public Long getRefreshTokenExpiry(){
        return properties.getExpiry().getRefresh();
    }
}
