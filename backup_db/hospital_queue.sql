-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 22, 2026 at 03:02 AM
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
  `is_finance` tinyint(1) DEFAULT 0,
  `department_color` varchar(7) DEFAULT '#3b82f6'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`department_id`, `department_name`, `is_finance`, `department_color`) VALUES
(1, 'OECB (Outpatient Emergency Care Benefits)', 1, '#a50909'),
(16, 'Patient Reception / Registration', 0, '#062e6f'),
(18, 'Pharmacy', 0, '#062e6f'),
(20, 'PhilHealth YAKAP', 1, '#a50909'),
(22, 'Admin', 0, '#062e6f'),
(24, 'Billing - Admission', 1, '#a50909'),
(25, 'Billing - OPD', 1, '#a50909'),
(26, 'Cashier', 1, '#a50909'),
(27, 'Medical Social Services Department', 1, '#a50909'),
(30, 'Inpatient - Billing', 1, '#a50909');

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
(1, 1, 2, '[]', '2026-04-21 23:32:54'),
(16, 1, 2, '[]', '2026-04-21 23:32:55'),
(18, 1, 2, '[]', '2026-04-21 23:32:58');

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
  `department_id` int(11) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'staff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `username`, `password`, `department_id`, `role`) VALUES
(1, 'admin', '$2y$10$Gp9fmVuFDykoWbRrK/SZxuZrWU3MyqiTjoaOnCsw4g0WOMoxS/WTK', 22, 'sysadmin'),
(2, 'test', '$2y$10$cajvXzU8S49IaxJUzAmRtuFWpnXlCAmmQUoSr29L.ULf1splZ9tfK', 16, 'staff'),
(4, 'cashier', '$2y$10$VSjQgN/s8w7tLK2TglCRUuPWXmfweemDSOslzYnNgGOiOy62JG53q', 26, 'staff'),
(5, 'billopd', '$2y$10$LLoF.BzpOvF3dYEXZsLcgeg7Bi./uRVgX9tBI.ydbEXdd5xqlz.ea', 25, 'staff'),
(6, 'billadm', '$2y$10$SsPLQISeXCrOsvUkjPxBQucociJWebtQTcg6IVYba3iTGOzelzbia', 24, 'staff'),
(7, 'mssd', '$2y$10$yoWdwG/XPPLC6nA4Zsh9N.vHgcbf4.JjU6lQAhlXpYzDaUKN3f4uu', 27, 'staff'),
(23, 'inpatient', '$2y$10$szFh5aNN9Hv5SWZgXHWcKOMpmuZbVuBt0rmVLBQIIKH1Fv/WkNCzC', 30, 'staff'),
(24, 'oecb', '$2y$10$eFaj.DcVWl7G7jEnycdMxeTq7abcszxiFlsJPDr95YCptC5SvlqmK', 1, 'staff'),
(25, 'master', '$2y$10$uiitzVAIYKyPJwHz3sgeOO4pUqO0cF3PoBYqcdyDGrvxgpifQGaU2', 22, 'admin'),
(27, 'pharmacy', '$2y$10$3E9kkkHrIAtB9ubiruaxI.kPsq6YyhoVMZoVtN8LAWtlFCFJRMxC6', 18, 'staff'),
(62, 'yakap', '$2y$10$TjOmeOZZx42cBHbD7paIDujooLLU7egu/61DGMwGRlmRMwk1XAV5K', 20, 'staff'),
(63, 'patient2', '$2y$10$QrFDe0XXHrm8C0j73fH9hujC507YydXba/u6BVMzWCXoY59jA9g8G', 16, 'staff');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`department_id`);

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
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- Constraints for dumped tables
--

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
