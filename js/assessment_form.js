const currentUserId = 1;

/* 最近一次评估的结果缓存：保存评估时用 */
let lastAssessment = null;

window.onload = function () {
    renderNav('assessment_form.html');
    renderIdentityCard(currentUserId);
    renderOptions();
    document.getElementById('selUser').value = 1;
    document.getElementById('selJob').value = 3;
    runAssessment();
    renderHistory();
};

/* 功能：渲染能力评估页的用户、岗位两个下拉框。参数：无。返回：无（直接写 DOM）。 */
function renderOptions() {
    let userOptions = '';
    for (let i = 1; i < users.length; i++) {
        userOptions += '<option value="' + users[i][0] + '">' + users[i][1] + '（' + users[i][4] + '）</option>';
    }
    document.getElementById('selUser').innerHTML = userOptions;

    let jobOptions = '';
    for (let i = 1; i < jobs.length; i++) {
        const reqCount = filterRows(jobSkillRequirements, 'job_id', jobs[i][0]).length;
        let suffix = ' · ' + jobs[i][4];
        if (reqCount === 0) {
            suffix = ' · 待维护技能要求';
        }
        jobOptions += '<option value="' + jobs[i][0] + '">' + jobs[i][2] + suffix + '</option>';
    }
    document.getElementById('selJob').innerHTML = jobOptions;
}

/* 功能：执行评估：计算匹配分与达标数，渲染结果卡、缺口区和明细表。参数：无。返回：无。 */
function runAssessment() {
    const userId = Number(document.getElementById('selUser').value);
    const jobId = Number(document.getElementById('selJob').value);
    const requirements = filterRows(jobSkillRequirements, 'job_id', jobId);
    const score = calcMatchScore(userId, jobId);
    const isQualified = requiredMetCount(userId, jobId);

    document.getElementById('resultNote').innerHTML = getUsername(userId) + ' → ' + jobName(jobId);

    if (requirements.length === 0) {
        lastAssessment = null;
        document.getElementById('saveHint').innerHTML = '该岗位没有技能要求，无法保存评估。';
        document.getElementById('score').innerHTML = '<div class="card"><div class="empty">'
            + '「' + jobName(jobId) + '」还没写技能要求，暂时算不出匹配度。</div></div>';
        document.getElementById('gap').innerHTML = '<div class="card"><div class="empty">暂无可比较的技能项。</div></div>';
        document.getElementById('detailTable').innerHTML = '<tbody><tr><td><span class="muted">没有评估明细。</span></td></tr></tbody>';
        return;
    }

    /* ------ 匹配结果大卡 ------ */
    let colorName = 'bar--orange';
    if (score >= 60) {
        colorName = 'bar--mint';
    } else if (score >= 40) {
        colorName = 'bar--yellow';
    }
    let html = '<div class="score-card">'
        + '<p class="score-unit">总分 / 100</p>'
        + '<p class="score-num">' + score + '</p>'
        + '<p class="score-verdict">' + matchComment(score) + '</p>'
        + '<div class="score-grid">'
        + '<div class="score-cell"><b>' + isQualified[0] + ' / ' + isQualified[1] + '</b><span class="muted">必备技能达标</span></div>'
        + '<div class="score-cell"><b>' + gapSkillCount(userId, jobId) + ' 项</b><span class="muted">待提升技能</span></div>'
        + '<div class="score-cell"><b>' + requirements.length + ' 项</b><span class="muted">岗位技能要求</span></div>'
        + '<div class="score-cell"><b>' + (Math.round((100 - score) * 10) / 10) + '</b><span class="muted">距离满分</span></div>'
        + '</div>'
        + '<div class="mt-18">' + progressBar(score, colorName) + '</div>'
        + '</div>';
    document.getElementById('score').innerHTML = html;

    /* ------ 优先补齐：按差距从大到小 ------ */
    const gapList = [];
    for (let i = 0; i < requirements.length; i++) {
        const gapVal = requirements[i][3] - userSkillLevel(userId, requirements[i][2]);
        gapList.push([requirements[i][2], gapVal, requirements[i][3], userSkillLevel(userId, requirements[i][2])]);
    }
    sortByScoreDesc(gapList);

    let gapCardHtml = '<div class="card"><div class="card-head"><span class="card-title">差距排序</span>'
        + '<span class="tag tag--orange">共 ' + gapSkillCount(userId, jobId) + ' 项</span></div>';
    for (let i = 0; i < gapList.length; i++) {
        const gapVal = gapList[i][1];
        if (gapVal <= 0) {
            continue;
        }
        const myRows = gapList[i][3];
        const requiredLvl = gapList[i][2];
        const achievedPct = Math.round(myRows / requiredLvl * 100);
        gapCardHtml += '<div class="mb-14">'
            + '<div class="flex-baseline flex-baseline--gap">'
            + '<b class="fs-14">' + skillName(gapList[i][0]) + '</b>'
            + '<span class="muted">差 ' + gapVal + ' 级 · ' + myRows + '/' + requiredLvl + '</span></div>'
            + progressBar(achievedPct, 'bar--orange')
            + '</div>';
    }
    const metCount = requirements.length - gapSkillCount(userId, jobId);
    if (metCount > 0) {
        gapCardHtml += '<p class="muted">另有 ' + metCount + ' 项已达标，无需再补。</p>';
    }
    gapCardHtml += '</div>';
    document.getElementById('gap').innerHTML = gapCardHtml;

    /* ------ 加权明细表 ------ */
    let detailHtml = '<thead><tr><th>技能</th><th>权重</th><th>要求等级</th><th>我的等级</th>'
        + '<th>达成率</th><th>加权得分</th><th>结论</th></tr></thead><tbody>';
    for (let i = 0; i < requirements.length; i++) {
        const skillId = requirements[i][2];
        const requiredLevel = requirements[i][3];
        const weight = requirements[i][4];
        let myRows = userSkillLevel(userId, skillId);
        if (myRows > requiredLevel) {
            myRows = requiredLevel;
        }
        const achievementRate = Math.round(myRows / requiredLevel * 100);
        const points = Math.round(weight * (myRows / requiredLevel) * 1000) / 1000;
        let verdictHtml = '<span class="tag tag--orange">待提升</span>';
        if (achievementRate >= 100) {
            verdictHtml = '<span class="tag tag--mint">已达标</span>';
        }
        let requiredHtml = '';
        if (requirements[i][5] === 1) {
            requiredHtml = ' <span class="tag tag--blue">必备</span>';
        }
        detailHtml += '<tr>'
            + '<td><b>' + skillName(skillId) + '</b>' + requiredHtml + '<br><span class="muted">' + skillCategoryName(skillId) + '</span></td>'
            + '<td>' + Math.round(weight * 100) + '%</td>'
            + '<td>' + requiredLevel + '</td>'
            + '<td>' + userSkillLevel(userId, skillId) + '</td>'
            + '<td>' + achievementRate + '%</td>'
            + '<td><b class="num">' + points + '</b></td>'
            + '<td>' + verdictHtml + '</td>'
            + '</tr>';
    }
    detailHtml += '</tbody>';
    document.getElementById('detailTable').innerHTML = detailHtml;

    /* 记下这次结果，供「保存本次评估」使用 */
    lastAssessment = { userId: userId, jobId: jobId, score: score };
    document.getElementById('saveHint').innerHTML = '评估完成：' + getUsername(userId) + ' → '
        + jobName(jobId) + '，匹配度 ' + score + '。点「保存本次评估」可以留下这次结果。';
}

/* ---------- 保存评估：写入评估记录表 + 评估明细表 ---------- */

/* 功能：把当前评估写入评估记录表与评估明细表，并刷新历史列表。参数：无。返回：true=保存成功，false=无可保存结果。 */
function saveAssessment() {
    const hintBox = document.getElementById('saveHint');

    if (lastAssessment === null) {
        hintBox.innerHTML = '还没有可保存的结果。请先选一个写了技能要求的岗位，再开始评估。';
        return false;
    }

    const recordId = assessmentRecords.length;

    /* 评估记录表：一条记录 = 一次评估 */
    assessmentRecords.push([recordId, lastAssessment.userId, lastAssessment.jobId,
        lastAssessment.score, nowText()]);

    /* 评估明细表：这次评估涉及的每项技能各一行 */
    const requirements = filterRows(jobSkillRequirements, 'job_id', lastAssessment.jobId);
    for (let i = 0; i < requirements.length; i++) {
        assessmentDetails.push([assessmentDetails.length, recordId, requirements[i][2],
            userSkillLevel(lastAssessment.userId, requirements[i][2]), requirements[i][3]]);
    }

    renderHistory();
    hintBox.innerHTML = '已保存。这次评估包含 ' + requirements.length
        + ' 项技能，下方列表已更新。';
    return true;
}

/* 功能：渲染评估历史列表。参数：无。返回：无（直接写 DOM）。 */
function renderHistory() {
    let html = '<thead><tr><th>记录</th><th>用户</th><th>目标岗位</th><th>匹配度</th><th>评估时间</th></tr></thead><tbody>';
    for (let i = 1; i < assessmentRecords.length; i++) {
        html += '<tr>'
            + '<td><b class="num">#' + assessmentRecords[i][0] + '</b></td>'
            + '<td>' + getUsername(assessmentRecords[i][1]) + '</td>'
            + '<td>' + jobName(assessmentRecords[i][2]) + '</td>'
            + '<td><b class="num">' + assessmentRecords[i][3] + '</b></td>'
            + '<td><span class="muted">' + assessmentRecords[i][4] + '</span></td>'
            + '</tr>';
    }
    html += '</tbody>';
    document.getElementById('historyTable').innerHTML = html;
    document.getElementById('historyNote').innerHTML = '一共 ' + (assessmentRecords.length - 1) + ' 次';
}
