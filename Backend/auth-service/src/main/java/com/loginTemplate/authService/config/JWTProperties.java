package com.loginTemplate.authService.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/*
* This class binds/loads jwt data from yaml file to actual Java Objects
* */


@Component
@ConfigurationProperties(prefix = "security.jwt")
@Getter
@Setter
public class JWTProperties {
    private Keys keys = new Keys();
    private String issuer;
    private Expiry expiry = new Expiry();

    @Getter
    @Setter
    public static class Keys {
        private String publicKey;
        private String privateKey;
    }

    @Getter
    @Setter
    public static class Expiry {
        private long access;
        private long refresh;
    }

}

