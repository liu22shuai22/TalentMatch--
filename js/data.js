/* ============================================================
   data.js —— 数据层
   数据来源：TalentMatch 课题组. 职途智配岗位能力匹配数据集: talent-match.sql（MySQL 8.0, 共 14 张数据表）[Z]. 2026-09-01.
   用二维数组模拟数据库表：第 0 行是表头，第 1 行起每行是一条记录
   ============================================================ */

/* 用户表 */
const users = [
  ['user_id', 'username', 'password_hash', 'email', 'role', 'registered_at'],
  [1, 'zhangwei', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'zhangwei@example.com', '普通用户', '2026-09-01 09:00:00'],
  [2, 'lina', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'lina@example.com', '普通用户', '2026-09-02 10:30:00'],
  [3, 'wangfang', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'wangfang@example.com', '普通用户', '2026-09-03 15:20:00'],
  [4, 'maintainer01', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'maintainer01@example.com', '岗位信息维护人员', '2026-08-20 08:00:00'],
  [5, 'admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'admin@example.com', '系统管理员', '2026-08-15 08:00:00']
];

/* 行业表 */
const industries = [
  ['industry_id', 'industry_name', 'industry_desc'],
  [1, '互联网', '软件开发、数据与人工智能等技术类岗位集中的行业'],
  [2, '金融', '银行、证券、保险等金融服务行业'],
  [3, '教育培训', '学校教育与职业培训行业']
];

/* 岗位类别表 */
const jobCategories = [
  ['job_category_id', 'industry_id', 'category_name', 'category_desc'],
  [1, 1, '软件开发', '负责软件系统的设计与实现'],
  [2, 1, '数据与人工智能', '负责数据处理、分析与建模'],
  [3, 1, '产品与运营', '负责产品规划与运营'],
  [4, 2, '金融分析', '负责金融数据分析与风险评估'],
  [5, 3, '教学教研', '负责课程研发与教学']
];

/* 岗位表 */
const jobs = [
  ['job_id', 'job_category_id', 'job_name', 'job_desc', 'job_level'],
  [1, 1, '后端开发工程师', '负责服务端业务开发与数据库设计', '中级'],
  [2, 1, '前端开发工程师', '负责Web页面开发与交互实现', '初级'],
  [3, 2, '数据分析师', '负责业务数据分析与报表制作', '中级'],
  [4, 2, '机器学习工程师', '负责模型训练与算法落地', '高级'],
  [5, 3, '产品经理', '负责需求分析与产品设计', '中级'],
  [6, 4, '金融数据分析师', '负责金融数据建模与分析', '中级'],
  [7, 5, '课程研发专员', '负责培训课程设计与开发', '初级']
];

/* 技能类别表 */
const skillCategories = [
  ['skill_category_id', 'category_name', 'category_desc'],
  [1, '编程语言', '常用程序设计语言'],
  [2, '数据技能', '数据处理与分析相关技能'],
  [3, '工程工具', '软件开发常用工具'],
  [4, '通用能力', '沟通协作等通用能力']
];

/* 技能表 */
const skills = [
  ['skill_id', 'skill_category_id', 'skill_name', 'skill_desc'],
  [1, 1, 'Python', '通用编程语言，常用于数据分析'],
  [2, 1, 'Java', '面向对象的服务端开发语言'],
  [3, 2, 'SQL', '关系数据库查询语言'],
  [4, 2, '数据分析', '数据清洗、统计与可视化'],
  [5, 2, '机器学习', '模型训练与评估'],
  [6, 3, 'Git', '版本控制工具'],
  [7, 4, '沟通表达', '书面与口头表达能力'],
  [8, 2, '统计学基础', '概率统计基础知识']
];

/* 用户技能表（技能等级 1～5） */
const userSkills = [
  ['user_skill_id', 'user_id', 'skill_id', 'skill_level', 'proof_material', 'updated_at'],
  [1, 1, 1, 3, null, '2026-09-05 12:00:00'],
  [2, 1, 3, 2, null, '2026-09-05 12:00:00'],
  [3, 1, 6, 3, null, '2026-09-05 12:00:00'],
  [4, 1, 7, 3, null, '2026-09-05 12:00:00'],
  [5, 2, 3, 4, null, '2026-09-05 12:00:00'],
  [6, 2, 4, 3, null, '2026-09-05 12:00:00'],
  [7, 2, 8, 3, null, '2026-09-05 12:00:00'],
  [8, 3, 2, 4, null, '2026-09-05 12:00:00'],
  [9, 3, 3, 3, null, '2026-09-05 12:00:00'],
  [10, 3, 6, 4, null, '2026-09-05 12:00:00']
];

/* 岗位技能要求表（技能权重之和为 1.00） */
const jobSkillRequirements = [
  ['requirement_id', 'job_id', 'skill_id', 'required_level', 'skill_weight', 'is_required'],
  [1, 3, 3, 4, 0.25, 1],
  [2, 3, 4, 4, 0.30, 1],
  [3, 3, 1, 3, 0.20, 1],
  [4, 3, 8, 3, 0.15, 0],
  [5, 3, 7, 3, 0.10, 0],
  [6, 1, 2, 4, 0.35, 1],
  [7, 1, 3, 3, 0.25, 1],
  [8, 1, 6, 3, 0.15, 0],
  [9, 1, 1, 2, 0.10, 0],
  [10, 1, 7, 3, 0.15, 0],
  [11, 4, 1, 4, 0.25, 1],
  [12, 4, 5, 4, 0.30, 1],
  [13, 4, 8, 4, 0.20, 1],
  [14, 4, 3, 3, 0.15, 0],
  [15, 4, 6, 3, 0.10, 0]
];

/* 技能前置关系表 */
const skillPrerequisites = [
  ['prerequisite_id', 'target_skill_id', 'prereq_skill_id'],
  [1, 4, 3],
  [2, 4, 8],
  [3, 5, 1],
  [4, 5, 8]
];

/* 评估记录表 */
const assessmentRecords = [
  ['assessment_id', 'user_id', 'target_job_id', 'match_score', 'assessed_at'],
  [1, 1, 3, 42.50, '2026-09-10 10:00:00'],
  [2, 2, 3, 62.50, '2026-09-12 14:30:00'],
  [3, 3, 1, 75.00, '2026-09-15 09:20:00']
];

/* 评估明细表 */
const assessmentDetails = [
  ['detail_id', 'assessment_id', 'skill_id', 'user_level', 'required_level'],
  [1, 1, 3, 2, 4],
  [2, 1, 4, 0, 4],
  [3, 1, 1, 3, 3],
  [4, 1, 8, 0, 3],
  [5, 1, 7, 3, 3],
  [6, 2, 3, 4, 4],
  [7, 2, 4, 3, 4],
  [8, 2, 1, 0, 3],
  [9, 2, 8, 3, 3],
  [10, 2, 7, 0, 3],
  [11, 3, 2, 4, 4],
  [12, 3, 3, 3, 3],
  [13, 3, 6, 4, 3],
  [14, 3, 1, 0, 2],
  [15, 3, 7, 0, 3]
];

/* 学习资源表 */
const learningResources = [
  ['resource_id', 'skill_id', 'resource_name', 'resource_type', 'resource_url', 'resource_desc'],
  [1, 3, 'SQL基础入门', '视频', 'https://example.com/sql-basic', '从零学习SQL查询语句'],
  [2, 4, 'Python数据分析实战', '书籍', 'https://example.com/py-analysis', '数据分析方法与案例'],
  [3, 5, '统计学习方法', '书籍', 'https://example.com/ml-book', '机器学习经典教材'],
  [4, 4, 'Pandas数据处理教程', '文章', 'https://example.com/pandas', 'Pandas常用操作整理'],
  [5, 6, 'Git入门指南', '视频', 'https://example.com/git', '版本控制基础操作'],
  [6, 3, 'MySQL必知必会', '书籍', 'https://example.com/mysql-book', 'MySQL入门教材'],
  [7, 7, '沟通与表达训练营', '课程', 'https://example.com/speak', '职场沟通表达训练'],
  [8, 1, 'Python编程入门', '视频', 'https://example.com/py-basic', 'Python语法基础'],
  [9, 8, '概率统计基础', '课程', 'https://example.com/stat', '概率与统计入门']
];

/* 学习计划表 */
const learningPlans = [
  ['plan_id', 'user_id', 'assessment_id', 'plan_name', 'plan_status', 'created_at'],
  [1, 1, 1, '数据分析师能力提升计划', '进行中', '2026-09-10 11:00:00'],
  [2, 2, 2, '数据分析进阶计划', '未开始', '2026-09-12 15:00:00'],
  [3, 1, null, '沟通表达提升计划', '已完成', '2026-09-06 09:00:00']
];

/* 学习任务表 */
const learningTasks = [
  ['task_id', 'plan_id', 'skill_id', 'resource_id', 'task_name', 'task_order', 'task_status'],
  [1, 1, 3, 1, '学习SQL进阶查询', 1, '进行中'],
  [2, 1, 4, 4, '掌握数据分析方法', 2, '未开始'],
  [3, 1, 8, 9, '补充统计学基础', 3, '未开始'],
  [4, 2, 1, 8, '学习Python编程基础', 1, '未开始'],
  [5, 2, 4, 2, '完成数据分析实战练习', 2, '未开始'],
  [6, 3, 7, 7, '参加沟通表达训练', 1, '已完成']
];
