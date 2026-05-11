package com.drivestore.dto.incoming;

import com.drivestore.domain.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductRequest {

    @NotBlank(message = "A cím kötelező")
    private String title;

    @NotNull(message = "Az ár kötelező")
    @DecimalMin(value = "0.0", inclusive = false, message = "Az ár pozitív kell legyen")
    private BigDecimal price;

    @NotNull(message = "A kategória kötelező")
    private Category category;

    private String imageUrl;
}
