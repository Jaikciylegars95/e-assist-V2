-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mar. 01 juil. 2025 à 07:24
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
-- Structure de la table `comments`
--

DROP TABLE IF EXISTS `comments`;
CREATE TABLE IF NOT EXISTS `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(21, 7, 2, '🧚🦸‍♀️', '2025-06-01 18:59:32'),
(22, 4, 3, 'bisous🥰', '2025-06-11 19:14:44'),
(23, 2, 3, 'non', '2025-06-16 18:52:02');

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
  `team_id` int DEFAULT NULL,
  `assigned_by` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  KEY `fk_tasks_team_id` (`team_id`),
  KEY `fk_tasks_assigned_by` (`assigned_by`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `title`, `description`, `priority`, `status`, `due_date`, `created_at`, `updated_at`, `team_id`, `assigned_by`) VALUES
('718fd63b-e0a2-48b7-87bf-ad0d0667c4be', '14', 'ajdfyeu', 'efefeef', 'high', 'in-progress', '2025-05-25', '2025-05-26 06:22:08', '2025-06-19 19:12:54', 1, 2),
('54f48187-607a-43cc-a90c-839d75555527', '2', '5eme test', 'test', 'medium', 'completed', '2025-05-12', '2025-05-13 13:21:06', '2025-05-13 13:21:06', NULL, 0),
('ec77fecf-5ec4-4157-bcf0-cc0bfd41c54e', '2', 'ajdfyeu', 'efefeef', 'high', 'completed', '2025-05-26', '2025-05-26 06:22:08', '2025-05-26 07:03:34', NULL, 0),
('f5e79fb8-8e02-4e0d-9b52-814230ac82e9', '2', 'premier test', 'test', 'medium', 'completed', '2025-05-13', '2025-05-13 12:53:39', '2025-05-20 06:48:16', NULL, 0),
('59fe107a-c58a-4690-8de5-636619722e82', '2', 'test redondance', 'red', 'medium', 'completed', '2025-05-14', '2025-05-16 17:55:33', '2025-05-20 06:57:50', NULL, 0),
('9ea09e22-2cc2-4de1-a0ed-4c2a8e3cb6c2', '2', 'test', 'sas', 'medium', 'todo', NULL, '2025-05-23 08:45:51', '2025-05-23 08:45:51', NULL, 0),
('d72b3bc0-b8bd-434a-9d8b-57fad9c15a0b', '2', 'test redondance', 'red', 'high', 'completed', '2025-05-16', '2025-05-16 17:55:33', '2025-05-20 07:31:06', NULL, 0),
('9001f1fb-e0bc-4f21-9284-82a66cd4f9c2', '2', 'reedondance2', 'redO', 'medium', 'in-progress', '2025-05-28', '2025-05-16 17:57:27', '2025-05-20 07:03:07', NULL, 0),
('670a8cf3-5480-4f04-b408-517b216c51e9', '2', 'teteteeetetey', 'fffg', 'medium', 'todo', '2025-06-03', '2025-05-19 06:20:16', '2025-05-19 06:20:16', NULL, 0),
('4bc76996-6a79-4f57-af86-882a237fcb9d', '2', 'teteteeetetey', 'fffg', 'medium', 'todo', '2025-06-03', '2025-05-19 06:20:16', '2025-05-19 06:20:16', NULL, 0),
('3997e5d8-b97a-4de5-8c1f-168c5c28d004', '2', 'test redondance', 'ter', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:16', '2025-05-19 06:29:16', NULL, 0),
('a727724d-3e7f-4788-86b0-543bdfe14dec', '2', 'test redondance', 'ter', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:16', '2025-05-19 06:29:16', NULL, 0),
('08485f56-a8d8-4ccc-a6c8-727c7f509fa5', '2', 'test redondance 2e', 're', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:34', '2025-05-19 06:29:34', NULL, 0),
('e5bdb68d-80af-45fd-9787-4a96de4eafa8', '2', 'test redondance 2e', 're', 'medium', 'todo', '2025-05-30', '2025-05-19 06:29:34', '2025-05-19 06:29:34', NULL, 0),
('ab75af8b-02f0-40b8-851a-4f3b3f754d19', '2', 'tesdt', 'teteetrrgsvwbsrh', 'high', 'completed', '2025-05-18', '2025-05-19 06:33:37', '2025-05-20 08:50:08', NULL, 0),
('7aa57c01-cfd8-4a8c-8db8-38a0761294b2', '2', 'tesdt', 'teteetrrgsvwbsrh', 'high', 'in-progress', '2025-05-18', '2025-05-19 06:33:37', '2025-05-20 06:52:34', NULL, 0),
('50386f4d-a874-47eb-9dd6-c856ab1b20c9', '2', 'taskserv', 'rere', 'medium', 'todo', '2025-05-19', '2025-05-19 07:03:20', '2025-05-19 07:03:20', NULL, 0),
('93399c32-f5f6-4291-a0a2-b692b1f7a278', '2', 'reponse', 'et', 'medium', 'todo', '2025-05-18', '2025-05-19 06:41:05', '2025-05-19 06:41:56', NULL, 0),
('c2d80a40-6ce7-46e5-94a1-26fbd6495f59', '2', 'taskserv2', 'etfzeg', 'medium', 'todo', '2025-05-19', '2025-05-19 07:04:00', '2025-05-19 07:04:00', NULL, 0),
('587ce4cd-a24b-4b83-9648-f2e266b764a7', '2', 'tastkdopajrzgzrgzzrgzrg', 'zgfzgrzrgzr', 'medium', 'todo', '2025-05-24', '2025-05-19 07:08:31', '2025-05-19 07:08:31', NULL, 0),
('e3e497f9-8929-4d35-a7b5-9220d788b5f3', '2', 'teste toast', 'fe', 'medium', 'todo', '2025-05-22', '2025-05-19 07:19:07', '2025-05-19 07:19:07', NULL, 0),
('ac214829-0a76-46d5-a190-873f51c2b5a1', '2', 'test red', 'rer', 'high', 'in-progress', '2025-05-22', '2025-05-19 10:43:41', '2025-05-19 10:43:41', NULL, 0),
('5ea4a5e1-b0c0-4c17-a6c7-4af0876fd628', '2', 'ERE', 'ERE', 'medium', 'todo', '2025-05-21', '2025-05-21 20:02:56', '2025-05-21 20:02:56', NULL, 0),
('5d92b97c-ce65-47c7-bb0c-fee240fc6c53', '2', 'test tache', 'tre', 'medium', 'todo', '2025-05-23', '2025-05-23 07:31:58', '2025-05-23 07:31:58', NULL, 0),
('db2ffe4c-6312-447f-af7e-532568bcfcde', '2', 'test tache', 'test', 'medium', 'todo', '2025-05-30', '2025-05-23 07:43:40', '2025-05-23 07:43:40', NULL, 0),
('e41542c4-b8e9-4716-9908-40043f23b007', '2', 'test tache 2', 'teg', 'medium', 'todo', '2025-06-07', '2025-05-23 07:44:11', '2025-05-23 07:44:11', NULL, 0),
('7bfceb7f-da72-497b-a92c-d9529ac0e13f', '2', 'tache2', 'eifjheif', 'medium', 'todo', '2025-05-24', '2025-05-23 08:11:27', '2025-05-23 08:11:27', NULL, 0),
('16567518-aee5-4f67-a758-7fe935a6eeaa', '2', 'tache2', 'eifjheif', 'medium', 'todo', '2025-05-24', '2025-05-23 08:11:27', '2025-05-23 08:11:27', NULL, 0),
('c80f88e3-78ab-4453-b094-aa83599dfeb7', '2', 'test tache3', 'tache', 'medium', 'todo', '2025-05-23', '2025-05-23 08:18:11', '2025-05-23 08:18:11', NULL, 0),
('8bd90aa0-40ca-4eea-bffc-750e4e422b8f', '2', 'test tache3', 'tache', 'medium', 'todo', '2025-05-23', '2025-05-23 08:18:11', '2025-05-23 08:18:11', NULL, 0),
('5b4fa17c-3f9f-4495-b523-ec89f0bd3964', '2', 'testtask', 'testst', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:41', '2025-05-23 08:21:41', NULL, 0),
('61682269-583b-4ed8-88a8-9c587677617b', '2', 'testtask', 'testst', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:41', '2025-05-23 08:21:41', NULL, 0),
('7187100d-0e57-4234-b7d7-29cc6967092d', '2', 'task', 'fdafd', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:59', '2025-05-23 08:21:59', NULL, 0),
('fcca838c-434f-45e7-82db-4ec861455ace', '2', 'task', 'fdafd', 'medium', 'todo', '2025-05-23', '2025-05-23 08:21:59', '2025-05-23 08:21:59', NULL, 0),
('776a9eb8-c563-400d-933c-0b3ca04bbb41', '2', 'test456', 'eaeaé', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:20', '2025-05-23 08:29:20', NULL, 0),
('47eab7cf-e84c-4efb-88aa-b08ac8d7de1c', '2', 'test456', 'eaeaé', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:20', '2025-05-23 08:29:20', NULL, 0),
('fe9c544b-fc61-45cb-a62b-4b4445a27715', '2', 'rerere', 'er', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:43', '2025-05-23 08:29:43', NULL, 0),
('9cc6b268-eb69-46f3-8c4b-d63af931f4ea', '2', 'rerere', 'er', 'medium', 'todo', '2025-05-23', '2025-05-23 08:29:43', '2025-05-23 08:29:43', NULL, 0),
('c18726d5-812a-45dd-9c09-555637b40b15', '2', 'aeae', 'ae', 'medium', 'todo', '2025-05-23', '2025-05-23 08:37:32', '2025-05-23 08:37:32', NULL, 0),
('8513ea97-8210-47b9-89db-06b1671d6571', '2', 'aeae', 'ae', 'medium', 'todo', '2025-05-23', '2025-05-23 08:37:32', '2025-05-23 08:37:32', NULL, 0),
('9a1290f3-e6bc-4d01-a46a-bf88e7647836', '2', 'ajdjdjd', 'zdzdzdzd', 'low', 'todo', '2025-05-26', '2025-05-26 06:21:52', '2025-05-26 07:48:00', NULL, 0),
('d00fe88f-8024-4d9b-8369-823c055c6683', '2', 'ajdjdjd', 'zdzdzdzd', 'medium', 'todo', '2025-05-26', '2025-05-26 06:21:52', '2025-05-26 06:21:52', NULL, 0),
('0ad7df76-5cf6-45ac-a3e9-b691dcf7cf0a', '2', 'test35zr', 'zrzr', 'medium', 'todo', '2025-05-23', '2025-05-23 09:18:11', '2025-05-23 09:20:15', NULL, 0),
('525e8014-c9cb-40f8-9608-68d666c99358', '2', 'asio siramamy', 'mamy', 'high', 'todo', '2025-05-26', '2025-05-26 06:58:20', '2025-05-26 06:58:20', NULL, 0),
('3c67123c-cadb-47f7-a6bc-27ac8254815b', '2', 'asio siramamy', 'mamy', 'high', 'todo', '2025-05-26', '2025-05-26 06:58:20', '2025-05-26 06:58:20', NULL, 0),
('f2654f5f-7f97-4362-ada6-8a9073205d8d', '6', 'test 02', 'test ary eh', 'medium', 'in-progress', '2025-05-28', '2025-05-26 07:08:37', '2025-05-28 05:44:09', NULL, 0),
('b86cf592-7bd6-472c-aa18-783da60c81d2', '2', 'but', 'bututu', 'medium', 'todo', '2025-06-12', '2025-06-12 05:45:09', '2025-06-12 05:45:09', NULL, 0),
('f68e1902-c7c9-409b-a2d8-3c3d7d8439ab', '2', 'but', 'bututu', 'medium', 'todo', '2025-06-12', '2025-06-12 05:45:09', '2025-06-12 05:45:09', NULL, 0),
('b03d4edc-fe29-48da-92c1-ad6cd528a4fe', '4', 'ezfezf', 'ezfezfezf', 'medium', 'todo', '2025-06-27', '2025-06-17 12:21:46', '2025-06-17 12:21:46', NULL, 0),
('7ecb95b6-b5da-41d9-b383-9b3c38454984', '4', 'ezfezf', 'ezfezfezf', 'medium', 'todo', '2025-06-27', '2025-06-17 12:21:47', '2025-06-17 12:21:47', NULL, 0),
('4fa5e26c-9102-4e41-9198-51f446476e26', '4', 'dev', 'ev', 'medium', 'todo', '2025-06-17', '2025-06-17 12:22:08', '2025-06-17 12:22:08', NULL, 0),
('d0d0d262-5df0-41a6-a19e-8d7834eef78a', '4', 'dev', 'ev', 'medium', 'todo', '2025-06-17', '2025-06-17 12:22:08', '2025-06-17 12:22:08', NULL, 0),
('', '14', '', NULL, 'medium', '', NULL, '2025-06-17 12:35:38', '2025-06-17 12:35:38', 1, 0),
('29a98e6d-1347-4810-9ecc-fce58f6b51e5', '14', 'testbe', 'zfz', 'medium', 'todo', '2025-06-20', '2025-06-19 08:19:51', '2025-06-19 11:19:51', 1, 0),
('3a0fe3bf-4a2f-43f7-b093-1c943a1c477f', '14', 'tache be', 'eauidfhoa', 'medium', 'todo', '2025-06-19', '2025-06-19 08:21:16', '2025-06-19 14:46:41', 1, 1),
('caafdf9c-2931-4eaa-bfea-98740c6ab5ea', '14', 'ANDRAMANA', 'ANDRANA', 'medium', 'todo', '2025-06-19', '2025-06-19 16:50:54', '2025-06-19 16:50:54', 1, 14),
('44a45b1f-c0df-454b-a620-f034af5da5ca', '14', 'andrana', 'aodn', 'medium', 'todo', '2025-06-26', '2025-06-19 17:00:11', '2025-06-19 17:00:11', 1, 14),
('7b370c77-e786-41ba-93ed-3a867612810a', '14', 'andrana', 'aodn', 'medium', 'todo', '2025-06-26', '2025-06-19 17:00:11', '2025-06-19 17:00:11', 1, 14),
('aee8c113-047e-43b3-8055-5b9de1a07fef', '14', 'andrana farany', 'farany', 'medium', 'todo', '2025-06-20', '2025-06-19 18:07:54', '2025-06-19 18:07:54', 1, 14),
('9caf4ad7-c8b4-4bdf-be4e-de17b0a975d6', '14', 'farany be', 'farany', 'medium', 'in-progress', '2025-06-20', '2025-06-19 18:10:38', '2025-06-19 18:10:38', 1, 14),
('4d9649d9-9cce-4444-bef2-2240544516b2', '2', 'Andramo ka izahao', 'fa tsara Jehovah', 'medium', 'in-progress', '2025-06-20', '2025-06-19 18:11:33', '2025-06-19 18:11:33', 1, 2),
('70b57b7b-88c8-42b8-b733-3f6121d5e834', '2', 'eo ary oe', 'eo', 'medium', 'in-progress', '2025-06-20', '2025-06-19 18:13:06', '2025-06-19 18:13:06', 1, 2),
('50fdae61-32b0-4fde-8469-0b0fd86a6d14', '14', 'eo zozefa', 'zozefa', 'medium', 'in-progress', '2025-06-20', '2025-06-19 15:41:06', '2025-06-19 18:41:06', 1, 2),
('acc15da2-08d7-4413-8ce7-297c26262e5a', '2', 'eo zozefa', 'zozefa', 'medium', 'completed', '2025-06-18', '2025-06-19 18:41:06', '2025-06-19 18:44:42', 1, 2),
('d6d82b4b-0d64-4c6b-b687-2c2286ce8d68', '19', 'greg', 'eheh', 'medium', 'todo', '2025-06-28', '2025-06-19 15:41:36', '2025-07-01 06:35:38', 1, 2),
('3196d01e-7c8e-44df-9baf-4194431ebe16', '2', 'greg', 'eheh', 'medium', 'todo', '2025-06-27', '2025-06-19 18:41:36', '2025-06-19 18:41:36', 1, 2),
('ffa25051-e10f-4681-abe8-93be13a0a5df', '2147483648', 'farany be', 'farany', 'medium', 'in-progress', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('c9c46d25-1eae-4c29-a60b-6a635a8966ab', '2', 'aoriana', 'afara', 'medium', 'todo', '2025-07-03', '2025-06-19 18:51:15', '2025-06-19 18:51:15', 1, 2),
('002355f7-4c01-4a82-8ef8-8ec3d55a4c12', '14', 'plage', 'mahajanga', 'medium', 'todo', '2025-06-20', '2025-06-19 16:01:47', '2025-06-19 19:01:47', 1, 2),
('dd224012-8aff-4d56-8c2f-ef27d1cb2c32', '2', 'plage', 'mahajanga', 'medium', 'todo', '2025-06-19', '2025-06-19 19:01:47', '2025-06-19 19:01:47', 1, 2),
('f0e8b225-041a-4e53-bf21-ba6cba1e2bf0', '19', 'popont', 'daih', 'medium', 'todo', '2025-06-20', '2025-06-19 16:08:40', '2025-07-01 06:35:25', 1, 2),
('4ff7bd09-a68f-400a-9220-52b3c2f8de4b', '2', 'popont', 'daih', 'medium', 'todo', '2025-06-19', '2025-06-19 19:08:40', '2025-06-19 19:08:40', 1, 2),
('2fe43b7e-33bc-4bcc-b485-65a3c283e799', '2147483648', 'ANDRAMANA', 'ANDRANA', 'medium', 'todo', '2025-06-18', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('c530aee1-9970-4c3b-96c1-11028dae428a', '2', 'far away', 'azd', 'medium', 'todo', '2025-06-27', '2025-06-19 19:10:23', '2025-06-19 19:10:23', 1, 2),
('d6b16c86-b349-47dd-abad-e81e2c173db4', '14', 'dzfzr', 'zrzrzrzzt', 'medium', 'todo', '2025-06-20', '2025-06-19 16:26:45', '2025-06-19 19:26:45', 1, 2),
('653af34e-5401-4c88-b149-bf99b30a4ecf', '2', 'dzfzr', 'zrzrzrzzt', 'medium', 'todo', '2025-06-19', '2025-06-19 19:26:45', '2025-06-19 19:26:45', 1, 2),
('a6946800-4480-404b-8a1e-10429c17db69', '2147483648', 'andrana', 'aodn', 'medium', 'todo', '2025-06-25', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('ce86079c-c7a3-492f-92f9-6e928c4e2623', '14', 'testena', 'eo kely', 'medium', 'todo', '2025-06-19', '2025-06-19 16:39:03', '2025-06-19 19:40:34', 1, 2),
('8a5ab8a7-0e73-49ea-8910-8029b78aa9da', '2', 'testena', 'eo kely', 'medium', 'todo', '2025-06-26', '2025-06-19 19:39:04', '2025-06-19 19:39:04', 1, 2),
('774ad47c-4625-4065-94d5-78c9b5ef5e80', '2147483648', 'tache be', 'eauidfhoa', 'medium', 'todo', '2025-06-18', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('03de9a97-ce40-48de-ab08-81b01ff4f2d0', '2', 'buzz', 'zfdzf', 'medium', 'todo', '2025-06-19', '2025-06-19 19:46:44', '2025-06-19 19:46:44', 1, 2),
('44a58ba5-f2c3-4be7-9f1a-6080a6d05345', '2147483648', 'ajdfyeu', 'efefeef', 'high', 'in-progress', '2025-05-24', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('aacbabb6-a670-48f1-8d66-04e6853a9b94', '2', 'fako', 'gggrd', 'medium', 'todo', '2025-06-20', '2025-06-19 19:56:41', '2025-06-19 19:56:41', 1, 2),
('28203b22-615d-4424-bf69-f4ce0d235bc8', '19', 'ty nenlah', 'ty', 'low', 'todo', '2025-07-02', '2025-07-01 03:22:14', '2025-07-01 06:47:35', 1, 2),
('d8572375-f1c9-4d40-adf8-fcfb7b96726a', '2', 'ty nenlah', 'ty', 'low', 'todo', '2025-07-01', '2025-07-01 06:22:15', '2025-07-01 06:22:15', 1, 2),
('91423521-3d1f-47d9-8f60-e9ca13c56fb1', '2147483648', 'andrana', 'aodn', 'medium', 'todo', '2025-06-25', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('5cbb7ee9-2f7b-4cae-9941-1c1c3e4d48c5', '2147483648', 'andrana farany', 'farany', 'medium', 'todo', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('60e456e5-f666-4e5e-8c5c-13f465598890', '2147483648', 'Andramo ka izahao', 'fa tsara Jehovah', 'medium', 'in-progress', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('2e40bdf3-0c72-4acc-ab91-d9895f1f2aeb', '2147483648', 'eo ary oe', 'eo', 'medium', 'in-progress', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('672f1491-04e8-4b73-a059-5a9d77cb4a5e', '2147483648', 'eo zozefa', 'zozefa', 'medium', 'in-progress', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('e8294f32-c349-47ee-8a19-823f7c393baa', '2147483648', 'eo zozefa', 'zozefa', 'medium', 'completed', '2025-06-17', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('ddc5344b-6b5a-4011-a20e-223952fc27aa', '2147483648', 'greg', 'eheh', 'medium', 'todo', '2025-06-27', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('60cb15e8-0bc6-425c-aa34-0a0f7a63eb35', '2147483648', 'greg', 'eheh', 'medium', 'todo', '2025-06-26', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('cc5d53b3-105c-400c-ba86-745f817150b7', '2147483648', 'aoriana', 'afara', 'medium', 'todo', '2025-07-02', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('82489c0f-52d8-4d92-b486-b276f36d9009', '2147483648', 'plage', 'mahajanga', 'medium', 'todo', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('d6e645aa-935d-4a8a-849e-43189e8ce2d6', '2147483648', 'popont', 'daih', 'medium', 'todo', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('2678c94b-a60c-40e5-a930-1ba78a9a548d', '2147483648', 'popont', 'daih', 'medium', 'todo', '2025-06-18', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('fbce3d8f-6460-412d-9827-88021a0c87e4', '2147483648', 'far away', 'azd', 'medium', 'todo', '2025-06-26', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('c72bdc48-6a6a-4d2d-a823-47f3f6e8d18b', '2147483648', 'dzfzr', 'zrzrzrzzt', 'medium', 'todo', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('32c0621f-a4f4-4193-88f6-1b3638b81f50', '2147483648', 'dzfzr', 'zrzrzrzzt', 'medium', 'todo', '2025-06-18', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('47ea653e-c833-40d4-9d6e-4ca55ae96ed7', '2147483648', 'testena', 'eo kely', 'medium', 'todo', '2025-06-18', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('3ce434e8-9922-469e-aa8c-abe150fb511e', '2147483648', 'testena', 'eo kely', 'medium', 'todo', '2025-06-25', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('408d1925-dd96-4bf7-bcb8-842ad9ed865d', '2147483648', 'buzz', 'zfdzf', 'medium', 'todo', '2025-06-18', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('32071edd-2041-47d2-abe9-7d382751262e', '2147483648', 'fako', 'gggrd', 'medium', 'todo', '2025-06-19', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('3a9a7248-68a0-49ca-8afa-6a8f49795462', '2147483648', 'ty nenlah', 'ty', 'low', 'todo', '2025-07-01', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647),
('bc101a2b-a0f1-4665-a9c8-adb24b341369', '2147483648', 'ty nenlah', 'ty', 'low', 'todo', '2025-06-30', '2025-07-01 07:17:47', '2025-07-01 07:17:47', 1, 2147483647);

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
-- Structure de la table `teams`
--

DROP TABLE IF EXISTS `teams`;
CREATE TABLE IF NOT EXISTS `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `teams`
--

INSERT INTO `teams` (`id`, `name`) VALUES
(1, 'Équipe 1');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `dateNaissance` date NOT NULL,
  `poste` varchar(255) NOT NULL,
  `dateEmbauche` date NOT NULL,
  `profilePicture` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `role` enum('team_leader','user') NOT NULL DEFAULT 'user',
  `team_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`email`),
  KEY `fk_users_team_id` (`team_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2147483649 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `nom`, `prenom`, `dateNaissance`, `poste`, `dateEmbauche`, `profilePicture`, `role`, `team_id`) VALUES
(1, 'test@ok.ok', '$2b$10$CYgXszCoF6lsSpqwey.V/OejmdTYeb/5kUY/Yb81f6PZDKmv00bhe', 'Antsa', 'donto', '2000-05-11', 'boucherie', '2025-05-27', '', 'user', 2),
(2, 'admin@gmail.com', '$2b$10$lW.BcVsxclnQFbz/BkwceeOpAcg8EbxY4ir4e22cd.rUScv03E.fi', 'Randriamanantena', 'jacky H.', '2020-06-09', 'sefobe', '2025-06-11', NULL, 'team_leader', 2),
(5, 'test@re', '$2b$10$O/028BsTPHv/4KsaINGymO8KlbnshBhLsEzX67uOiELpkDf0TjVMy', 'er', 'er', '2025-05-01', 'er', '2025-05-15', '', 'user', NULL),
(6, 'admin@test.test', '$2b$10$TluV6BSSn9UO42HxEvVvmOZrQuX8/A6goRbIQa7W.4ZCiIdTdRY2S', 'Randriamanantena', 'jacky', '2000-07-19', 'stagiaire', '2025-05-18', 'https://placehold.co/150x150', 'user', 2),
(7, 'admin@testa', '$2b$10$8rELV0gYxJFAZS0Iz1V7xebuie5ptpLgTkAecbxwWrMfsnpPimLZq', 'Randriamanantena', 'jacky', '2000-05-25', 'stagiaire en informatique', '2025-05-20', '', 'user', NULL),
(8, 'admin@admin', '$2b$10$oxCMLGTCwOAk9bpSZVrQSOVMMbCcJz3A0X0Z.bfe5fHX0.KpkA4eG', 'Randriamanantena', 'jacky', '2025-05-01', 'test', '2025-05-08', '', 'user', NULL),
(9, 'test@gmail', '$2b$10$2o7LobCDRftz.gG9rNwQpuRUZCwHhn251eGiKsWQ39R.31TmNQRuu', 'testets', 'teugbuiefe', '2025-05-22', 'testete', '2025-05-22', '', 'user', NULL),
(14, 'mirado@test.m', '$2b$10$cL.SljYxISwZBhJEwCinDuQTIGbo9UFtYq5QLFMppSRMkMGlc2i8G', 'rakotoniaina', 'mirado', '0000-00-00', '', '0000-00-00', NULL, 'user', 1),
(19, 'fizefhznifn@fzihfzi.fzizhj', '$2b$10$ATYU4A03NSARbyX6nB7RMeDFUT0Zlg3cyyeYYhB4k96SGz69in5Km', 'Randriamanantena', 'jacky baba', '2025-06-05', 'e(hyrd', '2025-06-18', NULL, 'user', 1),
(2147483648, 'fenoy@sakay.com', '$2b$10$TCfrJYhmiY0O6BUg.Uh.r.p0ohaEbuURdo1tEvnN7BNRyzY8loVzG', 'feno', 'sakay', '2025-06-30', 'test', '2025-06-04', NULL, 'team_leader', 1);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
