import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";
import { LIMITS } from "@/constants/limits";

export interface ImagePickerResult {
  uri: string;
  cancelled: boolean;
  duration?: number; // Video duration in milliseconds
  fileSize?: number; // File size in bytes
}

export interface MultipleImagePickerResult {
  uris: string[];
  cancelled: boolean;
}

/**
 * Yêu cầu quyền truy cập vào thư viện ảnh
 */
export const requestImageLibraryPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Cần quyền truy cập vào thư viện ảnh để chọn ảnh.",
        [{ text: "OK" }]
      );
      return false;
    }
  }
  return true;
};

/**
 * Yêu cầu quyền truy cập vào camera
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Cần quyền truy cập vào camera để chụp ảnh.",
        [{ text: "OK" }]
      );
      return false;
    }
  }
  return true;
};

/**
 * Chọn ảnh từ thư viện
 */
export const pickImageFromLibrary = async (): Promise<ImagePickerResult> => {
  const hasPermission = await requestImageLibraryPermission();
  if (!hasPermission) {
    return { uri: "", cancelled: true };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) {
    return { uri: "", cancelled: true };
  }

  return {
    uri: result.assets[0].uri,
    cancelled: false,
  };
};

/**
 * Chọn nhiều ảnh từ thư viện cùng lúc
 */
export const pickMultipleImagesFromLibrary = async (maxSelection: number = 10): Promise<MultipleImagePickerResult> => {
  const hasPermission = await requestImageLibraryPermission();
  if (!hasPermission) {
    return { uris: [], cancelled: true };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: maxSelection,
    quality: 0.8,
  });

  if (result.canceled) {
    return { uris: [], cancelled: true };
  }

  return {
    uris: result.assets.map(asset => asset.uri),
    cancelled: false,
  };
};

/**
 * Chọn video từ thư viện
 */
export const pickVideoFromLibrary = async (maxDuration?: number): Promise<ImagePickerResult> => {
  const hasPermission = await requestImageLibraryPermission();
  if (!hasPermission) {
    return { uri: "", cancelled: true };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 0.7, // Giảm quality để giảm kích thước file (0.7 = 70% quality)
    videoMaxDuration: maxDuration ? maxDuration / 1000 : undefined, // Convert ms to seconds
    // Note: Video sẽ được nén thêm trên Cloudinary server
  });

  if (result.canceled) {
    return { uri: "", cancelled: true };
  }

  const asset = result.assets[0];
  const duration = asset.duration ? asset.duration * 1000 : undefined; // Convert seconds to milliseconds
  const fileSize = asset.fileSize || undefined;

  // Validate file size
  if (fileSize && fileSize > LIMITS.MAX_VIDEO_SIZE) {
    const maxSizeMB = LIMITS.MAX_VIDEO_SIZE / (1024 * 1024);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    Alert.alert(
      "Lỗi",
      `Kích thước video quá lớn (${fileSizeMB}MB). Kích thước tối đa cho phép là ${maxSizeMB}MB.`
    );
    return { uri: "", cancelled: true };
  }

  // Validate duration if provided
  if (maxDuration && duration && duration > maxDuration) {
    const maxDurationSeconds = Math.floor(maxDuration / 1000);
    const videoDurationSeconds = Math.floor(duration / 1000);
    Alert.alert(
      "Lỗi",
      `Video quá dài (${videoDurationSeconds} giây). Độ dài tối đa cho phép là ${maxDurationSeconds} giây.`
    );
    return { uri: "", cancelled: true };
  }

  return {
    uri: asset.uri,
    cancelled: false,
    duration,
    fileSize,
  };
};

/**
 * Quay video từ camera
 */
export const takeVideoFromCamera = async (maxDuration?: number): Promise<ImagePickerResult> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return { uri: "", cancelled: true };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 0.7, // Giảm quality để giảm kích thước file (0.7 = 70% quality)
    videoMaxDuration: maxDuration ? maxDuration / 1000 : undefined, // Convert ms to seconds
    // Note: Video sẽ được nén thêm trên Cloudinary server
  });

  if (result.canceled) {
    return { uri: "", cancelled: true };
  }

  const asset = result.assets[0];
  const duration = asset.duration ? asset.duration * 1000 : undefined; // Convert seconds to milliseconds
  const fileSize = asset.fileSize || undefined;

  // Validate file size
  if (fileSize && fileSize > LIMITS.MAX_VIDEO_SIZE) {
    const maxSizeMB = LIMITS.MAX_VIDEO_SIZE / (1024 * 1024);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    Alert.alert(
      "Lỗi",
      `Kích thước video quá lớn (${fileSizeMB}MB). Kích thước tối đa cho phép là ${maxSizeMB}MB.`
    );
    return { uri: "", cancelled: true };
  }

  // Validate duration if provided
  if (maxDuration && duration && duration > maxDuration) {
    const maxDurationSeconds = Math.floor(maxDuration / 1000);
    const videoDurationSeconds = Math.floor(duration / 1000);
    Alert.alert(
      "Lỗi",
      `Video quá dài (${videoDurationSeconds} giây). Độ dài tối đa cho phép là ${maxDurationSeconds} giây.`
    );
    return { uri: "", cancelled: true };
  }

  return {
    uri: asset.uri,
    cancelled: false,
    duration,
    fileSize,
  };
};

/**
 * Chụp ảnh từ camera
 */
export const takePhotoFromCamera = async (): Promise<ImagePickerResult> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return { uri: "", cancelled: true };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) {
    return { uri: "", cancelled: true };
  }

  return {
    uri: result.assets[0].uri,
    cancelled: false,
  };
};

/**
 * Hiển thị dialog để chọn: Thư viện hoặc Camera
 */
export const showImagePickerOptions = (
  onLibraryPress: () => void,
  onCameraPress: () => void
) => {
  Alert.alert(
    "Chọn ảnh",
    "Bạn muốn chọn ảnh từ đâu?",
    [
      {
        text: "Thư viện",
        onPress: onLibraryPress,
      },
      {
        text: "Camera",
        onPress: onCameraPress,
      },
      {
        text: "Hủy",
        style: "cancel",
      },
    ],
    { cancelable: true }
  );
};

/**
 * Hiển thị dialog để chọn: Ảnh hoặc Video
 */
export const showMediaPickerOptions = (
  onImagePress: () => void,
  onVideoPress: () => void
) => {
  Alert.alert(
    "Chọn phương tiện",
    "Bạn muốn chọn gì?",
    [
      {
        text: "Ảnh",
        onPress: onImagePress,
      },
      {
        text: "Video",
        onPress: onVideoPress,
      },
      {
        text: "Hủy",
        style: "cancel",
      },
    ],
    { cancelable: true }
  );
};

/**
 * Hiển thị dialog để chọn video: Thư viện hoặc Camera
 */
export const showVideoPickerOptions = (
  onLibraryPress: () => void,
  onCameraPress: () => void
) => {
  Alert.alert(
    "Chọn video",
    "Bạn muốn chọn video từ đâu?",
    [
      {
        text: "Thư viện",
        onPress: onLibraryPress,
      },
      {
        text: "Camera",
        onPress: onCameraPress,
      },
      {
        text: "Hủy",
        style: "cancel",
      },
    ],
    { cancelable: true }
  );
};

