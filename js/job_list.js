const currentUserId = 1;
let selectedJobId = 1;

window.onload = function () {
    renderNav('job_list.html');
    renderIdentityCard(currentUserId);
    renderIndustryOptions();
    renderList();
    viewJob(selectedJobId);
};

/* 功能：渲染岗位库的行业筛选下拉框。参数：无。返回：无（直接写 DOM）。 */
function renderIndustryOptions() {
    let html = '<option value="">全部行业</option>';
    for (let i = 1; i < industries.length; i++) {
        html += '<option value="' + industries[i][0] + '">' + industries[i][1] + '</option>';
    }
    document.getElementById('fIndustry').innerHTML = html;
}

/* 功能：岗位ID 转行业ID。参数：jobId=岗位ID。返回：行业ID。 */
function jobIndustryId(jobId) {
    const jobRow = findRow(jobs, 'job_id', jobId);
    const categoryRow = findRow(jobCategories, 'job_category_id', jobRow[1]);
    return categoryRow === null ? 0 : categoryRow[1];
}

/* 功能：清空行业与关键词筛选并重渲染列表。参数：无。返回：无。 */
function resetFilters() {
    document.getElementById('kw').value = '';
    document.getElementById('fIndustry').value = '';
    document.getElementById('fLevel').value = '';
    document.getElementById('fGraph').value = '';
    renderList();
}

/* 功能：按行业、关键词筛选后渲染岗位列表。参数：无。返回：无（直接写 DOM）。 */
function renderList() {
    const keyword = document.getElementById('kw').value.trim();
    const industryId = Number(document.getElementById('fIndustry').value);
    const levelVal = document.getElementById('fLevel').value;
    const graphFilter = document.getElementById('fGraph').value;

    let hitCount = 0;
    let industryRow = '';
    for (let i = 1; i < jobs.length; i++) {
        const jobRow = jobs[i];
        const reqCount = filterRows(jobSkillRequirements, 'job_id', jobRow[0]).length;

        /* 四个筛选条件依次判断，任一不满足就跳过 */
        if (keyword !== '' && jobRow[2].indexOf(keyword) < 0 && jobRow[3].indexOf(keyword) < 0) {
            continue;
        }
        if (industryId !== 0 && jobIndustryId(jobRow[0]) !== industryId) {
            continue;
        }
        if (levelVal !== '' && jobRow[4] !== levelVal) {
            continue;
        }
        if (graphFilter === 'done' && reqCount === 0) {
            continue;
        }
        if (graphFilter === 'todo' && reqCount > 0) {
            continue;
        }

        hitCount = hitCount + 1;
        const score = calcMatchScore(currentUserId, jobRow[0]);
        let scoreCellHtml = '<span class="muted">暂无</span>';
        if (score >= 0) {
            scoreCellHtml = '<b class="num">' + score + '</b>';
        }
        let 图谱文字 = '<span class="tag tag--mint">' + reqCount + ' 项</span>';
        if (reqCount === 0) {
            图谱文字 = '<span class="tag tag--todo">待维护</span>';
        }
        industryRow += '<tr>'
            + '<td><b>' + jobRow[2] + '</b><br><span class="muted">' + jobCategoryName(jobRow[0]) + '</span></td>'
            + '<td>' + jobIndustryName(jobRow[0]) + '</td>'
            + '<td>' + levelTag(jobRow[4]) + '</td>'
            + '<td>' + 图谱文字 + '</td>'
            + '<td>' + scoreCellHtml + '</td>'
            + '<td><button class="btn btn--sm" type="button" onclick="viewJob(' + jobRow[0] + ')">详情</button></td>'
            + '</tr>';
    }

    let html = '<thead><tr><th>岗位</th><th>行业</th><th>等级</th><th>技能要求</th><th>我的匹配</th><th>操作</th></tr></thead>';
    if (hitCount === 0) {
        html += '<tbody><tr><td colspan="6"><span class="muted">没有符合当前条件的岗位，换个条件再试。</span></td></tr></tbody>';
    } else {
        html += '<tbody>' + industryRow + '</tbody>';
    }
    document.getElementById('jobTable').innerHTML = html;
    document.getElementById('countNote').innerHTML = '命中 ' + hitCount + ' / ' + rowCount(jobs) + ' 个岗位';
    document.getElementById('meta').innerHTML = '岗位 ' + rowCount(jobs) + ' 个<br>已配置要求 ' + countRequirements() + ' 个';
}

/* 功能：统计当前筛选结果中已配置技能要求的岗位数。参数：无。返回：数量。 */
function countRequirements() {
    let count = 0;
    for (let i = 1; i < jobs.length; i++) {
        if (filterRows(jobSkillRequirements, 'job_id', jobs[i][0]).length > 0) {
            count = count + 1;
        }
    }
    return count;
}

/* 功能：查看岗位详情及技能要求明细。参数：jobId=岗位ID。返回：无。 */
function viewJob(jobId) {
    selectedJobId = jobId;
    const jobRow = findRow(jobs, 'job_id', jobId);
    const requirements = filterRows(jobSkillRequirements, 'job_id', jobId);
    const score = calcMatchScore(currentUserId, jobId);

    let html = '<div class="card">'
        + '<p class="job-cat">' + jobIndustryName(jobId) + ' · ' + jobCategoryName(jobId) + '</p>'
        + '<h3 class="job-name job-name--lg">' + jobRow[2] + '</h3>'
        + '<div class="mt-8">' + levelTag(jobRow[4]) + '</div>'
        + '<p class="job-desc mt-10">' + jobRow[3] + '</p>';

    if (requirements.length === 0) {
        html += '<div class="callout">这个岗位还没写技能要求，暂时算不出匹配度。</div>'
            + '<a class="btn btn--sm btn--block mt-14" href="' + pageUrl('job_list.html') + '">返回清单</a>'
            + '</div>';
        document.getElementById('detail').innerHTML = html;
        return;
    }

    html += '<p class="side-label mt-18">技能要求 · ' + requirements.length + ' 项</p>';
    for (let i = 0; i < requirements.length; i++) {
        const skillId = requirements[i][2];
        const requiredLevel = requirements[i][3];
        const weight = requirements[i][4];
        const myLevel = userSkillLevel(currentUserId, skillId);
        let statusVal = '<span class="tag tag--orange">待提升</span>';
        if (myLevel >= requiredLevel) {
            statusVal = '<span class="tag tag--mint">已达标</span>';
        }
        let requiredHtml = '';
        if (requirements[i][5] === 1) {
            requiredHtml = '<span class="tag tag--blue">必备</span> ';
        }
        html += '<div class="line-row">'
            + '<span class="line-main">' + skillName(skillId)
            + '<span class="line-sub"> 权重 ' + Math.round(weight * 100) + '% · 要求 ' + requiredLevel + ' 级</span></span>'
            + '<span class="muted">我 ' + myLevel + ' 级</span>'
            + statusVal + '</div>';
    }

    let colorName = 'bar--orange';
    if (score >= 60) {
        colorName = 'bar--mint';
    } else if (score >= 40) {
        colorName = 'bar--yellow';
    }
    html += '<div class="match-line mt-18"><span class="match-num">' + score + '</span>'
        + '<span class="match-unit">匹配度 / 100</span></div>'
        + progressBar(score, colorName)
        + '<p class="muted mt-8">' + matchComment(score) + '</p>'
        + '<a class="btn btn--sm btn--dark btn--block mt-14" href="' + pageUrl('assessment_form.html') + '">进入能力评估</a>'
        + '</div>';
    document.getElementById('detail').innerHTML = html;
}
