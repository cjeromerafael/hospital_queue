-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 17, 2026 at 02:34 AM
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
  `is_finance` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`department_id`, `department_name`, `department_code`, `is_finance`) VALUES
(1, 'PhilHealth OECB (Outpatient Emergency Care Benefits)', 'OEC', 0),
(2, 'Outpatient - Internal Medicine', 'INT', 0),
(3, 'Outpatient - Pediatrics', 'PED', 0),
(4, 'Outpatient - OB-Gynecology', 'OBG', 0),
(5, 'Outpatient - Surgery', 'SUR', 0),
(6, 'Outpatient - Family Medicine', 'FAM', 0),
(7, 'Outpatient - Nephrology', 'NEP', 0),
(8, 'Outpatient - Neurology', 'NEU', 0),
(9, 'Heart Station', 'HRT', 0),
(10, 'Physical Therapy', 'PHT', 0),
(11, 'Dietary', 'DIT', 0),
(12, 'Dialysis', 'DLY', 0),
(13, 'Laboratory', 'LAB', 0),
(14, 'X-Ray', 'XRY', 0),
(15, 'Emergency / Triage', 'EMR', 0),
(16, 'Patient Reception / Registration', 'PRR', 0),
(18, 'Pharmacy', 'PHA', 0),
(19, 'Records', 'REC', 0),
(20, 'PhilHealth YAKAP (Yaman ng Kalusugan Program / Patient Assistance and Social Services)', 'YKP', 0),
(22, 'Admin', 'ADM', 0),
(24, 'Billing - Admission', 'BAD', 1),
(25, 'Billing - OPD', 'BOP', 1),
(26, 'Cashier', 'CAS', 1),
(27, 'Medical Social Services Department', 'MSS', 1);

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
(1, 1, 22, 'admin'),
(2, 2, 22, 'admin'),
(3, 3, 13, 'staff'),
(4, 4, 15, 'staff'),
(5, 5, 16, 'staff'),
(6, 6, 18, 'staff'),
(7, 7, 2, 'staff'),
(8, 8, 3, 'staff'),
(9, 9, 4, 'staff'),
(10, 10, 5, 'staff'),
(11, 11, 6, 'staff'),
(12, 12, 7, 'staff'),
(13, 13, 8, 'staff'),
(14, 14, 9, 'staff'),
(15, 15, 10, 'staff'),
(16, 16, 11, 'staff'),
(17, 17, 12, 'staff'),
(18, 18, 14, 'staff'),
(19, 19, 19, 'staff');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `raw_password` varchar(255) DEFAULT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'staff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `username`, `password`, `raw_password`, `fullname`, `department_id`, `role`) VALUES
(1, 'admin1', '$2y$10$59PnqxtqSsUXvQwnDJBige4EV3QzLJCgCC8IEfebrUNFWiwceS5ou', 'euTqWIZkLGRwAstRFL7XyyFM8VF5uF7XZjsvAGhJG70=', 'admin1', 22, 'admin'),
(2, 'admin2', '$2y$10$04QK/4bQH9ClpJHPYQL8j.kT31PK1C6fElrilchA5pAS0Dvxlu/sq', 'UhW2VPrHwBJ00DOUWvB9H4QMuxrIUYk0EpowrAYD8Ik=', 'admin2', 22, 'admin'),
(3, 'staff1', '$2y$10$HsqDkEvKzYtZuWKyrs20TuIXS/E1R/h3hoe1IarQHPPfYU.UNJdIi', 'zvNbB8dvq7dEaeqJ0lkleR5WSr4yhuABCUyHAQL5G+A=', 'Lab', 13, 'staff'),
(4, 'cashier', '$2y$10$VSjQgN/s8w7tLK2TglCRUuPWXmfweemDSOslzYnNgGOiOy62JG53q', 'P7Ww7SwjYFfSh7dBdtEYnyj4iUQqCGMW8jqLL5fALwI=', 'Triage', 26, 'staff'),
(5, 'billopd', '$2y$10$LLoF.BzpOvF3dYEXZsLcgeg7Bi./uRVgX9tBI.ydbEXdd5xqlz.ea', 'JitzAwB6hj9VRUdMEOS75AABnJlUNrbONKRBa6U99EI=', 'Reception', 25, 'staff'),
(6, 'billadm', '$2y$10$SsPLQISeXCrOsvUkjPxBQucociJWebtQTcg6IVYba3iTGOzelzbia', 'kd9ff2AaxnKBROOpvVY5CU5qPEWEtX6jpRNHeOSughU=', 'Pharmacy', 24, 'staff'),
(7, 'mssd', '$2y$10$6wqpiyFPKuOQGL9IsbFJ7Oei.HQp9p70WByAnGRiyGWwzwxrkRwVS', 'aN3a7WRjNIXQb2IwONRgQWAvM1qfE6wxXd/CWaTlg1Y=', 'IM', 27, 'staff'),
(8, 'staff6', '$2y$10$dDgbp8dlRICmK/QCWrH7.u0CNgxZrx65wvYgtHdZIH0/VIMGUhwbO', '3vDXEWMRRoAUhnWZwFMitFrKA/xFNXH3My+pnpKot1Y=', 'Pedia', 3, 'staff'),
(9, 'staff7', '$2y$10$YhEqGUeLx.vvfOq4cQlkXupRpG.LGnb5/N7J0YWbInsZ2vtmfmpVW', 'HF47hsRHzT7RQpV3VAgK1ZUcGhTIHIDxE4XKNk7rYfE=', 'OB-Gyne', 4, 'staff'),
(10, 'staff8', '$2y$10$Ye7Mgbe2YkSayHWU/7.iXuUveNj2lTKJciAmkaPKHa/EnnGRCSm6q', '4HXSo9dlKKoqdICX7K/wBIa+Ht7kF8kuEVR4TtSxuKw=', 'Surgery', 5, 'staff'),
(11, 'staff9', '$2y$10$ed0lOYi.1z73LA/K6tQoGeBITquBIoCBBRHV9f1xU5WpTtU1Z7jb2', 'ONBSWu2g+sntFHyw/x84EfyqzeNlgVSjij22u1R0Jq4=', 'FM', 6, 'staff'),
(12, 'staff10', '$2y$10$xqInzKDjZtKpM.uKblS4L.j.f37F3GpefnVWhZVQjopjH6sTj.8eC', 'tcUaE/0VZqQcZghzGj/tLAqZ74bRxd/pxVr/3AjqfSs=', 'Nephrology', 7, 'staff'),
(13, 'staff11', '$2y$10$g.L.RoEQlXIH11JK5P5K..xcmJarSlpOu/Y6SgQLuEayxV//3ZSL.', 'cgIxJ9L1ppLpcFD9Kt+b1MMUTmGkfYKvvokL7PS6qVg=', 'Neurology', 8, 'staff'),
(14, 'staff12', '$2y$10$QZt5Bx3I0yFrVoIe2ZNnBe5sUfRUebOyfLj4bPRp.GE5NQmfXmUPu', 's8X8Y6gjy9R8WPTJgi6s0vgWWWT0RbMFV9SmZBTbW7s=', 'Heart Station', 9, 'staff'),
(15, 'staff13', '$2y$10$vQsS3.QGMGaut6s99LYeP.qXU8K4WTHz.qselPRhkYrrIM2Lk2Vmi', 'OrxFwMDKHOwAa9PE8D4k5FE6Pwd9Zjja87tza4+CuqU=', 'Physical Therapy', 10, 'staff'),
(16, 'staff14', '$2y$10$Q4s1Drxc.kbz22Y8L82Nj.FFM/juBntvFujM3qcghy4IPJv/Y/WW2', '3dBSm+AmbCyFIu7CmT6GYgmLhwcs9mY/Vro+YVIiwqs=', 'Dietary', 11, 'staff'),
(17, 'staff15', '$2y$10$vIsGu68kDN3UYdCdt8L/5ubMdG7uaW6YkZuxm4M0felAIEnbEErHC', 'IKvJ2h32hqFY4magxDsWSI7Mq9ofG17Uf5DbQSlypdI=', 'Dialysis', 12, 'staff'),
(18, 'staff16', '$2y$10$VWiHWYdGhm4VCW6./pUVDuHclyVfu90Z7kkcTYds4e2lRIO49kBha', 'ZssYDUGlfyjcxb2K+phqjkPT4b8gmNa33QVyFGyGxOw=', 'X-Ray', 14, 'staff'),
(19, 'staff17', '$2y$10$aGJ3maGDWZ.3Swo2Fz28Ge8y2T2YgQk9b2MkhxB0DocQw/.91KwRq', 'iKAhUOmuj6dP3aeN4fhQ00sbekuZtmfdXi4HziAPkWU=', 'Records', 19, 'staff'),
(20, 'staff18', '$2y$10$EDulQ5UzJvAaCn/0niWWrepkZ0B0WE6O1bzmal6W6OBzjFIaxvWHu', 'lEtjOIcZkPiOlGsdQLo1uYwgD+XYUwbmkKs1iEKEOgI=', 'OECB', 1, 'staff');

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
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `patient`
--
ALTER TABLE `patient`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT for table `queueing`
--
ALTER TABLE `queueing`
  MODIFY `queue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

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
