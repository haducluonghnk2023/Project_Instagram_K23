package com.data.db_instagram.services.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.data.db_instagram.exception.HttpBadRequest;
import com.data.db_instagram.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",  // Accept both jpg and jpeg for compatibility
            "image/png",
            "image/gif",
            "image/webp");

    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-msvideo");

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @Override
    public String uploadImage(MultipartFile file, String folder) throws Exception {
        validateFile(file);

        try {
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "overwrite", true,
                    "invalidate", true);

            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    uploadParams);

            String imageUrl = (String) uploadResult.get("secure_url");
            log.info("Image uploaded successfully to Cloudinary: {}", imageUrl);

            return imageUrl;

        } catch (IOException e) {
            log.error("Error uploading image to Cloudinary", e);
            throw new HttpBadRequest("Không thể upload ảnh. Vui lòng thử lại.");
        } catch (Exception e) {
            log.error("Unexpected error uploading image", e);
            throw new HttpBadRequest("Lỗi khi upload ảnh: " + e.getMessage());
        }
    }

    @Override
    public String uploadVideo(MultipartFile file, String folder) throws Exception {
        validateVideoFile(file);

        try {
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "video",
                    "overwrite", true,
                    "invalidate", true
            );

            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    uploadParams);

            String videoUrl = (String) uploadResult.get("secure_url");
            log.info("Video uploaded successfully to Cloudinary: {}", videoUrl);

            return videoUrl;

        } catch (IOException e) {
            log.error("Error uploading video to Cloudinary", e);
            throw new HttpBadRequest("Không thể upload video. Vui lòng thử lại.");
        } catch (Exception e) {
            log.error("Unexpected error uploading video", e);
            throw new HttpBadRequest("Lỗi khi upload video: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new HttpBadRequest("File không được để trống");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new HttpBadRequest("Kích thước file không được vượt quá 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            // Normalize jpg to jpeg for validation
            String normalizedContentType = contentType != null && contentType.toLowerCase().equals("image/jpg")
                    ? "image/jpeg"
                    : contentType;
            
            if (normalizedContentType == null || !ALLOWED_IMAGE_TYPES.contains(normalizedContentType.toLowerCase())) {
                throw new HttpBadRequest("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP). Nhận được: " + contentType);
            }
        }
    }

    private void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new HttpBadRequest("File không được để trống");
        }

        // Bỏ qua kiểm tra kích thước - cho phép upload video bất kỳ
        // Nếu upload thất bại, Cloudinary sẽ báo lỗi

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_VIDEO_TYPES.contains(contentType.toLowerCase())) {
            throw new HttpBadRequest("Chỉ chấp nhận file video (MP4, MPEG, MOV, AVI)");
        }
    }
}
