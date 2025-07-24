package com.example.arirangtrail.service.chat;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatFileService {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    public String saveFile(MultipartFile multipartFile) throws IOException {
        if (multipartFile.isEmpty()) {
            return null;
        }

        String originalFilename = multipartFile.getOriginalFilename();
        String storeFileName = createStoreFileName(originalFilename);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(multipartFile.getSize());
        metadata.setContentType(multipartFile.getContentType());

        // S3에 파일 업로드
        amazonS3.putObject(new PutObjectRequest(bucket, storeFileName, multipartFile.getInputStream(), metadata)
                .withCannedAcl(CannedAccessControlList.PublicRead)); // 공개 읽기 권한 설정 추가
        // 업로드된 파일의 URL 반환
        return amazonS3.getUrl(bucket, storeFileName).toString();
    }

    public void deleteFile(String fileUrl) {
        // 파일 URL을 기반으로 S3 객체 키를 추출하여 삭제하는 로직 (FileStore의 deleteFile 참조)
        try {
            String key = fileUrl.substring(fileUrl.indexOf(bucket + "/") + bucket.length() + 1);
            amazonS3.deleteObject(bucket, key);
        } catch (Exception e) {
            // e.printStackTrace(); // 로깅 프레임워크 사용 권장
        }
    }


    private String createStoreFileName(String originalFilename) {
        String ext = extractExt(originalFilename);
        String uuid = UUID.randomUUID().toString();
        return uuid + "." + ext;
    }

    private String extractExt(String originalFilename) {
        int pos = originalFilename.lastIndexOf(".");
        return originalFilename.substring(pos + 1);
    }
}