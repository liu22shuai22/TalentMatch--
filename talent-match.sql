-- Talent Match 职途智配 数据库脚本 (MySQL 8.0)
DROP DATABASE IF EXISTS talent_match;
CREATE DATABASE talent_match DEFAULT CHARACTER SET utf8mb4;
USE talent_match;

CREATE TABLE `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` CHAR(64) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `role` VARCHAR(20) NOT NULL DEFAULT '普通用户',
  `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `ck_users_role` CHECK (`role` IN ('普通用户','岗位信息维护人员','系统管理员'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE `industries` (
  `industry_id` INT NOT NULL AUTO_INCREMENT,
  `industry_name` VARCHAR(50) NOT NULL UNIQUE,
  `industry_desc` VARCHAR(500),
  PRIMARY KEY (`industry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行业表';

CREATE TABLE `job_categories` (
  `job_category_id` INT NOT NULL AUTO_INCREMENT,
  `industry_id` INT NOT NULL,
  `category_name` VARCHAR(50) NOT NULL,
  `category_desc` VARCHAR(500),
  PRIMARY KEY (`job_category_id`),
  CONSTRAINT `fk_job_categories_industry_id` FOREIGN KEY (`industry_id`) REFERENCES `industries` (`industry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位类别表';

CREATE TABLE `jobs` (
  `job_id` INT NOT NULL AUTO_INCREMENT,
  `job_category_id` INT NOT NULL,
  `job_name` VARCHAR(50) NOT NULL,
  `job_desc` VARCHAR(500),
  `job_level` VARCHAR(10) NOT NULL DEFAULT '初级',
  PRIMARY KEY (`job_id`),
  KEY `idx_jobs_job_name` (`job_name`),
  CONSTRAINT `fk_jobs_job_category_id` FOREIGN KEY (`job_category_id`) REFERENCES `job_categories` (`job_category_id`),
  CONSTRAINT `ck_jobs_job_level` CHECK (`job_level` IN ('初级','中级','高级'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位表';

CREATE TABLE `skill_categories` (
  `skill_category_id` INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(50) NOT NULL UNIQUE,
  `category_desc` VARCHAR(500),
  PRIMARY KEY (`skill_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能类别表';

CREATE TABLE `skills` (
  `skill_id` INT NOT NULL AUTO_INCREMENT,
  `skill_category_id` INT NOT NULL,
  `skill_name` VARCHAR(50) NOT NULL UNIQUE,
  `skill_desc` VARCHAR(500),
  PRIMARY KEY (`skill_id`),
  CONSTRAINT `fk_skills_skill_category_id` FOREIGN KEY (`skill_category_id`) REFERENCES `skill_categories` (`skill_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能表';

CREATE TABLE `user_skills` (
  `user_skill_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `skill_id` INT NOT NULL,
  `skill_level` TINYINT NOT NULL DEFAULT 1,
  `proof_material` VARCHAR(255),
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_skill_id`),
  UNIQUE KEY `uk_user_skills_user_id_skill_id` (`user_id`, `skill_id`),
  CONSTRAINT `fk_user_skills_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_user_skills_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `ck_user_skills_skill_level` CHECK (`skill_level` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户技能表';

CREATE TABLE `job_skill_requirements` (
  `requirement_id` INT NOT NULL AUTO_INCREMENT,
  `job_id` INT NOT NULL,
  `skill_id` INT NOT NULL,
  `required_level` TINYINT NOT NULL,
  `skill_weight` DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  `is_required` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`requirement_id`),
  UNIQUE KEY `uk_job_skill_requirements_job_id_skill_id` (`job_id`, `skill_id`),
  CONSTRAINT `fk_job_skill_requirements_job_id` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`),
  CONSTRAINT `fk_job_skill_requirements_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `ck_job_skill_requirements_required_level` CHECK (`required_level` BETWEEN 1 AND 5),
  CONSTRAINT `ck_job_skill_requirements_skill_weight` CHECK (`skill_weight` > 0 AND `skill_weight` <= 1),
  CONSTRAINT `ck_job_skill_requirements_is_required` CHECK (`is_required` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位技能要求表';

CREATE TABLE `skill_prerequisites` (
  `prerequisite_id` INT NOT NULL AUTO_INCREMENT,
  `target_skill_id` INT NOT NULL,
  `prereq_skill_id` INT NOT NULL,
  PRIMARY KEY (`prerequisite_id`),
  UNIQUE KEY `uk_skill_prerequisites_target_skill_id_prereq_skill_id` (`target_skill_id`, `prereq_skill_id`),
  CONSTRAINT `fk_skill_prerequisites_target_skill_id` FOREIGN KEY (`target_skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `fk_skill_prerequisites_prereq_skill_id` FOREIGN KEY (`prereq_skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `ck_skill_prerequisites_different_skills` CHECK (`target_skill_id` <> `prereq_skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='技能前置关系表';

CREATE TABLE `assessment_records` (
  `assessment_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `target_job_id` INT NOT NULL,
  `match_score` DECIMAL(5,2) NOT NULL,
  `assessed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assessment_id`),
  CONSTRAINT `fk_assessment_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_assessment_records_target_job_id` FOREIGN KEY (`target_job_id`) REFERENCES `jobs` (`job_id`),
  CONSTRAINT `ck_assessment_records_match_score` CHECK (`match_score` BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估记录表';

CREATE TABLE `assessment_details` (
  `detail_id` INT NOT NULL AUTO_INCREMENT,
  `assessment_id` INT NOT NULL,
  `skill_id` INT NOT NULL,
  `user_level` TINYINT NOT NULL DEFAULT 0,
  `required_level` TINYINT NOT NULL,
  PRIMARY KEY (`detail_id`),
  UNIQUE KEY `uk_assessment_details_assessment_id_skill_id` (`assessment_id`, `skill_id`),
  CONSTRAINT `fk_assessment_details_assessment_id` FOREIGN KEY (`assessment_id`) REFERENCES `assessment_records` (`assessment_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assessment_details_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `ck_assessment_details_user_level` CHECK (`user_level` BETWEEN 0 AND 5),
  CONSTRAINT `ck_assessment_details_required_level` CHECK (`required_level` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估明细表';

CREATE TABLE `learning_resources` (
  `resource_id` INT NOT NULL AUTO_INCREMENT,
  `skill_id` INT NOT NULL,
  `resource_name` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(20) NOT NULL,
  `resource_url` VARCHAR(255),
  `resource_desc` VARCHAR(500),
  PRIMARY KEY (`resource_id`),
  KEY `idx_learning_resources_resource_type` (`resource_type`),
  CONSTRAINT `fk_learning_resources_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习资源表';

CREATE TABLE `learning_plans` (
  `plan_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `assessment_id` INT,
  `plan_name` VARCHAR(100) NOT NULL,
  `plan_status` VARCHAR(20) NOT NULL DEFAULT '未开始',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan_id`),
  CONSTRAINT `fk_learning_plans_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_learning_plans_assessment_id` FOREIGN KEY (`assessment_id`) REFERENCES `assessment_records` (`assessment_id`) ON DELETE SET NULL,
  CONSTRAINT `ck_learning_plans_plan_status` CHECK (`plan_status` IN ('未开始','进行中','已完成'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习计划表';

CREATE TABLE `learning_tasks` (
  `task_id` INT NOT NULL AUTO_INCREMENT,
  `plan_id` INT NOT NULL,
  `skill_id` INT NOT NULL,
  `resource_id` INT,
  `task_name` VARCHAR(100) NOT NULL,
  `task_order` INT NOT NULL DEFAULT 1,
  `task_status` VARCHAR(20) NOT NULL DEFAULT '未开始',
  PRIMARY KEY (`task_id`),
  CONSTRAINT `fk_learning_tasks_plan_id` FOREIGN KEY (`plan_id`) REFERENCES `learning_plans` (`plan_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_learning_tasks_skill_id` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `fk_learning_tasks_resource_id` FOREIGN KEY (`resource_id`) REFERENCES `learning_resources` (`resource_id`) ON DELETE SET NULL,
  CONSTRAINT `ck_learning_tasks_task_order` CHECK (`task_order` >= 1),
  CONSTRAINT `ck_learning_tasks_task_status` CHECK (`task_status` IN ('未开始','进行中','已完成'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习任务表';

-- ===== 测试数据 =====
INSERT INTO `industries` (`industry_id`, `industry_name`, `industry_desc`) VALUES
  (1, '互联网', '软件开发、数据与人工智能等技术类岗位集中的行业'),
  (2, '金融', '银行、证券、保险等金融服务行业'),
  (3, '教育培训', '学校教育与职业培训行业');

INSERT INTO `job_categories` (`job_category_id`, `industry_id`, `category_name`, `category_desc`) VALUES
  (1, 1, '软件开发', '负责软件系统的设计与实现'),
  (2, 1, '数据与人工智能', '负责数据处理、分析与建模'),
  (3, 1, '产品与运营', '负责产品规划与运营'),
  (4, 2, '金融分析', '负责金融数据分析与风险评估'),
  (5, 3, '教学教研', '负责课程研发与教学');

INSERT INTO `jobs` (`job_id`, `job_category_id`, `job_name`, `job_desc`, `job_level`) VALUES
  (1, 1, '后端开发工程师', '负责服务端业务开发与数据库设计', '中级'),
  (2, 1, '前端开发工程师', '负责Web页面开发与交互实现', '初级'),
  (3, 2, '数据分析师', '负责业务数据分析与报表制作', '中级'),
  (4, 2, '机器学习工程师', '负责模型训练与算法落地', '高级'),
  (5, 3, '产品经理', '负责需求分析与产品设计', '中级'),
  (6, 4, '金融数据分析师', '负责金融数据建模与分析', '中级'),
  (7, 5, '课程研发专员', '负责培训课程设计与开发', '初级');

INSERT INTO `skill_categories` (`skill_category_id`, `category_name`, `category_desc`) VALUES
  (1, '编程语言', '常用程序设计语言'),
  (2, '数据技能', '数据处理与分析相关技能'),
  (3, '工程工具', '软件开发常用工具'),
  (4, '通用能力', '沟通协作等通用能力');

INSERT INTO `skills` (`skill_id`, `skill_category_id`, `skill_name`, `skill_desc`) VALUES
  (1, 1, 'Python', '通用编程语言，常用于数据分析'),
  (2, 1, 'Java', '面向对象的服务端开发语言'),
  (3, 2, 'SQL', '关系数据库查询语言'),
  (4, 2, '数据分析', '数据清洗、统计与可视化'),
  (5, 2, '机器学习', '模型训练与评估'),
  (6, 3, 'Git', '版本控制工具'),
  (7, 4, '沟通表达', '书面与口头表达能力'),
  (8, 2, '统计学基础', '概率统计基础知识');

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `email`, `role`, `registered_at`) VALUES
  (1, 'zhangwei', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'zhangwei@example.com', '普通用户', '2026-09-01 09:00:00'),
  (2, 'lina', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'lina@example.com', '普通用户', '2026-09-02 10:30:00'),
  (3, 'wangfang', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'wangfang@example.com', '普通用户', '2026-09-03 15:20:00'),
  (4, 'maintainer01', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'maintainer01@example.com', '岗位信息维护人员', '2026-08-20 08:00:00'),
  (5, 'admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'admin@example.com', '系统管理员', '2026-08-15 08:00:00');

INSERT INTO `user_skills` (`user_skill_id`, `user_id`, `skill_id`, `skill_level`, `proof_material`, `updated_at`) VALUES
  (1, 1, 1, 3, NULL, '2026-09-05 12:00:00'),
  (2, 1, 3, 2, NULL, '2026-09-05 12:00:00'),
  (3, 1, 6, 3, NULL, '2026-09-05 12:00:00'),
  (4, 1, 7, 3, NULL, '2026-09-05 12:00:00'),
  (5, 2, 3, 4, NULL, '2026-09-05 12:00:00'),
  (6, 2, 4, 3, NULL, '2026-09-05 12:00:00'),
  (7, 2, 8, 3, NULL, '2026-09-05 12:00:00'),
  (8, 3, 2, 4, NULL, '2026-09-05 12:00:00'),
  (9, 3, 3, 3, NULL, '2026-09-05 12:00:00'),
  (10, 3, 6, 4, NULL, '2026-09-05 12:00:00');

INSERT INTO `job_skill_requirements` (`requirement_id`, `job_id`, `skill_id`, `required_level`, `skill_weight`, `is_required`) VALUES
  (1, 3, 3, 4, 0.25, 1),
  (2, 3, 4, 4, 0.3, 1),
  (3, 3, 1, 3, 0.2, 1),
  (4, 3, 8, 3, 0.15, 0),
  (5, 3, 7, 3, 0.1, 0),
  (6, 1, 2, 4, 0.35, 1),
  (7, 1, 3, 3, 0.25, 1),
  (8, 1, 6, 3, 0.15, 0),
  (9, 1, 1, 2, 0.1, 0),
  (10, 1, 7, 3, 0.15, 0),
  (11, 4, 1, 4, 0.25, 1),
  (12, 4, 5, 4, 0.3, 1),
  (13, 4, 8, 4, 0.2, 1),
  (14, 4, 3, 3, 0.15, 0),
  (15, 4, 6, 3, 0.1, 0);

INSERT INTO `skill_prerequisites` (`prerequisite_id`, `target_skill_id`, `prereq_skill_id`) VALUES
  (1, 4, 3),
  (2, 4, 8),
  (3, 5, 1),
  (4, 5, 8);

INSERT INTO `assessment_records` (`assessment_id`, `user_id`, `target_job_id`, `match_score`, `assessed_at`) VALUES
  (1, 1, 3, 42.5, '2026-09-10 10:00:00'),
  (2, 2, 3, 62.5, '2026-09-12 14:30:00'),
  (3, 3, 1, 75.0, '2026-09-15 09:20:00');

INSERT INTO `assessment_details` (`detail_id`, `assessment_id`, `skill_id`, `user_level`, `required_level`) VALUES
  (1, 1, 3, 2, 4),
  (2, 1, 4, 0, 4),
  (3, 1, 1, 3, 3),
  (4, 1, 8, 0, 3),
  (5, 1, 7, 3, 3),
  (6, 2, 3, 4, 4),
  (7, 2, 4, 3, 4),
  (8, 2, 1, 0, 3),
  (9, 2, 8, 3, 3),
  (10, 2, 7, 0, 3),
  (11, 3, 2, 4, 4),
  (12, 3, 3, 3, 3),
  (13, 3, 6, 4, 3),
  (14, 3, 1, 0, 2),
  (15, 3, 7, 0, 3);

INSERT INTO `learning_resources` (`resource_id`, `skill_id`, `resource_name`, `resource_type`, `resource_url`, `resource_desc`) VALUES
  (1, 3, 'SQL基础入门', '视频', 'https://example.com/sql-basic', '从零学习SQL查询语句'),
  (2, 4, 'Python数据分析实战', '书籍', 'https://example.com/py-analysis', '数据分析方法与案例'),
  (3, 5, '统计学习方法', '书籍', 'https://example.com/ml-book', '机器学习经典教材'),
  (4, 4, 'Pandas数据处理教程', '文章', 'https://example.com/pandas', 'Pandas常用操作整理'),
  (5, 6, 'Git入门指南', '视频', 'https://example.com/git', '版本控制基础操作'),
  (6, 3, 'MySQL必知必会', '书籍', 'https://example.com/mysql-book', 'MySQL入门教材'),
  (7, 7, '沟通与表达训练营', '课程', 'https://example.com/speak', '职场沟通表达训练'),
  (8, 1, 'Python编程入门', '视频', 'https://example.com/py-basic', 'Python语法基础'),
  (9, 8, '概率统计基础', '课程', 'https://example.com/stat', '概率与统计入门');

INSERT INTO `learning_plans` (`plan_id`, `user_id`, `assessment_id`, `plan_name`, `plan_status`, `created_at`) VALUES
  (1, 1, 1, '数据分析师能力提升计划', '进行中', '2026-09-10 11:00:00'),
  (2, 2, 2, '数据分析进阶计划', '未开始', '2026-09-12 15:00:00'),
  (3, 1, NULL, '沟通表达提升计划', '已完成', '2026-09-06 09:00:00');

INSERT INTO `learning_tasks` (`task_id`, `plan_id`, `skill_id`, `resource_id`, `task_name`, `task_order`, `task_status`) VALUES
  (1, 1, 3, 1, '学习SQL进阶查询', 1, '进行中'),
  (2, 1, 4, 4, '掌握数据分析方法', 2, '未开始'),
  (3, 1, 8, 9, '补充统计学基础', 3, '未开始'),
  (4, 2, 1, 8, '学习Python编程基础', 1, '未开始'),
  (5, 2, 4, 2, '完成数据分析实战练习', 2, '未开始'),
  (6, 3, 7, 7, '参加沟通表达训练', 1, '已完成');

-- ===== 核心查询 =====
-- 查询1（单表查询）：查询职业等级为“中级”的岗位名称及描述，并按岗位名称排序
SELECT job_id, job_name, job_desc, job_level
FROM jobs
WHERE job_level = '中级'
ORDER BY job_name;

-- 查询2（单表查询）：统计各资源类型的学习资源数量
SELECT resource_type, COUNT(*) AS resource_count
FROM learning_resources
GROUP BY resource_type
ORDER BY resource_count DESC;

-- 查询3（单表查询）：查询指定用户（用户ID为1）正在进行的学习计划
SELECT plan_id, plan_name, plan_status, created_at
FROM learning_plans
WHERE user_id = 1 AND plan_status = '进行中'
ORDER BY created_at DESC;

-- 查询4（多表查询）：查询“数据分析师”岗位所需的技能、要求等级及权重
SELECT j.job_name, s.skill_name, r.required_level, r.skill_weight, r.is_required
FROM jobs j
INNER JOIN job_skill_requirements r ON j.job_id = r.job_id
INNER JOIN skills s ON r.skill_id = s.skill_id
WHERE j.job_name = '数据分析师'
ORDER BY r.skill_weight DESC;

-- 查询5（多表查询）：查询某次评估中需要提升的技能及技能差距
SELECT u.username, j.job_name, s.skill_name, d.user_level, d.required_level,
d.required_level - d.user_level AS skill_gap
FROM assessment_records e
INNER JOIN users u ON e.user_id = u.user_id
INNER JOIN jobs j ON e.target_job_id = j.job_id
INNER JOIN assessment_details d ON e.assessment_id = d.assessment_id
INNER JOIN skills s ON d.skill_id = s.skill_id
WHERE e.assessment_id = 1 AND d.required_level > d.user_level
ORDER BY skill_gap DESC;

-- 查询6（多表查询）：统计每个行业的岗位数量
SELECT i.industry_name, COUNT(j.job_id) AS job_count
FROM industries i
LEFT JOIN job_categories c ON i.industry_id = c.industry_id
LEFT JOIN jobs j ON c.job_category_id = j.job_category_id
GROUP BY i.industry_id, i.industry_name
ORDER BY job_count DESC;