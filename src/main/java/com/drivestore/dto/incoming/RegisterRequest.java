package com.drivestore.dto.incoming;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @Email(message = "Érvényes email cím szükséges")
    @NotBlank(message = "Az email kötelező")
    private String email;

    @NotBlank(message = "A jelszó kötelező")
    @Size(min = 6, message = "A jelszó legalább 6 karakter")
    private String password;
}
