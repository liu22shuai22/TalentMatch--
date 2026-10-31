/* ============================================================
   main.js —— 公共脚本（通用层）
   1. 把二维数组当表来查：找列号、按值筛行、取一行
   2. 表与表之间的关联取值（相当于 SQL 里的 JOIN）
   3. 岗位匹配度计算（技能权重 × 达成率）
   4. 导航、标签、进度条的公共渲染
   5. 页面路径兼容：根目录 index.html 与 pages/ 子目录互链
   ============================================================ */

/* 功能：判断当前页面是否位于 pages/ 目录。参数：无。返回：true=在 pages/ 下，false=在项目根目录。 */
function isInPagesDir() {
  return /(?:^|[\\/])pages[\\/]/i.test(location.pathname);
}

/* 功能：生成站内页面相对链接（兼容根目录与 pages/）。参数：fileName=目标 HTML 文件名。返回：相对路径字符串。 */
function pageUrl(fileName) {
  const inPages = isInPagesDir();
  if (fileName === 'index.html') {
    return inPages ? '../index.html' : 'index.html';
  }
  return inPages ? fileName : ('pages/' + fileName);
}

/* ---------- 一、表的基本查询 ---------- */

/* 功能：在数据表第 0 行表头中查找列名的下标。参数：table=二维数组表，colName=列名。返回：列下标，找不到返回 -1。 */
function colIndex(table, colName) {
  for (let i = 0; i < table[0].length; i++) {
    if (table[0][i] === colName) {
      return i;
    }
  }
  return -1;
}

/* 功能：按列值筛选数据行。参数：table=二维表，colName=列名，value=要匹配的值。返回：所有命中行组成的数组（相当于 SQL 的 WHERE）。 */
function filterRows(table, colName, value) {
  const c = colIndex(table, colName);
  const results = [];
  for (let i = 1; i < table.length; i++) {
    if (table[i][c] === value) {
      results.push(table[i]);
    }
  }
  return results;
}

/* 功能：按列值取第一条命中行。参数：table=二维表，colName=列名，value=匹配值。返回：命中行数组，无命中返回 null。 */
function findRow(table, colName, value) {
  const c = colIndex(table, colName);
  for (let i = 1; i < table.length; i++) {
    if (table[i][c] === value) {
      return table[i];
    }
  }
  return null;
}

/* 功能：统计表的记录条数。参数：table=二维表。返回：不含表头的记录数。 */
function rowCount(table) {
  return table.length - 1;
}

/* ---------- 二、关联取值 ---------- */

/* 功能：技能ID 转技能名称。参数：skillId=技能ID。返回：技能名字符串。 */
function skillName(skillId) {
  const r = findRow(skills, 'skill_id', skillId);
  return r === null ? '未知技能' : r[2];
}

/* 功能：岗位ID 转岗位名称。参数：jobId=岗位ID。返回：岗位名字符串。 */
function jobName(jobId) {
  const r = findRow(jobs, 'job_id', jobId);
  return r === null ? '未知岗位' : r[2];
}

/* 功能：用户ID 转用户名。参数：userId=用户ID。返回：用户名字符串。 */
function getUsername(userId) {
  const r = findRow(users, 'user_id', userId);
  return r === null ? '未知用户' : r[1];
}

/* 功能：用户ID 转角色名（经用户角色表转换）。参数：userId=用户ID。返回：角色名字符串。 */
function getRoleName(userId) {
  const r = findRow(users, 'user_id', userId);
  return r === null ? '' : r[4];
}

/* 功能：岗位ID 转所属岗位类别名。参数：jobId=岗位ID。返回：类别名字符串。 */
function jobCategoryName(jobId) {
  const jobRow = findRow(jobs, 'job_id', jobId);
  const categoryRow = findRow(jobCategories, 'job_category_id', jobRow[1]);
  return categoryRow === null ? '未分类' : categoryRow[2];
}

/* 功能：岗位ID 转所属行业名。参数：jobId=岗位ID。返回：行业名字符串。 */
function jobIndustryName(jobId) {
  const jobRow = findRow(jobs, 'job_id', jobId);
  const categoryRow = findRow(jobCategories, 'job_category_id', jobRow[1]);
  const industryRow = findRow(industries, 'industry_id', categoryRow[1]);
  return industryRow === null ? '未知行业' : industryRow[1];
}

/* 功能：技能ID 转所属技能类别名。参数：skillId=技能ID。返回：类别名字符串。 */
function skillCategoryName(skillId) {
  const r = findRow(skills, 'skill_id', skillId);
  const categoryRow = findRow(skillCategories, 'skill_category_id', r[1]);
  return categoryRow === null ? '未分类' : categoryRow[1];
}

/* 功能：查用户某技能的已登记等级。参数：userId=用户ID，skillId=技能ID。返回：等级数值，未登记返回 0。 */
function userSkillLevel(userId, skillId) {
  for (let i = 1; i < userSkills.length; i++) {
    if (userSkills[i][1] === userId && userSkills[i][2] === skillId) {
      return userSkills[i][3];
    }
  }
  return 0;
}

/* ---------- 三、匹配度计算 ---------- */

/* 加权匹配度：每项技能 权重 × min(我的等级, 要求等级) / 要求等级，累加后 ×100
   与 talent-match.sql 中评估记录的种子数据一致（用户1→岗位3 = 42.5）
/* 功能：按岗位技能要求的等级与权重计算用户加权匹配得分。参数：userId=用户ID，jobId=岗位ID。返回：0~100 得分，岗位无技能要求时返回 -1。 */
function calcMatchScore(userId, jobId) {
  const requirements = filterRows(jobSkillRequirements, 'job_id', jobId);
  if (requirements.length === 0) {
    return -1;
  }
  let weightedSum = 0;
  for (let i = 0; i < requirements.length; i++) {
    const skillId = requirements[i][2];
    const requiredLevel = requirements[i][3];
    const weight = requirements[i][4];
    let myLevel = userSkillLevel(userId, skillId);
    if (myLevel > requiredLevel) {
      myLevel = requiredLevel;      /* 超出要求的部分不再加分 */
    }
    weightedSum = weightedSum + weight * (myLevel / requiredLevel);
  }
  return Math.round(weightedSum * 1000) / 10;
}

/* 功能：统计用户低于岗位要求等级的缺口技能条数。参数：userId=用户ID，jobId=岗位ID。返回：缺口数量。 */
function gapSkillCount(userId, jobId) {
  const requirements = filterRows(jobSkillRequirements, 'job_id', jobId);
  let unmetCount = 0;
  for (let i = 0; i < requirements.length; i++) {
    if (userSkillLevel(userId, requirements[i][2]) < requirements[i][3]) {
      unmetCount = unmetCount + 1;
    }
  }
  return unmetCount;
}

/* 功能：统计用户达到要求等级的技能条数。参数：userId=用户ID，jobId=岗位ID。返回：达标条数。 */
function requiredMetCount(userId, jobId) {
  const requirements = filterRows(jobSkillRequirements, 'job_id', jobId);
  let isQualified = 0;
  let totalCount = 0;
  for (let i = 0; i < requirements.length; i++) {
    if (requirements[i][5] === 1) {
      totalCount = totalCount + 1;
      if (userSkillLevel(userId, requirements[i][2]) >= requirements[i][3]) {
        isQualified = isQualified + 1;
      }
    }
  }
  return [isQualified, totalCount];
}

/* 功能：按得分降序就地排序。参数：rowList=[[岗位ID, 得分],...]。返回：排序后的同一数组。 */
function sortByScoreDesc(rowList) {
  for (let i = 0; i < rowList.length - 1; i++) {
    for (let j = 0; j < rowList.length - 1 - i; j++) {
      if (rowList[j][1] < rowList[j + 1][1]) {
        const tmpItem = rowList[j];
        rowList[j] = rowList[j + 1];
        rowList[j + 1] = tmpItem;
      }
    }
  }
  return rowList;
}

/* ---------- 四、公共渲染 ---------- */

/* 功能：渲染左侧导航并高亮当前页。参数：currentPage=当前页面文件名（不含目录）。返回：无（直接写 DOM）。 */
function renderNav(currentPage) {
  const menuItems = [
    ['index.html', '工作台', '01'],
    ['job_list.html', '岗位库', '02'],
    ['skill_list.html', '技能登记', '03'],
    ['assessment_form.html', '能力评估', '04'],
    ['plan_list.html', '学习计划', '05'],
    ['job_form.html', '岗位维护', '06'],
    ['user_form.html', '个人中心', '07']
  ];
  let html = '';
  for (let i = 0; i < menuItems.length; i++) {
    let statusVal = '';
    if (menuItems[i][0] === currentPage) {
      statusVal = ' nav-item--on';
    }
    html += '<a class="nav-item' + statusVal + '" href="' + pageUrl(menuItems[i][0]) + '">'
      + '<span class="nav-no">' + menuItems[i][2] + '</span>'
      + '<span class="nav-txt">' + menuItems[i][1] + '</span></a>';
  }
  document.getElementById('nav').innerHTML = html;
}

/* 功能：渲染左下角当前登录用户身份卡。参数：userId=用户ID。返回：无（直接写 DOM）。 */
function renderIdentityCard(userId) {
  const html = '<p class="side-label">当前登录</p>'
    + '<div class="who">'
    + '<span class="who-mark">Z</span>'
    + '<span class="who-txt"><b>' + getUsername(userId) + '</b>'
    + '<span class="muted">' + getRoleName(userId) + '</span></span>'
    + '</div>'
    + '<a class="btn btn--sm btn--block" href="' + pageUrl('login.html') + '">切换账号</a>';
  document.getElementById('sideWho').innerHTML = html;
}

/* 功能：等级数值转等级标签 HTML。参数：levelVal=等级数值。返回：标签 HTML 字符串。 */
function levelTag(levelVal) {
  let categoryRow = 'tag--mint';
  if (levelVal === '中级') {
    categoryRow = 'tag--yellow';
  }
  if (levelVal === '高级') {
    categoryRow = 'tag--blue';
  }
  return '<span class="tag ' + categoryRow + '">' + levelVal + '</span>';
}

/* 功能：状态文本转状态标签 HTML。参数：statusVal=状态文本。返回：标签 HTML 字符串。 */
function statusTag(statusVal) {
  let categoryRow = 'tag--todo';
  if (statusVal === '进行中') {
    categoryRow = 'tag--yellow';
  }
  if (statusVal === '已完成') {
    categoryRow = 'tag--mint';
  }
  return '<span class="tag ' + categoryRow + '">' + statusVal + '</span>';
}

/* 功能：生成进度条 HTML。参数：percent=0~100 数值，colorClass=填充色类名。返回：进度条 HTML 字符串。 */
function progressBar(percent, colorClass) {
  let w = percent;
  if (w < 0) {
    w = 0;
  }
  if (w > 100) {
    w = 100;
  }
  return '<div class="bar ' + colorClass + '"><span style="width:' + w + '%"></span></div>';
}

/* 功能：生成 1~5 级等级点阵。参数：levelVal=等级数值。返回：点阵 HTML 字符串。 */
function levelBars(levelVal) {
  let html = '<span class="pips">';
  for (let i = 1; i <= 5; i++) {
    if (i <= levelVal) {
      html += '<span class="pip pip--on"></span>';
    } else {
      html += '<span class="pip"></span>';
    }
  }
  html += '</span>';
  return html;
}

/* 功能：匹配得分转一句话点评。参数：scoreVal=得分。返回：点评文案字符串。 */
function matchComment(scoreVal) {
  if (scoreVal < 0) {
    return '该岗位尚未维护技能要求';
  }
  if (scoreVal >= 80) {
    return '高度匹配，可直接投递';
  }
  if (scoreVal >= 60) {
    return '基本匹配，补齐 2 项以内即可';
  }
  if (scoreVal >= 40) {
    return '存在明显差距，建议先补必备技能';
  }
  return '差距较大，需要成体系地学习';
}

/* ---------- 五、新增技能 / 评估时用到的公共工具 ---------- */

/* 功能：转义 HTML 特殊字符防注入。参数：text=原文。返回：转义后的安全字符串。 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* 功能：数值补足两位数字符串。参数：numVal=数值。返回：如 07 的两位字符串。 */
function pad2(numVal) {
  let text = String(numVal);
  if (text.length < 2) {
    text = '0' + text;
  }
  return text;
}

/* 功能：取当前时间的展示文本。参数：无。返回：YYYY-MM-DD HH:mm 格式字符串。 */
function nowText() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
    + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

/* 功能：查用户某技能等级（先确认登记行存在）。参数：userId=用户ID，skillId=技能ID。返回：等级数值，无记录返回 0。 */
function userSkillLevelOf(userId, skillId) {
  for (let i = 1; i < userSkills.length; i++) {
    if (userSkills[i][1] === userId && userSkills[i][2] === skillId) {
      return userSkills[i][3];
    }
  }
  return 0;
}

/* 功能：查用户某技能的登记行。参数：userId=用户ID，skillId=技能ID。返回：命中行数组，无则 null。 */
function userSkillRow(userId, skillId) {
  for (let i = 1; i < userSkills.length; i++) {
    if (userSkills[i][1] === userId && userSkills[i][2] === skillId) {
      return userSkills[i];
    }
  }
  return null;
}

/* 功能：数值转两位小数字符串（不依赖 toFixed）。参数：numVal=数值。返回：如 3.50 的字符串。 */
function twoDecimals(numVal) {
  const rounded = Math.round(numVal * 100) / 100;
  let text = String(rounded);
  const dotPos = text.indexOf('.');
  if (dotPos === -1) {
    return text + '.00';
  }
  while (text.length - dotPos - 1 < 2) {
    text = text + '0';
  }
  return text;
}

/* 等级文字，下标 0 空着，方便用等级直接取名字（各页面共用） */
const levelNames = ['', '入门', '基础', '熟练', '精通', '专家'];
