package com.example.arirangtrail.component.review;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


//잠시 컴퍼넌트 꺼놓기
@Component
@RequiredArgsConstructor
public class FileStore {

    private final AmazonS3 amazonS3;

    public List<String> storeFiles(List<MultipartFile> multipartFiles, String bucket) throws IOException {
        List<String> storeFileResult = new ArrayList<>();
        if (multipartFiles != null) {
            for (MultipartFile multipartFile : multipartFiles) {
                if (!multipartFile.isEmpty()) {
                    storeFileResult.add(storeFile(multipartFile, bucket));
                }
            }
        }
        return storeFileResult;
    }

    public String storeFile(MultipartFile multipartFile, String bucket) throws IOException {
        if (multipartFile.isEmpty()) {
            return null;
        }

        String originalFilename = multipartFile.getOriginalFilename();
        String storeFileName = createStoreFileName(originalFilename);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(multipartFile.getSize());
        metadata.setContentType(multipartFile.getContentType());

        amazonS3.putObject(bucket, storeFileName, multipartFile.getInputStream(), metadata);

        // Return the full URL of the uploaded file
        return amazonS3.getUrl(bucket, storeFileName).toString();
    }

    public void deleteFile(String fileUrl, String bucket) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }
        try {
            URL url = new URL(fileUrl);
            String key = url.getPath().substring(1); // Remove the leading slash
            amazonS3.deleteObject(bucket, key);
        } catch (Exception e) {
            // Log the exception
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
