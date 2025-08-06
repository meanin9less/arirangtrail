//package com.example.arirangtrail.config;
//
//import com.example.arirangtrail.service.redis.VisitorService;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Component;
//import org.springframework.web.servlet.HandlerInterceptor;
//
//@Component
//@RequiredArgsConstructor
//public class VisitorInterceptor implements HandlerInterceptor {
//
//    private final VisitorService visitorService;
//
//    @Override
//    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
//        // 컨트롤러 로직이 실행되기 전에 방문자 기록 로직을 실행
//        // 이미지, CSS, JS 같은 정적 리소스 요청은 제외할 수 있지만, 우선 모든 요청에 대해 실행
//        visitorService.recordVisitor(request, response);
//
//        // 항상 true를 반환하여 요청이 컨트롤러로 계속 진행되도록 함
//        return true;
//    }
//}
