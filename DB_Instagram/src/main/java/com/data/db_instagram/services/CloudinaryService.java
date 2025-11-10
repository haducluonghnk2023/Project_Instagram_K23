package com.data.db_instagram.services;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    String uploadImage(MultipartFile file, String folder) throws Exception;
    String uploadVideo(MultipartFile file, String folder) throws Exception;
}

