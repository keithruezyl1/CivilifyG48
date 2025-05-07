package com.capstone.civilify.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;

@Service
public class FirebaseStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseStorageService.class);

    public String uploadProfilePicture(String uid, byte[] imageData) {
        try {
            // Get the default bucket
            Bucket bucket = StorageClient.getInstance().bucket();

            // Define the file path in the bucket
            String filePath = "profile_pictures/" + uid + ".jpg";

            // Upload the file
            Blob blob = bucket.create(filePath, imageData, "image/jpeg");

            // Get the public URL of the uploaded file
            String profilePictureUrl = blob.getMediaLink();
            System.out.println("Profile picture uploaded successfully: " + profilePictureUrl);

            return profilePictureUrl;
        } catch (Exception e) {
            logger.error("Error uploading profile picture", e);
            return null;
        }
    }
}