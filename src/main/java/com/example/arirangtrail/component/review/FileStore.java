package com.example.arirangtrail.component.review;


import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class FileStore {

    // application.yml 등에서 설정값을 가져오는 것을 추천합니다.
    // assets/img/reviewimg/ 까지는 동일, 테스트하고싶으면 앞의 경로를 프로젝트폴더 자기 로컬의 절대경로로 설정 => 본인프로젝트폴더절대경로/assets/img/reviewimg/
    @Value("${file.upload-dir}")
    private String fileDir;

    @PostConstruct
    public void init() {
        File directory = new File(fileDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }

    public List<String> storeFiles(List<MultipartFile> multipartFiles) throws IOException {
        List<String> storeFileResult = new ArrayList<>();
        if (multipartFiles != null) {
            for (MultipartFile multipartFile : multipartFiles) {
                if (!multipartFile.isEmpty()) {
                    storeFileResult.add(storeFile(multipartFile));
                }
            }
        }
        return storeFileResult;
    }

    public String storeFile(MultipartFile multipartFile) throws IOException {
        if (multipartFile.isEmpty())
            return null;
        String originalFilename = multipartFile.getOriginalFilename();
        String storeFileName = createStoreFileName(originalFilename);
        multipartFile.transferTo(new File(getFullPath(storeFileName)));
        return storeFileName; // URL이 아닌 파일명 자체를 반환하는 예시
    }

    // 파일 삭제
    public void deleteFile(String fileName) {
        File file = new File(getFullPath(fileName));
        if (file.exists()) {
            file.delete();
        }
    }

    public String getFullPath(String filename) {
        return fileDir + filename;
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