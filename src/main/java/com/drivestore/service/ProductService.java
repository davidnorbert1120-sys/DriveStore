package com.drivestore.service;

import com.drivestore.domain.Category;
import com.drivestore.domain.Product;
import com.drivestore.domain.User;
import com.drivestore.dto.incoming.CreateProductRequest;
import com.drivestore.dto.incoming.UpdateProductRequest;
import com.drivestore.dto.outgoing.ProductDto;
import com.drivestore.exception.ResourceNotFoundException;
import com.drivestore.exception.UnauthorizedException;
import com.drivestore.repository.MessageRepository;
import com.drivestore.repository.ProductRepository;
import com.drivestore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ProductWebSocketService webSocketService;
    private final ModelMapper modelMapper;

    public List<ProductDto> getAll(Category category) {
        List<Product> products = (category != null)
                ? productRepository.findByCategory(category)
                : productRepository.findAll();
        log.debug("Hirdetések lekérve: {} db (kategória: {})", products.size(), category);
        return products.stream().map(this::toDto).toList();
    }

    public ProductDto getById(Long id) {
        log.debug("Hirdetés lekérve: id={}", id);
        return toDto(findProductOrThrow(id));
    }

    public List<ProductDto> getMyProducts(String email) {
        User user = findUserOrThrow(email);
        List<ProductDto> products = productRepository.findByUserId(user.getId()).stream()
                .map(this::toDto).toList();
        log.debug("Saját hirdetések lekérve: {} ({}  db)", email, products.size());
        return products;
    }

    @Transactional
    public ProductDto create(CreateProductRequest request, String email) {
        User user = findUserOrThrow(email);
        Product product = Product.builder()
                .title(request.getTitle())
                .price(request.getPrice())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .user(user)
                .build();
        product = productRepository.save(product);
        log.info("Hirdetés létrehozva: '{}' – {} (id={})", product.getTitle(), email, product.getId());
        ProductDto dto = toDto(product);
        webSocketService.sendProductCreated(dto);
        return dto;
    }

    @Transactional
    public ProductDto update(Long id, UpdateProductRequest request, String email) {
        Product product = findProductOrThrow(id);
        checkOwnership(product, email);
        product.setTitle(request.getTitle());
        product.setPrice(request.getPrice());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());
        ProductDto dto = toDto(productRepository.save(product));
        log.info("Hirdetés frissítve: id={} – {}", id, email);
        webSocketService.sendProductUpdated(dto);
        return dto;
    }

    @Transactional
    public void delete(Long id, String email) {
        Product product = findProductOrThrow(id);
        checkOwnership(product, email);
        removeProduct(product);
        log.info("Hirdetés törölve: id={} '{}' – {}", id, product.getTitle(), email);
    }

    @Transactional
    public void buy(Long id, String buyerEmail) {
        Product product = findProductOrThrow(id);
        removeProduct(product);
        log.info("Hirdetés megvéve: id={} '{}' – vásárló: {}", id, product.getTitle(), buyerEmail);
    }

    private void removeProduct(Product product) {
        ProductDto dto = toDto(product);
        messageRepository.deleteByProductId(product.getId());
        productRepository.delete(product);
        webSocketService.sendProductDeleted(dto);
    }

    private ProductDto toDto(Product product) {
        ProductDto dto = modelMapper.map(product, ProductDto.class);
        dto.setUserId(product.getUser().getId());
        dto.setUserEmail(product.getUser().getEmail());
        return dto;
    }

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hirdetés nem található: " + id));
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Felhasználó nem található: " + email));
    }

    private void checkOwnership(Product product, String email) {
        if (!product.getUser().getEmail().equals(email)) {
            log.warn("Jogosulatlan módosítási kísérlet: id={} – {}", product.getId(), email);
            throw new UnauthorizedException("Csak a saját hirdetésedet módosíthatod");
        }
    }
}
