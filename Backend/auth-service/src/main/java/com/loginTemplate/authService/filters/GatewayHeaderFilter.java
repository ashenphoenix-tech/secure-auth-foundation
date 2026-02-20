package com.loginTemplate.authService.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class GatewayHeaderFilter extends OncePerRequestFilter {

    private final String expected;

    public GatewayHeaderFilter(String expected) {
        this.expected = expected;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("X-GATEWAY-SECRET");

        if (header == null || !header.equals(expected)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized Gateway");
            return;
        }

        filterChain.doFilter(request, response);
    }
}

