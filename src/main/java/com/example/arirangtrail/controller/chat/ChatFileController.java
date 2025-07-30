package com.example.arirangtrail.controller.chat;

import com.example.arirangtrail.component.review.FileStore;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
//@Profile("prod") // "prod" 프로필이 활성화될 때만 이 빈(Bean)을 생성하라는 의미!
@RequiredArgsConstructor
@RequestMapping("/api/files")
public class ChatFileController {
    private final FileStore fileStore;

    @Value("${cloud.aws.s3.bucket1}")
    private String bucket;


    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@ModelAttribute MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "파일이 비어있습니다."));
        }
        try {
            String fileUrl = fileStore.storeFile(file, bucket);
            // 성공 시, 생성된 이미지 URL을 JSON 형태로 반환
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "파일 업로드에 실패했습니다."));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "fileStore", fileStore != null ? "AVAILABLE" : "NULL",
                "bucket", bucket
        ));
    }
}
