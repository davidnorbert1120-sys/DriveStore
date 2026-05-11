package com.drivestore.repository;

import com.drivestore.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.product.id = :productId AND (m.sender.id = :userId OR m.receiver.id = :userId) ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("productId") Long productId, @Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}
