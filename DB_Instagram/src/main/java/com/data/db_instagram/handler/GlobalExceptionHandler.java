package com.data.db_instagram.handler;

import com.data.db_instagram.dto.response.ResponseWrapper;
import com.data.db_instagram.exception.HttpBadRequest;
import com.data.db_instagram.exception.HttpConflict;
import com.data.db_instagram.exception.HttpForbidden;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.exception.HttpUnauthorized;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.apache.catalina.connector.ClientAbortException;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler
{
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidException(MethodArgumentNotValidException ex)
    {
        Map<String, String> errors = new HashMap<>();
        ex.getFieldErrors().forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ResponseWrapper.builder()
                        .data(errors)
                        .code(HttpStatus.BAD_REQUEST.value())
                        .status(HttpStatus.BAD_REQUEST)
                        .build()
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex)
    {
        log.warn("Max upload size exceeded", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ResponseWrapper.builder()
                        .data("Kích thước file quá lớn. Vui lòng thử lại với file nhỏ hơn.")
                        .code(HttpStatus.BAD_REQUEST.value())
                        .status(HttpStatus.BAD_REQUEST)
                        .build()
        );
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<?> handleMultipartException(MultipartException ex)
    {
        log.warn("Multipart upload error", ex);
        
        // Check if it's a client abort (connection closed)
        Throwable cause = ex.getCause();
        if (cause instanceof ClientAbortException || 
            (cause != null && cause.getCause() instanceof ClientAbortException) ||
            ex.getMessage() != null && ex.getMessage().contains("EOFException")) {
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(
                    ResponseWrapper.builder()
                            .data("Kết nối bị ngắt trong khi upload. Vui lòng kiểm tra kết nối mạng và thử lại.")
                            .code(HttpStatus.REQUEST_TIMEOUT.value())
                            .status(HttpStatus.REQUEST_TIMEOUT)
                            .build()
            );
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ResponseWrapper.builder()
                        .data("Lỗi khi upload file. Vui lòng thử lại.")
                        .code(HttpStatus.BAD_REQUEST.value())
                        .status(HttpStatus.BAD_REQUEST)
                        .build()
        );
    }

    @ExceptionHandler(HttpBadRequest.class)
    public ResponseEntity<?> handleHttpBadRequest(HttpBadRequest ex)
    {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ResponseWrapper.builder()
                        .data(ex.getMessage())
                        .code(HttpStatus.BAD_REQUEST.value())
                        .status(HttpStatus.BAD_REQUEST)
                        .build()
        );
    }

    @ExceptionHandler(HttpNotFound.class)
    public ResponseEntity<?> handleHttpNotFound(HttpNotFound ex)
    {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ResponseWrapper.builder()
                        .data(ex.getMessage())
                        .code(HttpStatus.NOT_FOUND.value())
                        .status(HttpStatus.NOT_FOUND)
                        .build()
        );
    }

    @ExceptionHandler(HttpConflict.class)
    public ResponseEntity<?> handleHttpConflict(HttpConflict ex)
    {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ResponseWrapper.builder()
                        .data(ex.getMessage())
                        .code(HttpStatus.CONFLICT.value())
                        .status(HttpStatus.CONFLICT)
                        .build()
        );
    }

    @ExceptionHandler(HttpUnauthorized.class)
    public ResponseEntity<?> handleHttpUnauthorized(HttpUnauthorized ex)
    {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ResponseWrapper.builder()
                        .data(ex.getMessage())
                        .code(HttpStatus.UNAUTHORIZED.value())
                        .status(HttpStatus.UNAUTHORIZED)
                        .build()
        );
    }

    @ExceptionHandler(HttpForbidden.class)
    public ResponseEntity<?> handleHttpForbidden(HttpForbidden ex)
    {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ResponseWrapper.builder()
                        .data(ex.getMessage())
                        .code(HttpStatus.FORBIDDEN.value())
                        .status(HttpStatus.FORBIDDEN)
                        .build()
        );
    }

    /**
     * Generic exception handler for all unexpected errors
     * This catches any exception not handled by specific handlers above
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex)
    {
        log.error("Unexpected error occurred", ex);
        
        // Don't expose internal error details to client in production
        String message = "An unexpected error occurred. Please try again later.";
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ResponseWrapper.builder()
                        .data(message)
                        .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .build()
        );
    }

}

