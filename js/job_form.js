/* ============================================================
   job_form.js —— 岗位维护页（岗位信息维护人员入口 / 岗位技能要求表单）
   1. 岗位清单：看每个岗位的技能要求配置状态
   2. 选中岗位后，增删「岗位技能要求」表的行
   3. 实时校验权重合计是否等于 1.00
   ============================================================ */

/* 当前维护账号（演示固定为 maintainer01，用户ID = 4） */
const maintainUserId = 4;

/* 页面临时状态：正在配置的岗位 */
let pickedJobId = 0;

/* ---------- 一、统计卡 ---------- */

/* 功能：渲染岗位维护页顶部统计卡（岗位数、要求条数、权重校验情况）。参数：无。返回：无（直接写 DOM）。 */
function renderStats() {
    let configuredJobs = 0;
    for (let i = 1; i < jobs.length; i++) {
        if (filterRows(jobSkillRequirements, 'job_id', jobs[i][0]).length > 0) {
            configuredJobs++;
        }
    }

    let html = '';
    html += '<div class="stat stat--yellow">'
        + '<p class="stat-label">岗位总数</p>'
        + '<p class="stat-num">' + rowCount(jobs) + '</p>'
        + '<p class="stat-sub">岗位表 · 全部在库</p></div>';
    html += '<div class="stat stat--mint">'
        + '<p class="stat-label">已配置要求</p>'
        + '<p class="stat-num">' + configuredJobs + '</p>'
        + '<p class="stat-sub">可参与匹配计算</p></div>';
    html += '<div class="stat">'
        + '<p class="stat-label">待配置</p>'
        + '<p class="stat-num">' + (rowCount(jobs) - configuredJobs) + '</p>'
        + '<p class="stat-sub">不配置则匹配度显示 -</p></div>';
    html += '<div class="stat stat--blue">'
        + '<p class="stat-label">技能要求条数</p>'
        + '<p class="stat-num">' + rowCount(jobSkillRequirements) + '</p>'
        + '<p class="stat-sub">岗位技能要求表</p></div>';

    document.getElementById('maintainStats').innerHTML = html;
    renderCatalog();
}

/* 功能：在岗位维护页展示全库规模，供核对表与记录数量。参数：无。返回：无（直接写 DOM）。 */
function renderCatalog() {
    const allTables = [users, industries, jobCategories, jobs, skillCategories, skills, userSkills,
        jobSkillRequirements, skillPrerequisites, assessmentRecords, assessmentDetails, learningResources, learningPlans, learningTasks];
    let recordCount = 0;
    for (let i = 0; i < allTables.length; i++) {
        recordCount = recordCount + rowCount(allTables[i]);
    }
    document.getElementById('meta').innerHTML = '数据表 ' + allTables.length + ' 张<br>记录 ' + recordCount + ' 条';

    const cards = [
        ['岗位总数', rowCount(jobs), '其中已写要求的才会进入匹配', 'stat--yellow'],
        ['技能条目', rowCount(skills), '分属 ' + rowCount(skillCategories) + ' 个技能类别', 'stat--blue'],
        ['学习资源', rowCount(learningResources), '视频 / 书籍 / 文章 / 课程', ''],
        ['覆盖行业', rowCount(industries), '互联网 · 金融 · 教育培训', 'stat--mint']
    ];
    let html = '';
    for (let i = 0; i < cards.length; i++) {
        html += '<div class="stat ' + cards[i][3] + '">'
            + '<p class="stat-label">' + cards[i][0] + '</p>'
            + '<p class="stat-num">' + cards[i][1] + '</p>'
            + '<p class="stat-sub">' + cards[i][2] + '</p>'
            + '</div>';
    }
    document.getElementById('catalogStats').innerHTML = html;
}

/* ---------- 二、岗位清单 ---------- */

/* 功能：渲染岗位表（含要求条数与权重合计列）。参数：无。返回：无（直接写 DOM）。 */
function renderJobTable() {
    let html = '<thead><tr>'
        + '<th>岗位</th><th>行业 / 类别</th><th>职业等级</th><th>要求数</th><th>权重合计</th><th>状态</th><th>操作</th>'
        + '</tr></thead><tbody>';

    for (let i = 1; i < jobs.length; i++) {
        const jobRow = jobs[i];
        const reqRows = filterRows(jobSkillRequirements, 'job_id', jobRow[0]);
        const weightSum = sumWeights(jobRow[0]);

        let statusHtml = '<span class="tag tag--orange">待维护</span>';
        let actionText = '去配置';
        if (reqRows.length > 0) {
            statusHtml = '<span class="tag tag--mint">已配置</span>';
            actionText = '修改';
        }

        html += '<tr>'
            + '<td><b>' + jobRow[2] + '</b></td>'
            + '<td class="muted">' + jobIndustryName(jobRow[0]) + ' · ' + jobCategoryName(jobRow[0]) + '</td>'
            + '<td>' + levelTag(jobRow[4]) + '</td>'
            + '<td>' + reqRows.length + ' 项</td>'
            + '<td><b class="num">' + twoDecimals(weightSum) + '</b></td>'
            + '<td>' + statusHtml + '</td>'
            + '<td><button class="btn btn--sm" type="button" onclick="pickJob(' + jobRow[0] + ')">' + actionText + '</button></td>'
            + '</tr>';
    }
    html += '</tbody>';

    document.getElementById('jobTable').innerHTML = html;

    let configuredJobs = 0;
    for (let i = 1; i < jobs.length; i++) {
        if (filterRows(jobSkillRequirements, 'job_id', jobs[i][0]).length > 0) {
            configuredJobs++;
        }
    }
    document.getElementById('jobNote').innerHTML = '已配置 ' + configuredJobs + ' / ' + rowCount(jobs) + ' 个岗位';
}

/* 功能：计算某岗位全部技能要求的权重之和。参数：jobId=岗位ID。返回：权重合计数值。 */
function sumWeights(jobId) {
    const reqRows = filterRows(jobSkillRequirements, 'job_id', jobId);
    let sumWeight = 0;
    for (let i = 0; i < reqRows.length; i++) {
        sumWeight += reqRows[i][4];
    }
    return Math.round(sumWeight * 100) / 100;
}

/* ---------- 三、技能要求配置 ---------- */

/* 功能：选中某岗位进入技能要求编辑。参数：jobId=岗位ID。返回：无。 */
function pickJob(jobId) {
    pickedJobId = jobId;
    renderReqArea();
}

/* 功能：渲染选中岗位的技能要求编辑区。参数：无。返回：无（直接写 DOM）。 */
function renderReqArea() {
    /* 没选岗位时给出引导 */
    if (pickedJobId === 0) {
        document.getElementById('reqNote').innerHTML = '先在上方选择一个岗位';
        document.getElementById('reqTable').innerHTML = '<tbody><tr><td>'
            + '<span class="muted">在上方岗位清单里点「去配置」，这里会列出该岗位现有的技能要求。</span>'
            + '</td></tr></tbody>';
        return;
    }

    const jobRow = findRow(jobs, 'job_id', pickedJobId);
    document.getElementById('reqNote').innerHTML = '正在配置：「' + jobRow[2] + '」';

    /* 技能下拉：排除该岗位已有的技能，避免重复 */
    let skillOptions = '<option value="">选择技能…</option>';
    for (let i = 1; i < skills.length; i++) {
        const existed = findRow2(jobSkillRequirements, 'job_id', pickedJobId, 'skill_id', skills[i][0]);
        if (existed === null) {
            skillOptions += '<option value="' + skills[i][0] + '">' + skills[i][2] + '</option>';
        }
    }
    document.getElementById('addSkill').innerHTML = skillOptions;

    /* 权重下拉：5% ~ 60%，步进 5% */
    let weightOptions = '';
    for (let w = 5; w <= 60; w += 5) {
        const weightVal = w / 100;
        weightOptions += '<option value="' + weightVal + '">' + w + '%</option>';
    }
    document.getElementById('addWeight').innerHTML = weightOptions;

    renderReqTable();
}

/* 功能：按两个条件同时查行。参数：table=二维表，colName1/value1=第一组列名与值，colName2/value2=第二组列名与值。返回：命中行数组，无则 null。 */
function findRow2(table, colName1, value1, colName2, value2) {
    const c1 = colIndex(table, colName1);
    const c2 = colIndex(table, colName2);
    for (let i = 1; i < table.length; i++) {
        if (table[i][c1] === value1 && table[i][c2] === value2) {
            return table[i];
        }
    }
    return null;
}

/* 功能：渲染选中岗位的技能要求明细表。参数：无。返回：无（直接写 DOM）。 */
function renderReqTable() {
    const jobRow = findRow(jobs, 'job_id', pickedJobId);
    const reqRows = filterRows(jobSkillRequirements, 'job_id', pickedJobId);
    const weightSum = sumWeights(pickedJobId);

    /* 权重合计校验提示 */
    const hintBox = document.getElementById('addHint');
    if (reqRows.length === 0) {
        hintBox.innerHTML = '「' + jobRow[2] + '」还没有任何技能要求，从下面添加第一条。';
    } else if (weightSum === 1) {
        hintBox.innerHTML = '当前权重合计 <b>1.00</b>，符合约定，该岗位可正常参与匹配计算。';
    } else {
        hintBox.innerHTML = '<b>注意：</b>当前权重合计 ' + twoDecimals(weightSum)
            + '，与约定的 1.00 相差 ' + (Math.round((1 - weightSum) * 100) / 100)
            + '，请继续调整（添加或删除要求）。';
    }

    let html = '<thead><tr><th>技能</th><th>要求等级</th><th>技能权重</th><th>必备标记</th><th>操作</th></tr></thead><tbody>';

    for (let i = 0; i < reqRows.length; i++) {
        const reqRow = reqRows[i];
        let mustHtml = '<span class="muted">—</span>';
        if (reqRow[5] === 1) {
            mustHtml = '<span class="tag tag--blue">必备</span>';
        }
        html += '<tr>'
            + '<td><b>' + skillName(reqRow[2]) + '</b></td>'
            + '<td>' + reqRow[3] + ' 级 · ' + levelNames[reqRow[3]] + '</td>'
            + '<td><b class="num">' + twoDecimals(reqRow[4]) + '</b></td>'
            + '<td>' + mustHtml + '</td>'
            + '<td><button class="btn btn--sm" type="button" onclick="removeRequirement(' + reqRow[0] + ')">删除</button></td>'
            + '</tr>';
    }

    if (reqRows.length === 0) {
        html += '<tr><td colspan="5"><span class="muted">暂无技能要求。</span></td></tr>';
    }
    html += '</tbody>';

    document.getElementById('reqTable').innerHTML = html;
}

/* 功能：新增一条岗位技能要求（校验权重合计不超过 1.00）。参数：无。返回：false（阻止表单默认提交）。 */
function addRequirement() {
    const hintBox = document.getElementById('addHint');

    if (pickedJobId === 0) {
        hintBox.innerHTML = '请先在上方岗位清单里选择一个岗位。';
        return false;
    }

    const skillId = Number(document.getElementById('addSkill').value);
    const levelVal = Number(document.getElementById('addLevel').value);
    const weightVal = Number(document.getElementById('addWeight').value);
    const mustVal = document.getElementById('addMust').checked === true ? 1 : 0;

    if (skillId === 0) {
        hintBox.innerHTML = '请选择要添加的技能。';
        return false;
    }
    if (findRow2(jobSkillRequirements, 'job_id', pickedJobId, 'skill_id', skillId) !== null) {
        hintBox.innerHTML = '「' + skillName(skillId) + '」已经在该岗位的要求里了，同一技能只保留一条。';
        return false;
    }
    if (weightVal < 0.05 || weightVal > 0.6) {
        hintBox.innerHTML = '权重必须在 5%～60% 之间。';
        return false;
    }
    if (sumWeights(pickedJobId) + weightVal > 1.2) {
        hintBox.innerHTML = '权重合计将超过 1.20，明显偏离约定值，请先删除一些要求。';
        return false;
    }

    jobSkillRequirements.push([jobSkillRequirements.length, pickedJobId, skillId, levelVal, weightVal, mustVal]);

    document.getElementById('addMust').checked = false;
    renderAll();
    hintBox.innerHTML = '已添加 <b>' + skillName(skillId) + '</b>（' + levelVal + ' 级 · '
        + twoDecimals(weightVal) + '）';
    return true;
}

/* 功能：删除指定的岗位技能要求并重渲染。参数：reqId=要求ID。返回：无。 */
function removeRequirement(reqId) {
    for (let i = 1; i < jobSkillRequirements.length; i++) {
        if (jobSkillRequirements[i][0] === reqId) {
            jobSkillRequirements.splice(i, 1);
            break;
        }
    }
    renderAll();
}

/* ---------- 四、统一刷新 ---------- */

/* 功能：依次刷新本页统计卡、岗位表、要求编辑区。参数：无。返回：无。 */
function renderAll() {
    renderStats();
    renderJobTable();
    renderReqArea();
}

window.onload = function () {
    renderNav('job_form.html');
    renderIdentityCard(maintainUserId);
    renderAll();
};
