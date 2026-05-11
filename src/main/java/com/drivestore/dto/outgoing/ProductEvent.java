package com.drivestore.dto.outgoing;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductEvent {

    public enum Type {
        CREATED, UPDATED, DELETED
    }

    private Type type;
    private ProductDto product;
}
