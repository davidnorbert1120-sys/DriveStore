package com.drivestore.service;

import com.drivestore.domain.Message;
import com.drivestore.domain.Product;
import com.drivestore.domain.User;
import com.drivestore.dto.incoming.SendMessageRequest;
import com.drivestore.dto.outgoing.MessageDto;
import com.drivestore.exception.InvalidMessageException;
import com.drivestore.exception.ResourceNotFoundException;
import com.drivestore.repository.MessageRepository;
import com.drivestore.repository.ProductRepository;
import com.drivestore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MessageDto> getByProduct(Long productId, String currentEmail) {
        User current = getUser(currentEmail);
        List<MessageDto> msgs = messageRepository.findConversation(productId, current.getId())
                .stream().map(this::toDto).toList();
        log.debug("Üzenetek lekérve: productId={} – {} ({} db)", productId, currentEmail, msgs.size());
        return msgs;
    }

    @Transactional
    public MessageDto send(SendMessageRequest request, String senderEmail) {
        User sender = getUser(senderEmail);
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Hirdetés nem található"));

        User receiver;
        boolean senderIsOwner = sender.getId().equals(product.getUser().getId());

        if (senderIsOwner) {
            if (request.receiverId() == null)
                throw new InvalidMessageException("receiverId kötelező az eladó válaszához");
            receiver = userRepository.findById(request.receiverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Fogadó felhasználó nem található"));
        } else {
            receiver = product.getUser();
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .product(product)
                .content(request.content())
                .build();

        MessageDto dto = toDto(messageRepository.save(message));
        log.info("Üzenet elküldve: productId={} – {} -> {}", request.productId(), senderEmail, receiver.getEmail());
        return dto;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Felhasználó nem található"));
    }

    private MessageDto toDto(Message m) {
        return new MessageDto(
                m.getId(),
                m.getSender().getEmail(),
                m.getSender().getId(),
                m.getProduct().getId(),
                m.getContent(),
                m.getSentAt()
        );
    }
}
