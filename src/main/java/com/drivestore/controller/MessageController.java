package com.drivestore.controller;

import com.drivestore.dto.incoming.SendMessageRequest;
import com.drivestore.dto.outgoing.MessageDto;
import com.drivestore.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<MessageDto>> getByProduct(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.getByProduct(productId, userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<MessageDto> send(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.send(request, userDetails.getUsername()));
    }
}
