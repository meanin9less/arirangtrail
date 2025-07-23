package com.example.arirangtrail.service.chat;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ChatFileService {

    private final Path fileStorageLocation;
    private final String serverUrl;

    // 생성자를 통해 application.properties의 값을 주입받습니다.
    public ChatFileService(@Value("${file.upload-dir}") String uploadDir,
                           @Value("${server.url}") String serverUrl) {
        // 1. 설정 파일의 경로를 기반으로 Path 객체를 생성합니다.
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.serverUrl = serverUrl;
    }

    /**
     * @PostConstruct: 이 서비스 Bean이 생성되고 의존성 주입이 완료된 후, 자동으로 실행되는 초기화 메소드입니다.
     * 서버가 시작될 때 딱 한 번 실행되어 업로드 폴더의 존재 여부를 확인하고 없으면 생성합니다.
     */
    @PostConstruct
    public void init() {
        try {
            // 2. 저장할 폴더가 존재하지 않으면, 해당 폴더를 생성합니다. (mkdirs와 동일한 기능)
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            // 폴더 생성 실패 시, 서버 시작 단계에서 에러를 발생시켜 문제를 즉시 인지할 수 있게 합니다.
            throw new RuntimeException("업로드 디렉토리를 생성할 수 없습니다.", ex);
        }
    }

    public String saveFile(MultipartFile file) throws IOException {
        // 3. 파일 원본 이름에서 안전하지 않은 문자열을 제거합니다. (예: ../)
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        // 4. 파일 이름이 다른 사용자와 겹치지 않도록 고유한 UUID를 앞에 붙여줍니다.
        //    확장자는 원본 파일의 것을 그대로 사용합니다.
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String uniqueFileName = UUID.randomUUID().toString() + extension;

        try {
            // 5. 최종 저장 경로를 계산합니다. (예: /home/ubuntu/arirang_uploads/unique_name.jpg)
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);

            // 6. 파일의 InputStream을 타겟 경로로 복사합니다. 파일이 이미 존재하면 덮어씁니다.
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 7. 클라이언트가 접근할 수 있는 최종 URL을 조합하여 반환합니다.
            //    (주의) 이 URL(/uploads/...)이 실제로 동작하려면 웹 서버(Nginx 등)의 추가 설정이 필요합니다.
            return serverUrl + "/uploads/" + uniqueFileName;

        } catch (IOException ex) {
            // 파일 저장 중 I/O 에러 발생 시, 예외를 호출한 쪽으로 던져서 처리하도록 합니다.
            throw new IOException("파일 저장에 실패했습니다. 파일명: " + originalFileName, ex);
        }
    }
}