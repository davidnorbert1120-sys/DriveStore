package com.drivestore.service;

import com.drivestore.dto.outgoing.ProductDto;
import com.drivestore.dto.outgoing.ProductEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendProductCreated(ProductDto product) {
        messagingTemplate.convertAndSend("/topic/products",
                new ProductEvent(ProductEvent.Type.CREATED, product));
    }

    public void sendProductUpdated(ProductDto product) {
        messagingTemplate.convertAndSend("/topic/products",
                new ProductEvent(ProductEvent.Type.UPDATED, product));
    }

    public void sendProductDeleted(ProductDto product) {
        messagingTemplate.convertAndSend("/topic/products",
                new ProductEvent(ProductEvent.Type.DELETED, product));
    }
}
