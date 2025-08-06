//package com.example.arirangtrail.config;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
//import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
//import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
//
//@Configuration
//@RequiredArgsConstructor
//public class WebMvcConfig implements WebMvcConfigurer {
//    private final VisitorInterceptor visitorInterceptor;
//
////    @Value("${file.upload-dir}")
////    private String uploadDir;
////
////    @Override
////    public void addResourceHandlers(ResourceHandlerRegistry registry) {
////        // /uploads/** URL로 오는 요청은
////        registry.addResourceHandler("/uploads/**")
////                // file:///C:/dev/uploads/ (윈도우) 또는 file:/home/ubuntu/uploads/ (리눅스)
////                // 디렉토리에서 파일을 찾아서 제공하라는 의미
////                .addResourceLocations("file:" + uploadDir);
////    }
//
//    @Override
//    public void addInterceptors(InterceptorRegistry registry) {
//        registry.addInterceptor(visitorInterceptor)
//                .addPathPatterns("/**") // 모든 경로에 대해 인터셉터를 적용
//                .excludePathPatterns("/css/**", "/images/**", "/js/**", "/favicon.ico"); // 정적 리소스 등 제외
//    }
//}