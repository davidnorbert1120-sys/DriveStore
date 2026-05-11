package com.drivestore.dto.outgoing;

import java.time.LocalDateTime;

public record MessageDto(Long id, String senderEmail, Long senderUserId, Long productId, String content, LocalDateTime sentAt) {}
