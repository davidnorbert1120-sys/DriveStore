package com.drivestore.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.drivestore.exception.InvalidFileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final long MAX_SIZE = 5 * 1024 * 1024;

    private final Cloudinary cloudinary;

    public FileStorageService(@Value("${cloudinary.cloud-name}") String cloudName,
                              @Value("${cloudinary.api-key}") String apiKey,
                              @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    public String store(MultipartFile file) {
        if (file.isEmpty()) throw new InvalidFileException("A fájl üres");
        if (file.getSize() > MAX_SIZE) throw new InvalidFileException("A fájl mérete maximum 5 MB lehet");

        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        if (ext == null || !ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new InvalidFileException("Csak kép fájl tölthető fel (jpg, png, webp, gif)");
        }

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "drivestore")
            );
            String url = (String) result.get("secure_url");
            log.info("Kép feltöltve Cloudinary-re: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Cloudinary feltöltés sikertelen: {}", e.getMessage());
            throw new RuntimeException("Kép feltöltési hiba", e);
        }
    }
}
