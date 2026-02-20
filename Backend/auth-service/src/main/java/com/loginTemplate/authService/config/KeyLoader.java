package com.loginTemplate.authService.config;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.util.StreamUtils;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Configuration
public class KeyLoader {

    private final JWTProperties jwtProperties;
    private final ResourceLoader resourceLoader;

    // Hold signing key after initialization
    private ECKey ecSigningKey;

    @Autowired
    public KeyLoader(JWTProperties jwtProperties, ResourceLoader resourceLoader) {
        this.jwtProperties = jwtProperties;
        this.resourceLoader = resourceLoader;
    }

    @Bean
    public ECKey signingKey() throws Exception {

        byte[] privDer = loadDerFromPem(jwtProperties.getKeys().getPrivateKey(), "PRIVATE KEY");
        byte[] pubDer  = loadDerFromPem(jwtProperties.getKeys().getPublicKey(), "PUBLIC KEY");

        KeyFactory kf = KeyFactory.getInstance("EC");

        PKCS8EncodedKeySpec privSpec = new PKCS8EncodedKeySpec(privDer);
        X509EncodedKeySpec pubSpec   = new X509EncodedKeySpec(pubDer);

        ECPrivateKey privateKey = (ECPrivateKey) kf.generatePrivate(privSpec);
        ECPublicKey publicKey  = (ECPublicKey)  kf.generatePublic(pubSpec);

        String kid = computeKid(pubDer);

        ecSigningKey = new ECKey.Builder(Curve.P_256, publicKey)
                .privateKey(privateKey)
                .keyID(kid)
                .build();

        return ecSigningKey;
    }

    @Bean
    public JWKSet jwkSet(ECKey signingKey) {
        return new JWKSet(signingKey.toPublicJWK());
    }

    /* ---------------- getters used by JwtService ---------------- */

    public ECPrivateKey getPrivateKey() throws JOSEException {
        return ecSigningKey.toECPrivateKey();
    }

    public ECPublicKey getPublicKey() throws JOSEException {
        return ecSigningKey.toECPublicKey();
    }

    public String getCurrentKid() {
        return ecSigningKey.getKeyID();
    }

    public ECKey getEcKey() {
        return ecSigningKey;
    }

    /* ---------------- helper methods ---------------- */

    private byte[] loadDerFromPem(String resourcePath, String expectedPemLabel) throws Exception {
        Resource resource = resourceLoader.getResource(resourcePath);
        if (!resource.exists()) {
            throw new IllegalArgumentException("PEM resource not found: " + resourcePath);
        }
        try (InputStream is = resource.getInputStream()) {
            String pem = StreamUtils.copyToString(is, StandardCharsets.UTF_8);
            return parsePemToDer(pem, expectedPemLabel);
        }
    }

    private byte[] parsePemToDer(String pem, String expectedLabel) {
        String header = "-----BEGIN " + expectedLabel + "-----";
        String footer = "-----END " + expectedLabel + "-----";

        if (!pem.contains(header)) {
            header = "-----BEGIN ";
            footer = "-----END ";
        }

        String[] lines = pem.replace("\r", "").split("\n");
        StringBuilder sb = new StringBuilder();
        boolean inBase64 = false;
        for (String line : lines) {
            if (line.startsWith("-----BEGIN ")) {
                inBase64 = true;
                continue;
            }
            if (line.startsWith("-----END ")) {
                break;
            }
            if (inBase64) {
                sb.append(line.trim());
            }
        }
        if (sb.length() == 0) {
            throw new IllegalArgumentException("Invalid PEM content or unsupported PEM label.");
        }
        return Base64.getDecoder().decode(sb.toString());
    }

    private String computeKid(byte[] pubDer) throws Exception {
        MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
        byte[] digest = sha256.digest(pubDer);

        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return "ashen-phoenix-es256-" + sb.toString();
    }
}

