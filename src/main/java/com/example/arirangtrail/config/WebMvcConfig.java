package com.example.arirangtrail.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

//@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /uploads/** URL로 오는 요청은
        registry.addResourceHandler("/uploads/**")
                // file:///C:/dev/uploads/ (윈도우) 또는 file:/home/ubuntu/uploads/ (리눅스)
                // 디렉토리에서 파일을 찾아서 제공하라는 의미
                .addResourceLocations("file:" + uploadDir);
    }
}