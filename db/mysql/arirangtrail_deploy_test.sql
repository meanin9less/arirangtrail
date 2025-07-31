CREATE DATABASE  IF NOT EXISTS `arirangtrail` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `arirangtrail`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: arirangtrail
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `reviewphotos`
--

DROP TABLE IF EXISTS `reviewphotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviewphotos` (
  `photoid` bigint NOT NULL AUTO_INCREMENT COMMENT '사진 고유 ID',
  `reviewid` bigint NOT NULL COMMENT '리뷰 ID (reviews 테이블 참조)',
  `imageurl` varchar(255) NOT NULL COMMENT '이미지 저장 주소(URL)',
  `caption` varchar(255) DEFAULT NULL COMMENT '사진에 대한 짧은 설명',
  `createdat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`photoid`),
  KEY `fkphotostoreviews` (`reviewid`),
  CONSTRAINT `fkphotostoreviews` FOREIGN KEY (`reviewid`) REFERENCES `reviews` (`reviewid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='리뷰 사진 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviewphotos`
--

LOCK TABLES `reviewphotos` WRITE;
/*!40000 ALTER TABLE `reviewphotos` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviewphotos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `reviewid` bigint NOT NULL AUTO_INCREMENT COMMENT '리뷰 고유 ID',
  `username` varchar(255) NOT NULL COMMENT '작성자 ID (users 테이블 참조)',
  `contentid` bigint NOT NULL COMMENT '행사 ID',
  `contenttitle` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL COMMENT '리뷰 제목',
  `content` tinytext NOT NULL,
  `rating` decimal(2,1) NOT NULL COMMENT '평점 (예: 4.5)',
  `visitdate` date DEFAULT NULL COMMENT '방문 일자',
  `createdat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`reviewid`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(255) NOT NULL COMMENT '사용자 고유 ID',
  `password` varchar(255) NOT NULL COMMENT '비밀번호 (해시하여 저장)',
  `role` varchar(45) NOT NULL,
  `email` varchar(255) NOT NULL COMMENT '이메일 (로그인 ID)',
  `firstname` varchar(50) NOT NULL COMMENT '이름',
  `lastname` varchar(50) NOT NULL COMMENT '성',
  `birthdate` date DEFAULT NULL,
  `nickname` varchar(50) NOT NULL COMMENT '닉네임',
  `imageurl` varchar(255) DEFAULT NULL COMMENT '프로필 이미지 URL',
  `createdat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
  `updatedat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정 시각',
  PRIMARY KEY (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `nickname` (`nickname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='사용자 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('aaa','$2a$10$sZsyMt.8cVQ8xhHW7ZBg0eu9whRT97koqaLVgmD/zaWGd/ENaq6G.','ROLE_USER','asd@asfsa.com','asd','sadfas',NULL,'aaa',NULL,'2025-07-16 18:57:01','2025-07-17 04:15:05'),('bbb','$2a$10$8.rSW0CkFPpnhNou046ulu1it7fM6GknHaqnnNVT8FcsZbSLPMtWq','ROLE_USER','asd@asfsad.com','asd','sadfas',NULL,'aaa1',NULL,'2025-07-16 18:58:18','2025-07-17 04:15:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-21 16:24:02
