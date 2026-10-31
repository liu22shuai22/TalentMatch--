const currentUserId = 1;
let selectedPlanId = 1;
let resourceFilterVal = '';

window.onload = function () {
    renderNav('plan_list.html');
    renderIdentityCard(currentUserId);
    renderPlanTabs();
    renderTasks();
    renderResourceTabs();
    renderResources();
    renderPrereqPath();
};

/* 功能：渲染学习计划切换标签。参数：无。返回：无（直接写 DOM）。 */
function renderPlanTabs() {
    let html = '';
    let count = 0;
    for (let i = 1; i < learningPlans.length; i++) {
        if (learningPlans[i][1] !== currentUserId) {
            continue;
        }
        count = count + 1;
        let categoryRow = 'tab';
        if (learningPlans[i][0] === selectedPlanId) {
            categoryRow = 'tab tab--on';
        }
        html += '<button class="' + categoryRow + '" type="button" onclick="switchPlan(' + learningPlans[i][0] + ')">'
            + learningPlans[i][3] + ' · ' + learningPlans[i][4] + '</button>';
    }
    document.getElementById('planTabs').innerHTML = html;
    document.getElementById('meta').innerHTML = '我的计划 ' + count + ' 个<br>任务 ' + myTaskCount() + ' 条';
}

/* 功能：统计当前用户计划下的任务总数。参数：无。返回：任务数量。 */
function myTaskCount() {
    let count = 0;
    for (let i = 1; i < learningTasks.length; i++) {
        const planRow = findRow(learningPlans, 'plan_id', learningTasks[i][1]);
        if (planRow !== null && planRow[1] === currentUserId) {
            count = count + 1;
        }
    }
    return count;
}

/* 功能：切换到指定学习计划并重渲染。参数：planId=计划ID。返回：无。 */
function switchPlan(planId) {
    selectedPlanId = planId;
    renderPlanTabs();
    renderTasks();
}

/* 功能：按任务顺序号升序就地排序。参数：taskRows=任务行数组。返回：排序后的同一数组。 */
function sortTasksByOrder(taskRows) {
    for (let i = 0; i < taskRows.length - 1; i++) {
        for (let k = 0; k < taskRows.length - 1 - i; k++) {
            if (taskRows[k][5] > taskRows[k + 1][5]) {
                const tmpItem = taskRows[k];
                taskRows[k] = taskRows[k + 1];
                taskRows[k + 1] = tmpItem;
            }
        }
    }
}

/* ---------- 按最近一次评估生成补差计划 ---------- */

/* 功能：按最近一次评估的缺口技能生成学习计划与任务，并自动关联学习资源。参数：无。返回：true=生成成功，false=失败（已给出提示）。 */
function generatePlan() {
    const hintBox = document.getElementById('genHint');

    /* 从评估记录表末尾往前找当前用户最近的一次评估 */
    let lastRecord = null;
    for (let i = assessmentRecords.length - 1; i >= 1; i--) {
        if (assessmentRecords[i][1] === currentUserId) {
            lastRecord = assessmentRecords[i];
            break;
        }
    }
    if (lastRecord === null) {
        hintBox.innerHTML = '你还没有保存过评估，先去「能力评估」做一次并保存。';
        return false;
    }

    const recordId = lastRecord[0];
    const jobId = lastRecord[2];

    /* 找出这次评估里的缺口技能：我的等级低于要求等级 */
    const requirements = filterRows(jobSkillRequirements, 'job_id', jobId);
    const gapList = [];
    for (let i = 0; i < requirements.length; i++) {
        const myLevel = userSkillLevel(currentUserId, requirements[i][2]);
        const gapVal = requirements[i][3] - myLevel;
        if (gapVal > 0) {
            gapList.push([requirements[i][2], gapVal]);
        }
    }
    if (gapList.length === 0) {
        hintBox.innerHTML = '最近一次评估（#' + recordId + '）全部达标，不需要生成补差计划。';
        return false;
    }

    /* 差距大的排前面：冒泡排序 */
    for (let i = 0; i < gapList.length - 1; i++) {
        for (let k = 0; k < gapList.length - 1 - i; k++) {
            if (gapList[k][1] < gapList[k + 1][1]) {
                const tmpItem = gapList[k];
                gapList[k] = gapList[k + 1];
                gapList[k + 1] = tmpItem;
            }
        }
    }

    /* 建计划：名称带目标岗位和日期，关联这次评估记录；同一评估可多次生成 */
    const planId = learningPlans.length;
    learningPlans.push([planId, currentUserId, recordId,
        jobName(jobId) + ' 补差计划 ' + pad2(new Date().getMonth() + 1) + '-'
        + pad2(new Date().getDate()), '进行中', nowText()]);

    /* 每项缺口技能一条任务：优先关联该技能的第一条学习资源 */
    let order = 1;
    for (let i = 0; i < gapList.length; i++) {
        const skillId = gapList[i][0];
        const resourceRows = filterRows(learningResources, 'skill_id', skillId);
        let resourceId = null;
        if (resourceRows.length > 0) {
            resourceId = resourceRows[0][0];
        }
        learningTasks.push([learningTasks.length, planId, skillId, resourceId,
            '补齐 ' + skillName(skillId) + '（差 ' + gapList[i][1] + ' 级）', order, '未开始']);
        order++;
    }

    selectedPlanId = planId;
    renderPlanTabs();
    renderTasks();
    hintBox.innerHTML = '已根据评估 <b>#' + recordId + '</b> 生成「' + jobName(jobId)
        + ' 补差计划」：' + gapList.length + ' 项缺口技能 → ' + gapList.length
        + ' 条任务，差距大的排在前面。';
    return true;
}

/* 功能：渲染任务列表（含开始/完成操作）。参数：无。返回：无（直接写 DOM）。 */
function renderTasks() {
    const planRow = findRow(learningPlans, 'plan_id', selectedPlanId);
    const taskRows = filterRows(learningTasks, 'plan_id', selectedPlanId);
    sortTasksByOrder(taskRows);
    let doneCount = 0;
    let industryRow = '';
    for (let i = 0; i < taskRows.length; i++) {
        if (taskRows[i][6] === '已完成') {
            doneCount = doneCount + 1;
        }
        const resourceRow = findRow(learningResources, 'resource_id', taskRows[i][3]);
        let resourceText = '<span class="muted">未关联</span>';
        if (resourceRow !== null) {
            resourceText = '<b>' + resourceRow[2] + '</b><br><span class="muted">' + resourceRow[3] + '</span>';
        }
        let actionHtml = '<button class="btn btn--sm" type="button" onclick="startTask(' + taskRows[i][0] + ')">开始</button>';
        if (taskRows[i][6] === '进行中') {
            actionHtml = '<button class="btn btn--sm btn--primary" type="button" onclick="completeTask(' + taskRows[i][0] + ')">标记完成</button>';
        }
        if (taskRows[i][6] === '已完成') {
            actionHtml = '<span class="muted">已归档</span>';
        }
        industryRow += '<tr>'
            + '<td><input type="checkbox" class="selectBtn"></td>'
            + '<td><b class="num">0' + taskRows[i][5] + '</b></td>'
            + '<td><b>' + taskRows[i][4] + '</b><br><span class="muted">' + skillName(taskRows[i][2]) + '</span></td>'
            + '<td>' + resourceText + '</td>'
            + '<td>' + statusTag(taskRows[i][6]) + '</td>'
            + '<td>' + actionHtml + '</td>'
            + '</tr>';
    }

    const selectAllHtml = '<input type="checkbox" id="checkAll" onclick="toggleSelectAll()">';
    let html = '<thead><tr><th>' + selectAllHtml + '</th><th>顺序</th><th>任务</th><th>学习资源</th><th>状态</th><th>操作</th></tr></thead>';
    if (taskRows.length === 0) {
        html += '<tbody><tr><td colspan="6"><span class="muted">这个计划还没有任务。</span></td></tr></tbody>';
    } else {
        html += '<tbody>' + industryRow + '</tbody>';
    }
    document.getElementById('taskTable').innerHTML = html;

    const progressPct = taskRows.length === 0 ? 0 : Math.round(doneCount / taskRows.length * 100);
    document.getElementById('taskNote').innerHTML = planRow[3] + ' · 完成 ' + doneCount + ' / ' + taskRows.length;
    document.getElementById('overview').innerHTML = renderSummary(planRow, taskRows, doneCount, progressPct);
}

/* 功能：拼装计划概要卡 HTML。参数：planRow=计划行，taskRows=任务行数组，doneCount=已完成数，progressPct=完成百分比。返回：HTML 字符串。 */
function renderSummary(planRow, taskRows, doneCount, progressPct) {
    let html = '<div class="card">'
        + '<div class="card-head"><span class="card-title">' + planRow[3] + '</span>' + statusTag(planRow[4]) + '</div>'
        + '<div class="flex-baseline flex-baseline--mb">'
        + '<span class="muted">完成度</span><b class="num num--lg">' + progressPct + '%</b></div>'
        + progressBar(progressPct, 'bar--mint')
        + '<div class="line-row mt-14"><span class="line-main">任务总数</span>'
        + '<b class="num">' + taskRows.length + '</b></div>'
        + '<div class="line-row"><span class="line-main">已完成</span><b class="num">' + doneCount + '</b></div>'
        + '<div class="line-row"><span class="line-main">关联评估</span>'
        + '<span>' + relatedAssessText(planRow[2]) + '</span></div>'
        + '<div class="line-row"><span class="line-main">创建时间</span>'
        + '<span class="muted">' + planRow[5] + '</span></div>';

    /* 这个计划覆盖的技能 */
    let skillTagsHtml = '';
    for (let i = 0; i < taskRows.length; i++) {
        skillTagsHtml += '<span class="tag inlist">' + skillName(taskRows[i][2]) + '</span>';
    }
    html += '<p class="side-label mt-14">覆盖技能</p><div>' + skillTagsHtml + '</div></div>';
    return html;
}

/* 功能：生成计划关联评估记录的展示文本。参数：assessmentRecordId=评估记录ID。返回：HTML 片段字符串。 */
function relatedAssessText(assessmentRecordId) {
    if (assessmentRecordId === null) {
        return '<span class="muted">未关联评估</span>';
    }
    const record = findRow(assessmentRecords, 'assessment_id', assessmentRecordId);
    return '<b>#' + record[0] + '</b> <span class="muted">' + jobName(record[2]) + ' ' + record[3] + ' 分</span>';
}

/* 功能：全选/取消全选任务复选框。参数：无。返回：无。 */
function toggleSelectAll() {
    const selectAllBox = document.getElementById('checkAll');
    const boxes = document.querySelectorAll('.selectBtn');
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].checked = selectAllBox.checked;
    }
}

/* 功能：把任务状态置为进行中并刷新。参数：taskId=任务ID。返回：无。 */
function startTask(taskId) {
    const taskRows = findRow(learningTasks, 'task_id', taskId);
    taskRows[6] = '进行中';
    renderPlanTabs();
    renderTasks();
}

/* 功能：把任务状态置为已完成并刷新。参数：taskId=任务ID。返回：无。 */
function completeTask(taskId) {
    const taskRows = findRow(learningTasks, 'task_id', taskId);
    taskRows[6] = '已完成';
    renderPlanTabs();
    renderTasks();
}

/* 功能：渲染学习资源类型筛选标签。参数：无。返回：无（直接写 DOM）。 */
function renderResourceTabs() {
    const typeList = [];
    for (let i = 1; i < learningResources.length; i++) {
        const filterType = learningResources[i][3];
        let alreadyExists = false;
        for (let j = 0; j < typeList.length; j++) {
            if (typeList[j][0] === filterType) {
                typeList[j][1] = typeList[j][1] + 1;
                alreadyExists = true;
            }
        }
        if (alreadyExists === false) {
            typeList.push([filterType, 1]);
        }
    }
    let html = '<button class="tab" type="button" onclick="applyResourceFilter(\'\')">全部 · ' + rowCount(learningResources) + '</button>';
    for (let i = 0; i < typeList.length; i++) {
        let categoryRow = 'tab';
        if (resourceFilterVal === typeList[i][0]) {
            categoryRow = 'tab tab--on';
        }
        html += '<button class="' + categoryRow + '" type="button" onclick="applyResourceFilter(\'' + typeList[i][0] + '\')">'
            + typeList[i][0] + ' · ' + typeList[i][1] + '</button>';
    }
    document.getElementById('resTabs').innerHTML = html;
}

/* 功能：按类型筛选学习资源并重渲染。参数：filterType=资源类型。返回：无。 */
function applyResourceFilter(filterType) {
    resourceFilterVal = filterType;
    renderResourceTabs();
    renderResources();
}

/* 功能：渲染学习资源列表。参数：无。返回：无（直接写 DOM）。 */
function renderResources() {
    let hitCount = 0;
    let industryRow = '';
    for (let i = 1; i < learningResources.length; i++) {
        if (resourceFilterVal !== '' && learningResources[i][3] !== resourceFilterVal) {
            continue;
        }
        hitCount = hitCount + 1;
        industryRow += '<tr>'
            + '<td><b>' + learningResources[i][2] + '</b><br><span class="muted">' + learningResources[i][5] + '</span></td>'
            + '<td>' + skillName(learningResources[i][1]) + '</td>'
            + '<td><span class="tag">' + learningResources[i][3] + '</span></td>'
            + '<td><a class="underline" href="' + learningResources[i][4] + '">打开资源</a></td>'
            + '</tr>';
    }
    let html = '<thead><tr><th>资源</th><th>关联技能</th><th>类型</th><th>链接</th></tr></thead>';
    if (hitCount === 0) {
        html += '<tbody><tr><td colspan="4"><span class="muted">没有这类资源。</span></td></tr></tbody>';
    } else {
        html += '<tbody>' + industryRow + '</tbody>';
    }
    document.getElementById('resTable').innerHTML = html;
    document.getElementById('resNote').innerHTML = '共 ' + rowCount(learningResources) + ' 条 · 当前显示 ' + hitCount + ' 条';
}

/* 功能：渲染技能先修路径（前置技能掌握情况）。参数：无。返回：无（直接写 DOM）。 */
function renderPrereqPath() {
    let html = '';
    for (let i = 1; i < skills.length; i++) {
        const prereqRows = filterRows(skillPrerequisites, 'target_skill_id', skills[i][0]);
        if (prereqRows.length === 0) {
            continue;
        }
        let prereqText = '';
        for (let j = 0; j < prereqRows.length; j++) {
            const levelVal = userSkillLevel(currentUserId, prereqRows[j][2]);
            let categoryRow = 'tag tag--orange';
            if (levelVal > 0) {
                categoryRow = 'tag tag--mint';
            }
            prereqText += '<span class="' + categoryRow + ' inlist">'
                + skillName(prereqRows[j][2]) + ' ' + levelVal + '级</span>';
        }
        const myLevel = userSkillLevel(currentUserId, skills[i][0]);
        let targetType = 'tag tag--todo';
        if (myLevel > 0) {
            targetType = 'tag tag--mint';
        }
        html += '<article class="card job-card">'
            + '<div class="job-top"><div>'
            + '<p class="job-cat">' + skillCategoryName(skills[i][0]) + '</p>'
            + '<h3 class="job-name">' + skills[i][2] + '</h3>'
            + '</div><span class="' + targetType + '">我 ' + myLevel + ' 级</span></div>'
            + '<p class="job-desc">' + skills[i][3] + '</p>'
            + '<p class="side-label mt-14">先学这些</p>'
            + '<div>' + prereqText + '</div>'
            + '</article>';
    }
    document.getElementById('path').innerHTML = html;
}
