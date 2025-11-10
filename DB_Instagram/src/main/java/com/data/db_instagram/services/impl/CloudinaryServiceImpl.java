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
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp");

    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-msvideo");

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final long MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos

    @Override
    public String uploadImage(MultipartFile file) throws Exception {
        return uploadImage(file, "instagram");
    }

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
    public void deleteImage(String publicId) throws Exception {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Image deleted successfully from Cloudinary: {}", publicId);
        } catch (Exception e) {
            log.error("Error deleting image from Cloudinary: {}", publicId, e);
            throw new HttpBadRequest("Không thể xóa ảnh. Vui lòng thử lại.");
        }
    }

    @Override
    public String uploadVideo(MultipartFile file) throws Exception {
        return uploadVideo(file, "instagram");
    }

    @Override
    public String uploadVideo(MultipartFile file, String folder) throws Exception {
        validateVideoFile(file);

        try {
            // Cloudinary video compression parameters
            // Tối ưu compression dựa trên folder (story vs post/reel)
            boolean isStory = folder != null && folder.contains("stories");
            
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "video",
                    "overwrite", true,
                    "invalidate", true,
                    // Video compression settings - Cloudinary tự động tối ưu
                    "quality", isStory ? "auto:low" : "auto:good", // Story: ưu tiên kích thước nhỏ hơn
                    "format", "mp4" // Định dạng MP4 (hiệu quả về kích thước)
            );
            
            // Thêm transformation cho story (video ngắn, cần compression mạnh hơn)
            if (isStory) {
                uploadParams.put("eager", "q_auto:low,vc_auto,ac_aac,fl_streaming_attachment"); // Streaming optimization
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    uploadParams);

            String videoUrl = (String) uploadResult.get("secure_url");
            log.info("Video uploaded and compressed successfully to Cloudinary (folder: {}): {}", folder, videoUrl);

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
            throw new HttpBadRequest("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)");
        }
    }

    private void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new HttpBadRequest("File không được để trống");
        }

        if (file.getSize() > MAX_VIDEO_SIZE) {
            throw new HttpBadRequest("Kích thước video không được vượt quá 50MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_VIDEO_TYPES.contains(contentType.toLowerCase())) {
            throw new HttpBadRequest("Chỉ chấp nhận file video (MP4, MPEG, MOV, AVI)");
        }
    }
}
