/* ============================================================
   skill_list.js —— 技能登记页（用户技能列表）
   1. 展示全部技能清单（可按关键词、类别筛选）
   2. 右侧实时展示当前用户的技能档案
   3. 登记 / 修改 / 删除：直接改写内存里的用户技能表
   ============================================================ */

/* 当前登录用户（演示固定为 zhangwei，用户ID = 1） */
const currentUserId = 1;

/* 页面临时状态：当前选中的技能、当前选中的等级 */
let pickedSkillId = 0;
let pickedLevel = 3;

/* ---------- 一、统计卡 ---------- */

/* 功能：渲染技能统计卡（登记数、平均等级、类别覆盖等）。参数：无。返回：无（直接写 DOM）。 */
function renderStats() {
    const myRows = filterRows(userSkills, 'user_id', currentUserId);

    /* 平均等级：所有技能等级相加再除以条数 */
    let sumLevel = 0;
    for (let i = 0; i < myRows.length; i++) {
        sumLevel += myRows[i][3];
    }
    let avgLevel = 0;
    if (myRows.length > 0) {
        avgLevel = sumLevel / myRows.length;
    }

    /* 覆盖的技能类别数：把技能ID换成类别ID，再统计不重复的个数 */
    const categoryIds = [];
    for (let i = 0; i < myRows.length; i++) {
        const skillRow = findRow(skills, 'skill_id', myRows[i][2]);
        if (skillRow !== null) {
            let existed = false;
            for (let k = 0; k < categoryIds.length; k++) {
                if (categoryIds[k] === skillRow[1]) {
                    existed = true;
                }
            }
            if (!existed) {
                categoryIds.push(skillRow[1]);
            }
        }
    }

    /* 最近更新时间：取所有技能记录里最新的那个 */
    let latestTime = '—';
    for (let i = 0; i < myRows.length; i++) {
        if (myRows[i][5] !== null && (latestTime === '—' || myRows[i][5] > latestTime)) {
            latestTime = myRows[i][5];
        }
    }

    let html = '';
    html += '<div class="stat stat--yellow">'
        + '<p class="stat-label">已登记技能</p>'
        + '<p class="stat-num">' + myRows.length + '</p>'
        + '<p class="stat-sub">共 ' + rowCount(skills) + ' 项技能可选</p></div>';
    html += '<div class="stat">'
        + '<p class="stat-label">平均等级</p>'
        + '<p class="stat-num">' + (Math.round(avgLevel * 10) / 10 || 0) + '</p>'
        + '<p class="stat-sub">满分 5 级</p></div>';
    html += '<div class="stat stat--blue">'
        + '<p class="stat-label">覆盖技能类别</p>'
        + '<p class="stat-num">' + categoryIds.length + '</p>'
        + '<p class="stat-sub">共 ' + rowCount(skillCategories) + ' 个类别</p></div>';
    html += '<div class="stat stat--mint">'
        + '<p class="stat-label">最近更新</p>'
        + '<p class="stat-num fs-14">' + latestTime + '</p>'
        + '<p class="stat-sub">用户技能表 · 更新时间</p></div>';

    document.getElementById('skillStats').innerHTML = html;
}

/* ---------- 二、技能清单表格 ---------- */

/* 功能：渲染技能类别筛选下拉框。参数：无。返回：无（直接写 DOM）。 */
function renderCategoryOptions() {
    let html = '<option value="">全部类别</option>';
    for (let i = 1; i < skillCategories.length; i++) {
        html += '<option value="' + skillCategories[i][0] + '">' + skillCategories[i][1] + '</option>';
    }
    document.getElementById('selCat').innerHTML = html;
}

/* 功能：计算当前筛选条件下可见的技能行。参数：无。返回：命中行数组。 */
function visibleSkillRows() {
    const keyword = document.getElementById('kw').value.trim();
    const categoryId = document.getElementById('selCat').value;
    const rows = [];

    for (let i = 1; i < skills.length; i++) {
        const skillRow = skills[i];

        /* 类别筛选：下拉选了具体类别才比较 */
        if (categoryId !== '' && String(skillRow[1]) !== categoryId) {
            continue;
        }
        /* 关键词筛选：技能名或描述里包含就算命中 */
        if (keyword !== ''
            && skillRow[2].indexOf(keyword) === -1
            && skillRow[3].indexOf(keyword) === -1) {
            continue;
        }
        rows.push(skillRow);
    }
    return rows;
}

/* 功能：渲染技能库表格。参数：无。返回：无（直接写 DOM）。 */
function renderSkillTable() {
    const rows = visibleSkillRows();

    let html = '<thead><tr>'
        + '<th>技能</th><th>类别</th><th>描述</th><th>我的等级</th><th>操作</th>'
        + '</tr></thead><tbody>';

    for (let i = 0; i < rows.length; i++) {
        const skillRow = rows[i];
        const levelVal = userSkillLevelOf(currentUserId, skillRow[0]);
        let levelHtml = '<span class="muted">未登记</span>';
        let actionText = '登记';
        if (levelVal > 0) {
            levelHtml = levelBars(levelVal) + ' <b class="num">' + levelVal + '</b>';
            actionText = '修改';
        }
        html += '<tr>'
            + '<td><b>' + skillRow[2] + '</b></td>'
            + '<td><span class="tag">' + skillCategoryName(skillRow[0]) + '</span></td>'
            + '<td class="muted">' + skillRow[3] + '</td>'
            + '<td>' + levelHtml + '</td>'
            + '<td><button class="btn btn--sm" type="button" onclick="pickSkill(' + skillRow[0] + ')">' + actionText + '</button></td>'
            + '</tr>';
    }

    if (rows.length === 0) {
        html += '<tr><td colspan="5"><span class="muted">没有符合条件的技能，换个关键词试试。</span></td></tr>';
    }
    html += '</tbody>';

    document.getElementById('skillTable').innerHTML = html;
    document.getElementById('listNote').innerHTML = '显示 ' + rows.length + ' / ' + rowCount(skills) + ' 项';
}

/* 功能：应用类别与关键词筛选并重渲染。参数：无。返回：无。 */
function filterSkills() {
    renderSkillTable();
}

/* 功能：重置全部筛选条件并重渲染。参数：无。返回：无。 */
function resetSkillFilter() {
    document.getElementById('kw').value = '';
    document.getElementById('selCat').value = '';
    renderSkillTable();
}

/* ---------- 三、我的技能档案 ---------- */

/* 功能：渲染当前用户的已登记技能列表。参数：无。返回：无（直接写 DOM）。 */
function renderMyProfile() {
    const myRows = filterRows(userSkills, 'user_id', currentUserId);

    let html = '<div class="card">'
        + '<div class="card-head"><h3 class="card-title">' + getUsername(currentUserId) + ' 的技能</h3>'
        + '<span class="tag tag--yellow">' + getRoleName(currentUserId) + '</span></div>';

    if (myRows.length === 0) {
        html += '<p class="empty">还没有登记任何技能，从下面挑一项开始。</p>';
    }

    for (let i = 0; i < myRows.length; i++) {
        const row = myRows[i];
        let proofText = '未填写证明材料';
        if (row[4] !== null && row[4] !== '') {
            proofText = escapeHtml(row[4]);
        }
        html += '<div class="line-row">'
            + '<span class="line-main">' + skillName(row[2])
            + '<span class="line-sub"> ' + levelNames[row[3]] + '</span></span>'
            + levelBars(row[3])
            + '</div>'
            + '<p class="muted fs-14 mb-14">' + proofText + ' · 更新于 ' + row[5]
            + ' <a class="underline" href="javascript:void(0)" onclick="removeSkill(' + row[0] + ')">删除</a></p>';
    }

    html += '</div>';
    document.getElementById('myProfile').innerHTML = html;
}

/* ---------- 四、登记表单 ---------- */

/* 功能：渲染登记表单的技能下拉框。参数：无。返回：无（直接写 DOM）。 */
function renderSkillOptions() {
    let html = '';
    for (let i = 1; i < skills.length; i++) {
        const levelVal = userSkillLevelOf(currentUserId, skills[i][0]);
        let suffix = '';
        if (levelVal > 0) {
            suffix = '（已登记 ' + levelVal + ' 级）';
        }
        html += '<option value="' + skills[i][0] + '">' + skills[i][2] + suffix + '</option>';
    }
    document.getElementById('selSkill').innerHTML = html;
}

/* 功能：渲染 1~5 级等级选择标签。参数：无。返回：无（直接写 DOM）。 */
function renderLevelTabs() {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        let stateClass = 'tab';
        if (i === pickedLevel) {
            stateClass = 'tab tab--on';
        }
        html += '<button class="' + stateClass + '" type="button" onclick="setLevel(' + i + ')">'
            + i + ' ' + levelNames[i] + '</button>';
    }
    document.getElementById('levelTabs').innerHTML = html;
}

/* 功能：选中技能进入登记/修改状态。参数：skillId=技能ID。返回：无。 */
function pickSkill(skillId) {
    document.getElementById('selSkill').value = String(skillId);
    pickedSkillId = skillId;

    const oldLevel = userSkillLevelOf(currentUserId, skillId);
    if (oldLevel > 0) {
        pickedLevel = oldLevel;
        const row = userSkillRow(currentUserId, skillId);
        if (row !== null && row[4] !== null) {
            document.getElementById('proof').value = row[4];
        }
    } else {
        pickedLevel = 3;
        document.getElementById('proof').value = '';
    }

    renderLevelTabs();
    document.getElementById('skillHint').innerHTML = '已选中：<b>' + skillName(skillId) + '</b>'
        + '，当前等级 ' + pickedLevel + ' 级。';
    document.getElementById('skillErr').className = 'form-error hidden';
}

/* 功能：设置待登记的技能等级值。参数：levelVal=等级数值。返回：无。 */
function setLevel(levelVal) {
    pickedLevel = levelVal;
    renderLevelTabs();
}

/* 功能：保存技能登记（新增或修改用户技能）。参数：无。返回：false（阻止表单默认提交）。 */
function saveSkill() {
    const skillId = Number(document.getElementById('selSkill').value);
    const proofText = document.getElementById('proof').value.trim();
    const errBox = document.getElementById('skillErr');

    errBox.className = 'form-error hidden';
    errBox.innerHTML = '';

    if (skillId === 0) {
        errBox.innerHTML = '请先选择一项技能。';
        errBox.className = 'form-error';
        return false;
    }
    if (pickedLevel < 1 || pickedLevel > 5) {
        errBox.innerHTML = '熟练程度必须是 1～5 级。';
        errBox.className = 'form-error';
        return false;
    }
    if (proofText !== '' && proofText.length < 2) {
        errBox.innerHTML = '证明材料至少 2 个字，或者留空。';
        errBox.className = 'form-error';
        document.getElementById('proof').focus();
        return false;
    }

    const oldRow = userSkillRow(currentUserId, skillId);
    const proofValue = proofText === '' ? null : proofText;

    if (oldRow === null) {
        /* 新增：用户技能ID 取现有行数，与测试数据的编号规则一致 */
        userSkills.push([userSkills.length, currentUserId, skillId, pickedLevel, proofValue, nowText()]);
        document.getElementById('skillHint').innerHTML = '已新增 <b>' + skillName(skillId) + '</b>，等级 '
            + pickedLevel + ' 级。';
    } else {
        oldRow[3] = pickedLevel;
        oldRow[4] = proofValue;
        oldRow[5] = nowText();
        document.getElementById('skillHint').innerHTML = '已更新 <b>' + skillName(skillId) + '</b>，等级 '
            + pickedLevel + ' 级。';
    }

    renderAll();
    return true;
}

/* 功能：删除指定的用户技能登记并重渲染。参数：userSkillId=用户技能ID。返回：无。 */
function removeSkill(userSkillId) {
    for (let i = 1; i < userSkills.length; i++) {
        if (userSkills[i][0] === userSkillId) {
            userSkills.splice(i, 1);
            break;
        }
    }
    document.getElementById('skillHint').innerHTML = '已删除该项技能记录。';
    renderAll();
}

/* 功能：清空技能登记表单。参数：无。返回：无。 */
function clearForm() {
    pickedLevel = 3;
    document.getElementById('proof').value = '';
    document.getElementById('skillErr').className = 'form-error hidden';
    document.getElementById('skillHint').innerHTML = '';
    renderLevelTabs();
}

/* ---------- 五、统一刷新 ---------- */

/* 功能：依次刷新本页统计卡、技能表、我的登记列表。参数：无。返回：无。 */
function renderAll() {
    renderStats();
    renderSkillTable();
    renderMyProfile();
    renderSkillOptions();
    document.getElementById('meta').innerHTML = '当前用户 ' + getUsername(currentUserId)
        + '<br>已登记 ' + filterRows(userSkills, 'user_id', currentUserId).length + ' 项技能';
}

window.onload = function () {
    renderNav('skill_list.html');
    renderIdentityCard(currentUserId);
    renderCategoryOptions();
    renderLevelTabs();
    renderAll();
    pickSkill(1);
};
