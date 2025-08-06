-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: bookmarket
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
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book` (
  `isbn` varchar(20) NOT NULL,
  `title` varchar(100) NOT NULL,
  `date` int DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `description` text,
  `category` varchar(50) DEFAULT NULL,
  `publishDate` varchar(20) DEFAULT NULL,
  `imgPath` varchar(255) DEFAULT NULL,
  `amount` int DEFAULT '0',
  `publisher` varchar(45) DEFAULT NULL,
  `price` int DEFAULT NULL,
  PRIMARY KEY (`isbn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES ('1111','자바 코드의 품질을 높이는 100가지 방법 ',NULL,'타기르 발레예프','자바 개발에서 반복적으로 발생하는 100가지 실수를 모아 더 나은 코드를 작성할 수 있도록 돕는 실전 가이드다. 단순한 코드 리뷰를 넘어, 실제 사례와 코드 예제를 통해 표현식, 프로그램 구조, 숫자 처리, 예외 처리, 유닛 테스트 등에서 발생할 수 있는 다양한 문제의 원인과 해결책을 깊이 있게 탐구한다. 각 장은 독립적으로 구성되어 있어 관심 있는 주제별로 자유롭게 학습할 수 있으며, 초보자부터 숙련자까지 모든 수준의 자바 개발자에게 유용하다.','프로그래밍 언어','2025년 3월','/img/book1',1,'한빛미디어',25000),('1112','혼자 공부하는 자바',NULL,'신용권','더욱 풍성한 내용을 담아 돌아왔다. 개정판은 기존의 자바 8 & 11 버전은 물론, 최신 버전인 자바 21까지 다룬다. 자바 21 버전의 강화된 언어 기능을 담은 총 260개의 손코딩 예제와 함께 최신 개발 환경에서 여러분의 프로그래밍 실력을 한층 더 업그레이드해 보자.','프로그래밍 언어 ','2024년 2월','/img/book2',1,'한빛미디어',23000),('1113','Do it! 알고리즘 코딩 테스트 : 자바 편',NULL,'김종관','“코딩 테스트는 어떻게 준비해야 할까?” 곧 코딩 테스트를 앞두고 있거나 올해 안에 IT 기업으로 취업 또는 이직을 준비하고 있다면 누구나 이런 고민을 할 것이다. 《Do it! 알고리즘 코딩 테스트 — 자바 편》에 그 답이 있다.','프로그래밍 언어 ','2022년 4월','/img/book3',1,'이지스퍼블리싱',17000),('1114','자바의 신 VOL.1 : 기초 문법편',NULL,'이상민','현장 전문가가 쓴 자바 기초 입문서다. NAVER, NHN, SKPlanet 등에서 성능 전문가의 풍부한 경험을 바탕으로 자바를 실무에 맞게 제대로 쓸 줄 알게 해주는 입문서를 목표를 만들었다. 현장 중심형 자바 기초 문법서다. 혼자 공부하는 독자를 위해 연습문제를 직접 풀고 제출하여 모법답안을 확인할 수 있는 시스템을 구축하였고 독자 서비스를 위해 < 자바의 신> 카페를 10년 넘게 운영하고 있다. 3판에서는 Java 9부터 지원되는 jshell로 본문의 모든 예제를 실행해보면서 복습해볼 수 있도록 하였다.','프로그래밍 언어 ','2023년 10월','/img/book4',1,'로드북 ',27000),('1115','대규모 리액트 웹 앱 개발',NULL,'하산 지르데','확장 가능한 대규모 자바스크립트 웹 애플리케이션을 구축하는 방법','웹디자인/홈페이지','2025년 2월','/img/book5',1,'제이펍',35000),('1116','패턴으로 익히고 설계로 완성하는 리액트',NULL,'준타오 추','리액트를 활용한 대규모 애플리케이션 개발은 비동기 처리, 상태 관리, 성능 최적화 등 다양한 도전을 동반한다. 이 책은 리액트 개발에서 자주 발생하는 안티패턴을 정의하고, 이를 검증된 설계 원칙으로 해결하는 방법을 제시한다. 실용적인 예제와 단계별 접근으로 코드 구조를 개선하고 TDD, 설계 원칙을 통해 신뢰할 수 있는 애플리케이션을 만드는 법을 배운다.','웹디자인/홈페이지','2025년 2월','/img/book6',1,'한빛미디어',25000);
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrows`
--

DROP TABLE IF EXISTS `borrows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrows` (
  `user_id` varchar(50) DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  KEY `user_id` (`user_id`),
  CONSTRAINT `borrows_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrows`
--

LOCK TABLES `borrows` WRITE;
/*!40000 ALTER TABLE `borrows` DISABLE KEYS */;
/*!40000 ALTER TABLE `borrows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `user_id` varchar(50) DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  KEY `user_id` (`user_id`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `pw` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `imgPath` varchar(255) DEFAULT NULL,
  `point` int DEFAULT '0',
  `grade` varchar(20) DEFAULT NULL,
  `totalPayed` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('aaa123','1234','김주언','01099605629','수원시 영통구 매탄동 140번길 ','/img/kim.png',1000,'silver',50000),('bbb123','1234','박민규','01029352843','경기도 하남시 하남구 88번길','/img/park.png',4000,'gold',30000),('ccc123','1234','조정태','01038829432','서울 건대역 어딘가','/img/joe.png',13000,'vip',330000);
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

-- Dump completed on 2025-05-02  5:47:29
