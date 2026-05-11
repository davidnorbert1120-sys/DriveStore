package com.drivestore.dto.outgoing;

import com.drivestore.domain.Category;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductDto {

    private Long id;
    private String title;
    private BigDecimal price;
    private Category category;
    private String imageUrl;
    private Long userId;
    private String userEmail;
    private LocalDateTime createdAt;
}
