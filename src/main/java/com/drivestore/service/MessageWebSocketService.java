package com.drivestore.service;

import com.drivestore.dto.outgoing.MessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendToUser(Long productId, Long receiverId, MessageDto message) {
        messagingTemplate.convertAndSend("/topic/messages/" + productId + "/" + receiverId, message);
    }
}
