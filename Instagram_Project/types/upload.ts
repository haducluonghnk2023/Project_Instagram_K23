/**
 * Types for file uploads
 */

export interface FileUpload {
  uri: string;
  name: string;
  type: string;
}

export interface FormDataFile {
  uri: string;
  name: string;
  type: string;
}

// Type-safe FormData append for React Native
export interface RNFormData {
  append: (name: string, value: string | FormDataFile, fileName?: string) => void;
}

