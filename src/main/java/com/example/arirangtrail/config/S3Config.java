package com.example.arirangtrail.config;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

//컨피겨 잠시 꺼놓기
@Configuration
@Profile("prod") // "prod" 프로필이 활성화될 때만 이 빈(Bean)을 생성하라는 의미!
public class S3Config {

    @Value("${cloud.aws.region.static}")
    private String region;

    @Bean
    public AmazonS3 amazonS3Client() {
        // The DefaultAWSCredentialsProviderChain will look for credentials in the following order:
        // 1. Environment Variables - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
        // 2. Java System Properties - aws.accessKeyId and aws.secretKey
        // 3. Credential profiles file at the default location (~/.aws/credentials)
        // 4. Credentials delivered through the Amazon EC2 container service
        // 5. Instance profile credentials delivered through the Amazon EC2 metadata service
        // This is perfect for our use case where we inject credentials via GitHub Actions.
        AWSCredentials credentials = DefaultAWSCredentialsProviderChain.getInstance().getCredentials();

        return AmazonS3ClientBuilder
                .standard()
                .withCredentials(new AWSStaticCredentialsProvider(credentials))
                .withRegion(region)
                .build();
    }
}
