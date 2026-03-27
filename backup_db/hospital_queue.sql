-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 27, 2026 at 06:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospital_queue`
--

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `department_code` varchar(3) DEFAULT NULL,
  `is_finance` tinyint(1) DEFAULT 0,
  `department_color` varchar(7) DEFAULT '#3b82f6'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`department_id`, `department_name`, `department_code`, `is_finance`, `department_color`) VALUES
(1, 'PhilHealth OECB (Outpatient Emergency Care Benefits)', 'OEC', 1, '#a50909'),
(16, 'Patient Reception / Registration', 'PRR', 0, '#062e6f'),
(18, 'Pharmacy', 'PHA', 0, '#062e6f'),
(20, 'PhilHealth YAKAP (Yaman ng Kalusugan Program / Patient Assistance and Social Services)', 'YKP', 1, '#a50909'),
(22, 'Admin', 'ADM', 0, '#062e6f'),
(24, 'Billing - Admission', 'BAD', 1, '#a50909'),
(25, 'Billing - OPD', 'BOP', 1, '#a50909'),
(26, 'Cashier', 'CAS', 1, '#a50909'),
(27, 'Medical Social Services Department', 'MSS', 1, '#a50909'),
(30, 'Inpatient - Billing', 'INB', 1, '#a50909');

-- --------------------------------------------------------

--
-- Table structure for table `patient`
--

CREATE TABLE `patient` (
  `patient_id` int(11) NOT NULL,
  `patient_number` varchar(50) NOT NULL,
  `department_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `queueing`
--

CREATE TABLE `queueing` (
  `queue_id` int(11) NOT NULL,
  `queue_number` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `status` varchar(30) DEFAULT 'waiting'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `queue_state`
--

CREATE TABLE `queue_state` (
  `department_id` int(11) NOT NULL,
  `current_number` int(11) NOT NULL DEFAULT 0,
  `next_number` int(11) NOT NULL DEFAULT 1,
  `skipped_numbers_json` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `queue_state`
--

INSERT INTO `queue_state` (`department_id`, `current_number`, `next_number`, `skipped_numbers_json`, `updated_at`) VALUES
(16, 0, 1, '[]', '2026-03-27 04:40:28'),
(18, 0, 1, '[]', '2026-03-27 04:39:21'),
(27, 0, 1, '[]', '2026-03-27 03:08:31'),
(30, 0, 1, '[]', '2026-03-27 04:40:27');

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `role_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `department_role` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`role_id`, `user_id`, `department_id`, `department_role`) VALUES
(1, 1, 22, 'sysadmin'),
(2, 2, 22, 'sysadmin'),
(5, 5, 16, 'staff'),
(6, 6, 18, 'staff');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `raw_password` varchar(255) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'staff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `username`, `password`, `raw_password`, `department_id`, `role`) VALUES
(1, 'admin1', '$2y$10$bEeF.zkh4FxvUOCq8pmIMen8yG7GIpMDJY9UKaxeIUd5mgwCepMRe', '92ob6dLUsNJxjnxVAdoHdBnjDLeSJxppW6sGMXmroko=', 22, 'sysadmin'),
(2, 'test', '$2y$10$5M/shF4jmxN6e4UiDRJNEeq5uf01XXX6gUp2emzCZJnUdaB/B1Ldu', 'e8y6oco28WVqLieMCqdkBYa42na7REPOGbJIdo0Np9I=', 16, 'staff'),
(4, 'cashier', '$2y$10$VSjQgN/s8w7tLK2TglCRUuPWXmfweemDSOslzYnNgGOiOy62JG53q', 'P7Ww7SwjYFfSh7dBdtEYnyj4iUQqCGMW8jqLL5fALwI=', 26, 'staff'),
(5, 'billopd', '$2y$10$LLoF.BzpOvF3dYEXZsLcgeg7Bi./uRVgX9tBI.ydbEXdd5xqlz.ea', 'JitzAwB6hj9VRUdMEOS75AABnJlUNrbONKRBa6U99EI=', 25, 'staff'),
(6, 'billadm', '$2y$10$SsPLQISeXCrOsvUkjPxBQucociJWebtQTcg6IVYba3iTGOzelzbia', 'kd9ff2AaxnKBROOpvVY5CU5qPEWEtX6jpRNHeOSughU=', 24, 'staff'),
(7, 'mssd', '$2y$10$hsln/uUz7JAx7YNj7NJML.UF2urOSjqP9e/S306JKWVlZ4qud0rfC', 'BCh3yzpQIN9E6vSe5aV2czavkrZKooLXj2JIWubWTgs=', 27, 'staff'),
(23, 'inpatient', '$2y$10$szFh5aNN9Hv5SWZgXHWcKOMpmuZbVuBt0rmVLBQIIKH1Fv/WkNCzC', 'Q/xzs7qxMCgNklgGdiLJNfAQBeDU0WKfZo2ZYCj6bwM=', 30, 'staff'),
(24, 'oecb', '$2y$10$eFaj.DcVWl7G7jEnycdMxeTq7abcszxiFlsJPDr95YCptC5SvlqmK', 'ewPACLcj4mlyzoA/fOS2ZvJ4jOAPOybu9NFxC/GZGbA=', 1, 'staff'),
(25, 'master', '$2y$10$PRkElOHQcG8gfURwiawACuXf30MzL88Xb5jckQs7huumwnTo/ZOQS', 'ZzI0Y6UF8LBoXO6OHAVsGohKsM0rWzphxAHi3O25Qr4=', 22, 'admin'),
(27, 'pharmacy', '$2y$10$3E9kkkHrIAtB9ubiruaxI.kPsq6YyhoVMZoVtN8LAWtlFCFJRMxC6', 'dqvebZItckh92P0JQOaYOov+lSaZwbDvi5zwLOscvzo=', 18, 'staff');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`department_id`);

--
-- Indexes for table `patient`
--
ALTER TABLE `patient`
  ADD PRIMARY KEY (`patient_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `queueing`
--
ALTER TABLE `queueing`
  ADD PRIMARY KEY (`queue_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `queue_state`
--
ALTER TABLE `queue_state`
  ADD PRIMARY KEY (`department_id`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`role_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `department_id` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `patient`
--
ALTER TABLE `patient`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=163;

--
-- AUTO_INCREMENT for table `queueing`
--
ALTER TABLE `queueing`
  MODIFY `queue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=184;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `patient`
--
ALTER TABLE `patient`
  ADD CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `queueing`
--
ALTER TABLE `queueing`
  ADD CONSTRAINT `queueing_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `queueing_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `role`
--
ALTER TABLE `role`
  ADD CONSTRAINT `role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
