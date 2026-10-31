const currentUserId = 1;

window.onload = function () {
    renderNav('index.html');
    renderIdentityCard(currentUserId);
    renderRanking();
    renderIndustryChart();
    renderSkillProfile();
    renderLearningProgress();
    renderAssessHistory();
};

/* 功能：渲染当前用户对已配置要求岗位的匹配排行。参数：无。返回：无（直接写 DOM）。 */
function renderRanking() {
    const rowList = [];
    const noReqJobs = [];
    for (let i = 1; i < jobs.length; i++) {
        const score = calcMatchScore(currentUserId, jobs[i][0]);
        if (score >= 0) {
            rowList.push([jobs[i][0], score]);
        } else {
            noReqJobs.push(jobs[i][2]);
        }
    }
    sortByScoreDesc(rowList);

    let html = '';
    for (let i = 0; i < rowList.length; i++) {
        const jobId = rowList[i][0];
        const score = rowList[i][1];
        const jobRow = findRow(jobs, 'job_id', jobId);
        let colorName = 'bar--orange';
        if (score >= 60) {
            colorName = 'bar--mint';
        } else if (score >= 40) {
            colorName = 'bar--yellow';
        }
        html += '<article class="card job-card job-card--lead">'
            + '<div class="job-top"><div>'
            + '<p class="job-cat">' + jobIndustryName(jobId) + ' · ' + jobCategoryName(jobId) + '</p>'
            + '<h3 class="job-name">' + jobRow[2] + '</h3>'
            + '</div>' + levelTag(jobRow[4]) + '</div>'
            + '<p class="job-desc">' + jobRow[3] + '</p>'
            + '<div class="match-line"><span class="match-num">' + score + '</span>'
            + '<span class="match-unit">匹配度 / 100</span></div>'
            + progressBar(score, colorName)
            + '<div class="job-foot"><span class="muted">还差 ' + gapSkillCount(currentUserId, jobId) + ' 项技能达标</span>'
            + '<a class="btn btn--primary" href="' + pageUrl('assessment_form.html') + '">看差距</a></div>'
            + '</article>';
    }

    /* 没有技能要求的岗位，单独用虚线卡说明 */
    if (noReqJobs.length > 0) {
        let nameText = '';
        for (let i = 0; i < noReqJobs.length; i++) {
            nameText += noReqJobs[i];
            if (i < noReqJobs.length - 1) {
                nameText += '、';
            }
        }
        html += '<article class="card job-card card--pending">'
            + '<div class="job-top"><div>'
            + '<p class="job-cat">还不能算匹配</p>'
            + '<h3 class="job-name">' + noReqJobs.length + ' 个岗位还没写要求</h3>'
            + '</div><span class="tag tag--todo">待完善</span></div>'
            + '<p class="job-desc">' + nameText + '</p>'
            + '<p class="job-desc">这些岗位还没写技能要求，写好后才会出现在匹配排行里。</p>'
            + '<div class="job-foot"><span class="muted">暂无匹配度</span>'
            + '<a class="btn btn--sm" href="' + pageUrl('job_list.html') + '">去岗位库</a></div>'
            + '</article>';
    }
    document.getElementById('rank').innerHTML = html;
}

/* 功能：统计某行业下的岗位数。参数：industryId=行业ID。返回：岗位数量。 */
function industryJobCount(industryId) {
    let count = 0;
    for (let i = 1; i < jobCategories.length; i++) {
        if (jobCategories[i][1] === industryId) {
            for (let j = 1; j < jobs.length; j++) {
                if (jobs[j][1] === jobCategories[i][0]) {
                    count = count + 1;
                }
            }
        }
    }
    return count;
}

/* 功能：统计某行业下覆盖的岗位类别数。参数：industryId=行业ID。返回：类别数量。 */
function industryCategoryCount(industryId) {
    let count = 0;
    for (let i = 1; i < jobCategories.length; i++) {
        if (jobCategories[i][1] === industryId) {
            count = count + 1;
        }
    }
    return count;
}

/* 功能：渲染行业岗位分布横向条形图。参数：无。返回：无（直接写 DOM）。 */
function renderIndustryChart() {
    let maxCount = 0;
    for (let i = 1; i < industries.length; i++) {
        const count = industryJobCount(industries[i][0]);
        if (count > maxCount) {
            maxCount = count;
        }
    }
    let html = '';
    for (let i = 1; i < industries.length; i++) {
        const count = industryJobCount(industries[i][0]);
        const pct = Math.round(count / maxCount * 100);
        html += '<div class="ind-row">'
            + '<span class="ind-name">' + industries[i][1] + '</span>'
            + '<span class="ind-bar">' + progressBar(pct, 'bar--blue') + '</span>'
            + '<span class="ind-num">' + count + ' 岗</span>'
            + '</div>'
            + '<p class="muted ind-sub">' + industryCategoryCount(industries[i][0]) + ' 个岗位类别 · ' + industries[i][2] + '</p>';
    }
    document.getElementById('industry').innerHTML = html;
}

/* 功能：渲染当前用户的已登记技能画像。参数：无。返回：无（直接写 DOM）。 */
function renderSkillProfile() {
    const myRows = filterRows(userSkills, 'user_id', currentUserId);
    let html = '<div class="card-head"><span class="card-title">' + getUsername(currentUserId) + '</span>'
        + '<span class="tag">' + myRows.length + ' 项技能</span></div>';
    for (let i = 0; i < myRows.length; i++) {
        html += '<div class="line-row">'
            + '<span class="line-main">' + skillName(myRows[i][2])
            + '<span class="line-sub"> ' + skillCategoryName(myRows[i][2]) + '</span></span>'
            + levelBars(myRows[i][3])
            + '<span class="muted">' + myRows[i][3] + '/5</span>'
            + '</div>';
    }
    html += '<a class="btn btn--sm btn--block mt-14" href="' + pageUrl('assessment_form.html') + '">重新评估我的技能</a>';
    document.getElementById('mySkills').innerHTML = html;
}

/* 功能：渲染当前用户学习计划的完成进度与任务列表。参数：无。返回：无（直接写 DOM）。 */
function renderLearningProgress() {
    const planRow = findRow(learningPlans, 'user_id', currentUserId);
    const taskRows = filterRows(learningTasks, 'plan_id', planRow[0]);
    let doneCount = 0;
    let progressListHtml = '';
    for (let i = 0; i < taskRows.length; i++) {
        if (taskRows[i][6] === '已完成') {
            doneCount = doneCount + 1;
        }
        progressListHtml += '<div class="line-row">'
            + '<span class="muted">0' + taskRows[i][5] + '</span>'
            + '<span class="line-main">' + taskRows[i][4]
            + '<span class="line-sub"> ' + skillName(taskRows[i][2]) + '</span></span>'
            + statusTag(taskRows[i][6])
            + '</div>';
    }
    const progressPct = Math.round(doneCount / taskRows.length * 100);
    document.getElementById('planNote').innerHTML = planRow[3] + ' · ' + planRow[4];

    let html = '<div class="card-head"><span class="card-title">' + planRow[3] + '</span>'
        + '<span class="tag tag--yellow">' + doneCount + ' / ' + taskRows.length + ' 已完成</span></div>'
        + progressBar(progressPct, 'bar--mint')
        + progressListHtml
        + '<a class="btn btn--sm btn--block mt-14" href="' + pageUrl('plan_list.html') + '">打开学习计划</a>';
    document.getElementById('plan').innerHTML = html;
}

/* 功能：渲染全体用户的评估记录列表。参数：无。返回：无（直接写 DOM）。 */
function renderAssessHistory() {
    let html = '';
    for (let i = 1; i < assessmentRecords.length; i++) {
        html += '<div class="line-row">'
            + '<span class="line-main">' + jobName(assessmentRecords[i][2])
            + '<span class="line-sub"> ' + getUsername(assessmentRecords[i][1]) + '</span></span>'
            + '<span class="num">' + assessmentRecords[i][3] + '</span>'
            + '</div>';
    }
    html += '<p class="muted mt-12">最近一次：' + assessmentRecords[assessmentRecords.length - 1][4] + '</p>';
    document.getElementById('history').innerHTML = html;
}
