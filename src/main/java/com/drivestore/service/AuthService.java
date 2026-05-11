package com.drivestore.service;

import com.drivestore.domain.User;
import com.drivestore.dto.incoming.LoginRequest;
import com.drivestore.dto.incoming.RegisterRequest;
import com.drivestore.dto.outgoing.AuthResponse;
import com.drivestore.exception.EmailAlreadyExistsException;
import com.drivestore.repository.UserRepository;
import com.drivestore.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        log.info("Regisztrációs kísérlet: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Regisztráció sikertelen – foglalt email: {}", request.getEmail());
            throw new EmailAlreadyExistsException("Ez az email már foglalt: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);
        log.info("Sikeres regisztráció: {} (id={})", user.getEmail(), user.getId());

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Bejelentkezési kísérlet: {}", request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        log.info("Sikeres bejelentkezés: {}", user.getEmail());

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail());
    }
}
