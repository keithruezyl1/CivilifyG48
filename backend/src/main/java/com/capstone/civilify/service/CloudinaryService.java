package com.capstone.civilify.service;

import java.io.IOException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.google.api.client.util.Value;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);
    
    @Value("${cloudinary.upload-preset}")
    private String uploadPreset;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadImage(MultipartFile file) {
        try {
            // Upload file to Cloudinary
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                "folder", "civilify/profiles", // Organize in a folder
                "upload_preset", uploadPreset,
                "resource_type", "auto",       // Auto-detect resource type
                "public_id", "profile_" + System.currentTimeMillis() // Unique ID
            );
            
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            
            // Return the secure URL
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            logger.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Image upload failed", e);
        }
    }
}