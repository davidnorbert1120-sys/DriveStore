package com.drivestore.repository;

import com.drivestore.domain.Category;
import com.drivestore.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategory(Category category);

    List<Product> findByUserId(Long userId);
}
