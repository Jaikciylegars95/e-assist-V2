-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : dim. 01 juin 2025 à 19:04
-- Version du serveur : 8.3.0
-- Version de PHP : 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `taskflow`
--

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`)
) ENGINE=MyISAM AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `content`, `created_at`) VALUES
(1, 2, 3, '242442', '2025-05-28 08:33:05'),
(2, 2, 3, '422424', '2025-05-28 08:33:13'),
(3, 2, 3, '42', '2025-05-28 08:33:19'),
(4, 3, 2, 'bonjour 2', '2025-05-28 08:36:46'),
(5, 3, 2, 'coucou 2 comment ca va', '2025-05-28 08:41:04'),
(6, 3, 2, 'coucou', '2025-05-28 08:54:06'),
(7, 3, 2, 'coucou', '2025-05-28 08:58:42'),
(8, 3, 2, 'coucou', '2025-05-28 09:08:22'),
(9, 3, 2, 'gaiedcvbhszuijvnsz', '2025-05-28 09:08:29'),
(10, 3, 4, 'coucou lesy', '2025-05-28 09:15:30'),
(11, 3, 2, 'comment ca va', '2025-05-28 09:20:27'),
(12, 3, 4, 'tena mbola tsy mety', '2025-05-28 09:20:48'),
(13, 4, 3, 'coucou', '2025-05-28 09:21:34'),
(14, 4, 3, 'coucou', '2025-05-28 09:32:31'),
(15, 4, 3, 'aona ty', '2025-05-28 09:35:12'),
(16, 4, 3, 'coucou', '2025-05-28 09:35:32'),
(17, 4, 3, 'efefe', '2025-05-28 09:35:40'),
(18, 2, 5, 'coucou', '2025-06-01 18:45:31'),
(19, 7, 2, 'bonjour', '2025-06-01 18:48:01'),
(20, 2, 7, 'comment ca va', '2025-06-01 18:48:09'),
(21, 7, 2, '🧚🦸‍♀️', '2025-06-01 18:59:32');

-- --------------------------------------------------------

--
-- Structure de la table `tags`
--

DROP TABLE IF EXISTS `tags`;
CREATE TABLE IF NOT EXISTS `tags` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#000000',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`name`(100)),
  KEY `tags_user_id_idx` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `status` enum('todo','in-progress','completed') NOT NULL DEFAULT 'todo',
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `title`, `description`, `priority`, `status`, `due_date`, `created_at`, `updated_at`) VALUES
('718fd63b-e0a2-48b7-87bf-ad0d0667c4be', '2', 'ajdfyeu', 'efefeef', 'high', 'in-progress', '2025-05-25', '2025-05-26 06:22:08', '2025-05-26 06:23:13'),
('54f48187-607a-43cc-a90c-839d75555527', '2', '5eme test', 'test', 'medium', 'completed', '2025-05-12', '2025-05-13 13:21:06', '2025-05-13 13:21:06'),
('ec77fecf-5ec4-4157-bcf0-cc0bfd41c54e', '2', 'ajdfyeu', 'efefeef', 'high', 'completed', '2025-05-26', '2025-05-26 06:22:08', '2025-05-26 07:03:34'),
('f5e79fb8-8e02-4e0d-9b52-814230ac82e9', '2', 'premier test', 'test', 'medium', 'completed', '2025-05-13', '2025-05-13 12:53:39', '2025-05-20 06:48:16'),
('59fe107a-c58a-4690-8de5-636619722e82', '2', 'test redondance', 'red', 'medium', 'completed', '2025-05-14', '2025-05-16 17:55:33', '2025-05-20 06:57:50'),
('9ea09e22-2cc2-4de1-a0ed-4c2a8e3cb6c2', '2', 'test', 'sas', 'medium', 'todo', NULL, '2025-05-23 08:45:51', '2025-05-23 08:45:51'),
('d72b3bc0-b8bd-434a-9d8b-57fad9c15a0b', '2', 'test redondance', 'red', 'high', 'completed', '2025-05-16', '2025-05-16 17:55:33', '2025-05-20 07:31:06'),
('9001f1fb-e0bc-4f21-9284-82a66cd4f9c2', '2', 'reedondance2', 'redO', 'medium', 'in-progress', '2025-05-28', '2025-05-16 17:57:27', '2025-05-20 07:03:07'),
('670a8cf3-5480-4f04-b408-517b216c51e9', '2', 'teteteeetetey', 'fffg', 'medium', 'todo', '2025-06-03', '2025-05-19 06:20:16', '2025-05-19 06:20:16'),
('4bc76996-6a79-4f57-af86-882a237fcb9d', '2', 'teteteeetetey', 'fffg', 'medium', 'todo', '2025-06-03', '2025-05-19 06:20:16', '2025-05-19 06:20:16'),
('3997e5d8-b97a-4de5-8c1f-168c5c28d004', '2', 'test redondance', 'ter', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:16', '2025-05-19 06:29:16'),
('a727724d-3e7f-4788-86b0-543bdfe14dec', '2', 'test redondance', 'ter', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:16', '2025-05-19 06:29:16'),
('08485f56-a8d8-4ccc-a6c8-727c7f509fa5', '2', 'test redondance 2e', 're', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:34', '2025-05-19 06:29:34'),
('e5bdb68d-80af-45fd-9787-4a96de4eafa8', '2', 'test redondance 2e', 're', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:34', '2025-05-19 06:29:34'),
('ab75af8b-02f0-40b8-851a-4f3b3f754d19', '2', 'tesdt', 'teteetrrgsvwbsrh', 'high', 'completed', '2025-05-18', '2025-05-19 06:33:37', '2025-05-20 08:50:08'),
('7aa57c01-cfd8-4a8c-8db8-38a0761294b2', '2', 'tesdt', 'teteetrrgsvwbsrh', 'high', 'in-progress', '2025-05-18', '2025-05-19 06:33:37', '2025-05-20 06:52:34'),
('50386f4d-a874-47eb-9dd6-c856ab1b20c9', '2', 'taskserv', 'rere', 'medium', 'todo', '2025-05-19', '2025-05-19 07:03:20', '2025-05-19 07:03:20'),
('93399c32-f5f6-4291-a0a2-b692b1f7a278', '2', 'reponse', 'et', 'medium', 'todo', '2025-05-18', '2025-05-19 06:41:05', '2025-05-19 06:41:56'),
('c2d80a40-6ce7-46e5-94a1-26fbd6495f59', '2', 'taskserv2', 'etfzeg', 'medium', 'todo', '2025-05-19', '2025-05-19 07:04:00', '2025-05-19 07:04:00'),
('587ce4cd-a24b-4b83-9648-f2e266b764a7', '2', 'tastkdopajrzgzrgzzrgzrg', 'zgfzgrzrgzr', 'medium', 'todo', '2025-05-24', '2025-05-19 07:08:31', '2025-05-19 07:08:31'),
('e3e497f9-8929-4d35-a7b5-9220d788b5f3', '2', 'teste toast', 'fe', 'medium', 'todo', '2025-05-22', '2025-05-19 07:19:07', '2025-05-19 07:19:07'),
('ac214829-0a76-46d5-a190-873f51c2b5a1', '2', 'test red', 'rer', 'high', 'in-progress', '2025-05-22', '2025-05-19 10:43:41', '2025-05-19 10:43:41'),
('5ea4a5e1-b0c0-4c17-a6c7-4af0876fd628', '2', 'ERE', 'ERE', 'medium', 'todo', '2025-05-21', '2025-05-21 20:02:56', '2025-05-21 20:02:56'),
('5d92b97c-ce65-47c7-bb0c-fee240fc6c53', '2', 'test tache', 'tre', 'medium', 'todo', '2025-05-23', '2025-05-23 07:31:58', '2025-05-23 07:31:58'),
('db2ffe4c-6312-447f-af7e-532568bcfcde', '2', 'test tache', 'test', 'medium', 'todo', '2025-05-30', '2025-05-23 07:43:40', '2025-05-23 07:43:40'),
('e41542c4-b8e9-4716-9908-40043f23b007', '2', 'test tache 2', 'teg', 'medium', 'todo', '2025-06-07', '2025-05-23 07:44:11', '2025-05-23 07:44:11'),
('7bfceb7f-da72-497b-a92c-d9529ac0e13f', '2', 'tache2', 'eifjheif', 'medium', 'todo', '2025-05-24', '2025-05-23 08:11:27', '2025-05-23 08:11:27'),
('16567518-aee5-4f67-a758-7fe935a6eeaa', '2', 'tache2', 'eifjheif', 'medium', 'todo', '2025-05-24', '2025-05-23 08:11:27', '2025-05-23 08:11:27'),
('c80f88e3-78ab-4453-b094-aa83599dfeb7', '2', 'test tache3', 'tache', 'medium', 'todo', '2025-05-23', '2025-05-23 08:18:11', '2025-05-23 08:18:11'),
('8bd90aa0-40ca-4eea-bffc-750e4e422b8f', '2', 'test tache3', 'tache', 'medium', 'todo', '2025-05-23', '2025-05-23 08:18:11', '2025-05-23 08:18:11'),
('5b4fa17c-3f9f-4495-b523-ec89f0bd3964', '2', 'testtask', 'testst', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:41', '2025-05-23 08:21:41'),
('61682269-583b-4ed8-88a8-9c587677617b', '2', 'testtask', 'testst', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:41', '2025-05-23 08:21:41'),
('7187100d-0e57-4234-b7d7-29cc6967092d', '2', 'task', 'fdafd', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:59', '2025-05-23 08:21:59'),
('fcca838c-434f-45e7-82db-4ec861455ace', '2', 'task', 'fdafd', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:59', '2025-05-23 08:21:59'),
('776a9eb8-c563-400d-933c-0b3ca04bbb41', '2', 'test456', 'eaeaé', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:20', '2025-05-23 08:29:20'),
('47eab7cf-e84c-4efb-88aa-b08ac8d7de1c', '2', 'test456', 'eaeaé', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:20', '2025-05-23 08:29:20'),
('fe9c544b-fc61-45cb-a62b-4b4445a27715', '2', 'rerere', 'er', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:43', '2025-05-23 08:29:43'),
('9cc6b268-eb69-46f3-8c4b-d63af931f4ea', '2', 'rerere', 'er', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:43', '2025-05-23 08:29:43'),
('c18726d5-812a-45dd-9c09-555637b40b15', '2', 'aeae', 'ae', 'medium', 'todo', '2025-05-23', '2025-05-23 08:37:32', '2025-05-23 08:37:32'),
('8513ea97-8210-47b9-89db-06b1671d6571', '2', 'aeae', 'ae', 'medium', 'todo', '2025-05-23', '2025-05-23 08:37:32', '2025-05-23 08:37:32'),
('9a1290f3-e6bc-4d01-a46a-bf88e7647836', '2', 'ajdjdjd', 'zdzdzdzd', 'low', 'todo', '2025-05-26', '2025-05-26 06:21:52', '2025-05-26 07:48:00'),
('d00fe88f-8024-4d9b-8369-823c055c6683', '2', 'ajdjdjd', 'zdzdzdzd', 'medium', 'todo', '2025-05-26', '2025-05-26 06:21:52', '2025-05-26 06:21:52'),
('0ad7df76-5cf6-45ac-a3e9-b691dcf7cf0a', '2', 'test35zr', 'zrzr', 'medium', 'todo', '2025-05-23', '2025-05-23 09:18:11', '2025-05-23 09:20:15'),
('525e8014-c9cb-40f8-9608-68d666c99358', '2', 'asio siramamy', 'mamy', 'high', 'todo', '2025-05-26', '2025-05-26 06:58:20', '2025-05-26 06:58:20'),
('3c67123c-cadb-47f7-a6bc-27ac8254815b', '2', 'asio siramamy', 'mamy', 'high', 'todo', '2025-05-26', '2025-05-26 06:58:20', '2025-05-26 06:58:20'),
('f2654f5f-7f97-4362-ada6-8a9073205d8d', '6', 'test 02', 'test ary eh', 'medium', 'in-progress', '2025-05-28', '2025-05-26 07:08:37', '2025-05-28 05:44:09');

--
-- Déclencheurs `tasks`
--
DROP TRIGGER IF EXISTS `update_tasks_updated_at`;
DELIMITER $$
CREATE TRIGGER `update_tasks_updated_at` BEFORE UPDATE ON `tasks` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
  END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `task_comments`
--

DROP TABLE IF EXISTS `task_comments`;
CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `task_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_comments_task_id_idx` (`task_id`),
  KEY `task_comments_user_id_idx` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déclencheurs `task_comments`
--
DROP TRIGGER IF EXISTS `update_task_comments_updated_at`;
DELIMITER $$
CREATE TRIGGER `update_task_comments_updated_at` BEFORE UPDATE ON `task_comments` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
  END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `task_priority`
--

DROP TABLE IF EXISTS `task_priority`;
CREATE TABLE IF NOT EXISTS `task_priority` (
  `priority` enum('low','medium','high') DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `task_status`
--

DROP TABLE IF EXISTS `task_status`;
CREATE TABLE IF NOT EXISTS `task_status` (
  `status` enum('todo','in-progress','completed') DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `task_tags`
--

DROP TABLE IF EXISTS `task_tags`;
CREATE TABLE IF NOT EXISTS `task_tags` (
  `task_id` char(36) NOT NULL,
  `tag_id` char(36) NOT NULL,
  PRIMARY KEY (`task_id`,`tag_id`),
  KEY `task_tags_task_id_idx` (`task_id`),
  KEY `task_tags_tag_id_idx` (`tag_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `dateNaissance` date NOT NULL,
  `poste` varchar(255) NOT NULL,
  `dateEmbauche` date NOT NULL,
  `profilePicture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `nom`, `prenom`, `dateNaissance`, `poste`, `dateEmbauche`, `profilePicture`) VALUES
(1, 'test', '$2b$10$CYgXszCoF6lsSpqwey.V/OejmdTYeb/5kUY/Yb81f6PZDKmv00bhe', 'Antsa', 'donto', '2000-05-11', 'boucherie', '2025-05-27', ''),
(2, 'admin@gmail.com', '$2b$10$.WD5eGL/obBAapgjIHSfJu9hioOxbYb9TbR/t9UFhguzgsshp/0cm', 'ra', 'koto', '2008-06-04', 'stagiaire', '2025-04-28', 'https://placehold.co/150x150'),
(3, 'test@test', '$2b$10$L72kZZPmI7Wy63xsV0/r.edC8iUYvFQO7roV76oSzyQmfVOQ12PO2', 'test', 'testeo', '2018-06-07', 'testbe', '2025-05-15', ''),
(4, 'mirado@test.mg', '$2b$10$dJbwbeTUHT8Y4WXbtBQjveJpOHDURdaxIKCMMPjOykPMTZQssaBR6', 'mirado', 'rakotoniaina', '2025-05-15', 'plombier', '2025-05-15', ''),
(5, 'test@re', '$2b$10$O/028BsTPHv/4KsaINGymO8KlbnshBhLsEzX67uOiELpkDf0TjVMy', 'er', 'er', '2025-05-01', 'er', '2025-05-15', ''),
(6, 'admin@test.test', '$2b$10$TluV6BSSn9UO42HxEvVvmOZrQuX8/A6goRbIQa7W.4ZCiIdTdRY2S', 'Randriamanantena', 'jacky', '2000-07-19', 'stagiaire', '2025-05-18', 'https://placehold.co/150x150'),
(7, 'admin@testa', '$2b$10$8rELV0gYxJFAZS0Iz1V7xebuie5ptpLgTkAecbxwWrMfsnpPimLZq', 'Randriamanantena', 'jacky', '2000-05-25', 'stagiaire en informatique', '2025-05-20', ''),
(8, 'admin@admin', '$2b$10$oxCMLGTCwOAk9bpSZVrQSOVMMbCcJz3A0X0Z.bfe5fHX0.KpkA4eG', 'Randriamanantena', 'jacky', '2025-05-01', 'test', '2025-05-08', ''),
(9, 'test@gmail', '$2b$10$2o7LobCDRftz.gG9rNwQpuRUZCwHhn251eGiKsWQ39R.31TmNQRuu', 'testets', 'teugbuiefe', '2025-05-22', 'testete', '2025-05-22', '');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
