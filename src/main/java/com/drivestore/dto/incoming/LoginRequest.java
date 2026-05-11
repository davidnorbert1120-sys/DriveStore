package com.drivestore.dto.incoming;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @Email(message = "Érvényes email cím szükséges")
    @NotBlank(message = "Az email kötelező")
    private String email;

    @NotBlank(message = "A jelszó kötelező")
    private String password;
}
