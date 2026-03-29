-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: hospital_queue
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `department`
--

DROP TABLE IF EXISTS `department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `department` (
  `department_id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `department_code` varchar(3) DEFAULT NULL,
  `is_finance` tinyint(1) DEFAULT 0,
  `department_color` varchar(7) DEFAULT '#3b82f6',
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department`
--

LOCK TABLES `department` WRITE;
/*!40000 ALTER TABLE `department` DISABLE KEYS */;
INSERT INTO `department` VALUES (1,'PhilHealth OECB (Outpatient Emergency Care Benefits)','OEC',1,'#a50909'),(16,'Patient Reception / Registration','PRR',0,'#062e6f'),(18,'Pharmacy','PHA',0,'#062e6f'),(20,'PhilHealth YAKAP (Yaman ng Kalusugan Program / Patient Assistance and Social Services)','YKP',1,'#a50909'),(22,'Admin','ADM',0,'#062e6f'),(24,'Billing - Admission','BAD',1,'#a50909'),(25,'Billing - OPD','BOP',1,'#a50909'),(26,'Cashier','CAS',1,'#a50909'),(27,'Medical Social Services Department','MSS',1,'#a50909'),(30,'Inpatient - Billing','INB',1,'#a50909');
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient` (
  `patient_id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_number` varchar(50) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`patient_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queue_state`
--

DROP TABLE IF EXISTS `queue_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `queue_state` (
  `department_id` int(11) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 0,
  `next_number` int(11) NOT NULL DEFAULT 1,
  `skipped_numbers_json` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queue_state`
--

LOCK TABLES `queue_state` WRITE;
/*!40000 ALTER TABLE `queue_state` DISABLE KEYS */;
/*!40000 ALTER TABLE `queue_state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queueing`
--

DROP TABLE IF EXISTS `queueing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `queueing` (
  `queue_id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_number` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `status` varchar(30) DEFAULT 'waiting',
  PRIMARY KEY (`queue_id`),
  KEY `patient_id` (`patient_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `queueing_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `queueing_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queueing`
--

LOCK TABLES `queueing` WRITE;
/*!40000 ALTER TABLE `queueing` DISABLE KEYS */;
/*!40000 ALTER TABLE `queueing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `department_role` varchar(50) NOT NULL,
  PRIMARY KEY (`role_id`),
  KEY `user_id` (`user_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,1,22,'sysadmin'),(2,2,22,'sysadmin'),(5,5,16,'staff'),(6,6,18,'staff');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `raw_password` varchar(255) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'staff',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'admin','$2y$10$Gp9fmVuFDykoWbRrK/SZxuZrWU3MyqiTjoaOnCsw4g0WOMoxS/WTK','uEoeid/dHDtB1B/lPN0aKmk61g5lanWjeASr/nmatTc=',22,'sysadmin'),(2,'test','$2y$10$4ukCmfYK3tmc6IAI/4mN4uGoyWWNIaBmpN.vYiuURru2HYoZvgxIm','jl6+h9BBqjHlht9gukAImpYjW9XcssjEogHXc1tNJAI=',16,'staff'),(4,'cashier','$2y$10$VSjQgN/s8w7tLK2TglCRUuPWXmfweemDSOslzYnNgGOiOy62JG53q','P7Ww7SwjYFfSh7dBdtEYnyj4iUQqCGMW8jqLL5fALwI=',26,'staff'),(5,'billopd','$2y$10$LLoF.BzpOvF3dYEXZsLcgeg7Bi./uRVgX9tBI.ydbEXdd5xqlz.ea','JitzAwB6hj9VRUdMEOS75AABnJlUNrbONKRBa6U99EI=',25,'staff'),(6,'billadm','$2y$10$SsPLQISeXCrOsvUkjPxBQucociJWebtQTcg6IVYba3iTGOzelzbia','kd9ff2AaxnKBROOpvVY5CU5qPEWEtX6jpRNHeOSughU=',24,'staff'),(7,'mssd','$2y$10$hsln/uUz7JAx7YNj7NJML.UF2urOSjqP9e/S306JKWVlZ4qud0rfC','BCh3yzpQIN9E6vSe5aV2czavkrZKooLXj2JIWubWTgs=',27,'staff'),(23,'inpatient','$2y$10$szFh5aNN9Hv5SWZgXHWcKOMpmuZbVuBt0rmVLBQIIKH1Fv/WkNCzC','Q/xzs7qxMCgNklgGdiLJNfAQBeDU0WKfZo2ZYCj6bwM=',30,'staff'),(24,'oecb','$2y$10$eFaj.DcVWl7G7jEnycdMxeTq7abcszxiFlsJPDr95YCptC5SvlqmK','ewPACLcj4mlyzoA/fOS2ZvJ4jOAPOybu9NFxC/GZGbA=',1,'staff'),(25,'master','$2y$10$uiitzVAIYKyPJwHz3sgeOO4pUqO0cF3PoBYqcdyDGrvxgpifQGaU2','pF8Bdj+TW8Pug6UqG063GG/aONfDkUN/WEC9GWnVVu4=',22,'admin'),(27,'pharmacy','$2y$10$3E9kkkHrIAtB9ubiruaxI.kPsq6YyhoVMZoVtN8LAWtlFCFJRMxC6','dqvebZItckh92P0JQOaYOov+lSaZwbDvi5zwLOscvzo=',18,'staff');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-29 20:13:19
