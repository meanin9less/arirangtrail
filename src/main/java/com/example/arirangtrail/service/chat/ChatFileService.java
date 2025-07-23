package com.example.arirangtrail.service.chat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;
@Service
public class ChatFileService {
    @Value("${file.upload-dir}")
    private String uploadDir; // application.properties에서 설정한 경로를 가져옴

    @Value("${server.url}")
    private String serverUrl; // application.properties에서 설정한 서버 주소를 가져옴

    public String saveFile(MultipartFile multipartFile) throws IOException {
        // 1. 중복되지 않는 파일 이름 생성 (UUID 사용)
        String originalFileName = multipartFile.getOriginalFilename();
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String savedFileName = UUID.randomUUID().toString() + extension;

        // ★★★ 여기가 핵심 ★★★
        File uploadPath = new File(uploadDir);
        // 1. 저장할 폴더가 존재하지 않으면,
        if (!uploadPath.exists()) {
            // 2. 해당 폴더를 생성합니다. (mkdirs는 중간 경로가 없어도 모두 만들어줍니다)
            uploadPath.mkdirs();
        }

        // 2. 물리적 파일 저장
        File file = new File(uploadDir + savedFileName);
        multipartFile.transferTo(file);

        // 3. 클라이언트가 접근할 수 있는 URL 경로 생성하여 반환
        // 예: http://localhost:8080/uploads/xxxxxxxx-xxxx.jpg
        return serverUrl + "/uploads/" + savedFileName;
    }
}
