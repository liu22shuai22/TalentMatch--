# 职途智配 TalentMatch

把「我会什么」和「岗位要什么」放在一起比的前端原型。按技能等级与权重算出匹配分，缺口技能可以生成学习计划。

纯 HTML / CSS / JS，浏览器打开即可跑，不依赖构建工具和后端。数据来自同仓库的 MySQL 脚本，用二维数组在浏览器里模拟 14 张表。

## Features

- **岗位匹配** — 加权匹配度（0–100），与种子评估数据一致（例：`zhangwei` → 数据分析师 = 42.5）
- **技能登记** — 浏览技能库，登记 / 修改 / 删除个人技能与证明材料
- **能力评估** — 选用户与岗位，看分项明细与缺口，可写入评估记录
- **学习计划** — 任务进度、学习资源、按最近评估自动生成补差计划
- **岗位维护** — 配置岗位技能要求，权重合计校验为 1.00
- **账号** — 登录 / 注册 / 个人中心（改口令、编辑证明材料）

## Tech stack


| Layer                  | Choice                                   |
| ---------------------- | ---------------------------------------- |
| Markup / Style / Logic | HTML5 · CSS3 · Vanilla JS                |
| Data                   | `js/data.js` 二维数组（对齐 `talent-match.sql`） |
| DB reference           | MySQL 8.0 · 14 tables                    |
| UI direction           | 新粗野主义：硬边、硬阴影、高饱和色块                       |


刻意不用 fetch、localStorage、框架。增删改只改内存，刷新后恢复种子数据。

## Quick start

```bash
# 任选其一
open index.html
# 或用静态服务器（推荐，避免个别浏览器的 file:// 限制）
npx serve .
```

从 `[pages/welcome.html](pages/welcome.html)` 进落地页，或直接打开 `[index.html](index.html)` 工作台。

### Demo accounts


| Username            | Role       | Password |
| ------------------- | ---------- | -------- |
| `zhangwei`          | 普通用户（默认演示） | `123456` |
| `lina` / `wangfang` | 普通用户       | `123456` |
| `maintainer01`      | 岗位信息维护人员   | `123456` |
| `admin`             | 系统管理员      | `123456` |


## Project layout

```
.
├── index.html              # 工作台
├── pages/                  # 功能页
│   ├── welcome.html
│   ├── login.html / register.html
│   ├── job_list.html       # 岗位库
│   ├── skill_list.html     # 技能登记
│   ├── assessment_form.html
│   ├── plan_list.html
│   ├── job_form.html       # 岗位维护
│   └── user_form.html      # 个人中心
├── css/style.css           # 全局样式
├── js/
│   ├── data.js             # 14 张表
│   ├── main.js             # 查询 / 匹配 / 导航
│   └── *.js                # 各页脚本
└── talent-match.sql        # MySQL 源库（可选导入）
```

页面脚本加载顺序固定为：`data.js` → `main.js` → 页面脚本。

## Match score

对岗位每一项技能要求：

```
score = round(100 × Σ (weight_i × min(user_level, required) / required), 1)
```

超出要求等级的部分不加分。实现见 `[js/main.js](js/main.js)` 中的 `calcMatchScore`。

## Data model

14 tables，列名英文 snake_case，与 SQL / `data.js` 表头一致：


| Table                                                      | Purpose          |
| ---------------------------------------------------------- | ---------------- |
| `users`                                                    | 账号与角色            |
| `industries` → `job_categories` → `jobs`                   | 行业 / 类别 / 岗位     |
| `skill_categories` → `skills`                              | 技能体系             |
| `user_skills`                                              | 用户已登记技能（等级 1–5）  |
| `job_skill_requirements`                                   | 岗位要求（等级、权重、是否必备） |
| `skill_prerequisites`                                      | 技能先修             |
| `assessment_records` / `assessment_details`                | 评估主从             |
| `learning_resources` / `learning_plans` / `learning_tasks` | 资源与计划            |


可选：把 `talent-match.sql` 导入本机 MySQL 8.0，用 Workbench 核对结构与查询；前端运行不需要数据库服务。

## Pages ↔ tables


| Page             | Tables                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Workbench        | 汇总 14 表                                                                                  |
| Job list         | jobs, industries, job_categories, job_skill_requirements, skills                         |
| Skill list       | skills, skill_categories, user_skills                                                    |
| Assessment       | users, jobs, skills, job_skill_requirements, assessment_*                                |
| Learning plan    | learning_*, skill_prerequisites, assessment_records, job_skill_requirements, user_skills |
| Job maintain     | jobs, job_categories, industries, job_skill_requirements, skills                         |
| Profile          | users, user_skills, skills                                                               |
| Login / Register | users                                                                                    |


## Roadmap

适合后续接上真实后端时优先做的事：

- [ ] 用 REST / Servlet 替换 `data.js`
- [ ] 服务端 Session / Token + 只存密码哈希
- [ ] 评估写入与权重合计校验下沉到事务
- [ ] 登录态跨页持久化

## License

Apache-2.0. See [LICENSE](LICENSE).