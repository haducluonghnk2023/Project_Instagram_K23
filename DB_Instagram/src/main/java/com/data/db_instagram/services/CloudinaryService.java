package com.data.db_instagram.services;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    String uploadImage(MultipartFile file, String folder) throws Exception;
    String uploadImage(MultipartFile file) throws Exception;
    void deleteImage(String publicId) throws Exception;
    String uploadVideo(MultipartFile file, String folder) throws Exception;
    String uploadVideo(MultipartFile file) throws Exception;
}

