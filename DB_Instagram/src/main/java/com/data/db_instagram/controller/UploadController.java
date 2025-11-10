package com.data.db_instagram.controller;

import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.dto.response.UploadResponse;
import com.data.db_instagram.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final CloudinaryService cloudinaryService;
    
    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "instagram") String folder
    ) {
        try {
            String imageUrl = cloudinaryService.uploadImage(file, folder);
            
            UploadResponse response = UploadResponse.builder()
                    .url(imageUrl)
                    .build();
            
            return ResponseEntity.ok(
                    ResponseWrapper.builder()
                            .status(HttpStatus.OK)
                            .code(HttpStatus.OK.value())
                            .data(response)
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseWrapper.builder()
                            .status(HttpStatus.BAD_REQUEST)
                            .code(HttpStatus.BAD_REQUEST.value())
                            .data(e.getMessage())
                            .build());
        }
    }
    
    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String imageUrl = cloudinaryService.uploadImage(file, "instagram/avatars");
            
            UploadResponse response = UploadResponse.builder()
                    .url(imageUrl)
                    .build();
            
            return ResponseEntity.ok(
                    ResponseWrapper.builder()
                            .status(HttpStatus.OK)
                            .code(HttpStatus.OK.value())
                            .data(response)
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseWrapper.builder()
                            .status(HttpStatus.BAD_REQUEST)
                            .code(HttpStatus.BAD_REQUEST.value())
                            .data(e.getMessage())
                            .build());
        }
    }
    
    @PostMapping("/post")
    public ResponseEntity<?> uploadPostImage(
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String imageUrl = cloudinaryService.uploadImage(file, "instagram/posts");
            
            UploadResponse response = UploadResponse.builder()
                    .url(imageUrl)
                    .build();
            
            return ResponseEntity.ok(
                    ResponseWrapper.builder()
                            .status(HttpStatus.OK)
                            .code(HttpStatus.OK.value())
                            .data(response)
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseWrapper.builder()
                            .status(HttpStatus.BAD_REQUEST)
                            .code(HttpStatus.BAD_REQUEST.value())
                            .data(e.getMessage())
                            .build());
        }
    }

    @PostMapping("/video")
    public ResponseEntity<?> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "instagram") String folder
    ) {
        try {
            String videoUrl = cloudinaryService.uploadVideo(file, folder);
            
            UploadResponse response = UploadResponse.builder()
                    .url(videoUrl)
                    .build();
            
            return ResponseEntity.ok(
                    ResponseWrapper.builder()
                            .status(HttpStatus.OK)
                            .code(HttpStatus.OK.value())
                            .data(response)
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseWrapper.builder()
                            .status(HttpStatus.BAD_REQUEST)
                            .code(HttpStatus.BAD_REQUEST.value())
                            .data(e.getMessage())
                            .build());
        }
    }
}

