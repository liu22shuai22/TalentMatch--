/* ============================================================
   user_form.js —— 个人中心（用户资料编辑表单）
   1. 账号信息：用户表的全部展示字段（含注册时间）
   2. 修改登录口令：校验旧口令后写回用户表（内存）
   3. 技能证明材料：逐条编辑用户技能表的「技能证明材料」
   ============================================================ */

/* 当前登录用户（演示固定为 zhangwei，用户ID = 1） */
const currentUserId = 1;

/* ---------- 一、账号信息 ---------- */

/* 功能：渲染账号信息卡（用户名、角色、邮箱、注册时间等）。参数：无。返回：无（直接写 DOM）。 */
function renderAccount() {
    const userRow = findRow(users, 'user_id', currentUserId);

    let html = '<div class="line-row"><span class="line-main">用户名</span>'
        + '<b>' + userRow[1] + '</b></div>'
        + '<div class="line-row"><span class="line-main">用户角色</span>'
        + '<span class="tag tag--yellow">' + userRow[4] + '</span></div>'
        + '<div class="line-row"><span class="line-main">电子邮箱</span>'
        + '<span>' + userRow[3] + '</span></div>'
        + '<div class="line-row"><span class="line-main">注册时间</span>'
        + '<span class="muted">' + userRow[5] + '</span></div>'
        + '<div class="line-row"><span class="line-main">已登记技能</span>'
        + '<b class="num">' + filterRows(userSkills, 'user_id', currentUserId).length + '</b> 项</div>'
        + '<div class="line-row"><span class="line-main">登录口令</span>'
        + '<span class="muted">已设置（演示用明文，见下方修改口令）</span></div>'
        + '<a class="btn btn--sm btn--block mt-14" href="' + pageUrl('login.html') + '">切换账号</a>';

    document.getElementById('accountCard').innerHTML = html;
    document.getElementById('meta').innerHTML = '当前用户 ' + userRow[1]
        + '<br>注册于 ' + userRow[5];
}

/* ---------- 二、修改登录口令 ---------- */

/* 功能：校验并修改当前用户口令（仅本页内存生效）。参数：无。返回：false（阻止表单默认提交）。 */
function changePwd() {
    const oldPwd = document.getElementById('oldPwd').value;
    const newPwd = document.getElementById('newPwd').value;
    const newPwd2 = document.getElementById('newPwd2').value;
    const errBox = document.getElementById('pwdErr');
    const hintBox = document.getElementById('pwdHint');

    errBox.className = 'form-error hidden';
    errBox.innerHTML = '';
    hintBox.innerHTML = '';

    /* 演示口令：种子数据里所有账号都是 123456 */
    if (oldPwd !== '123456') {
        errBox.innerHTML = '当前口令不正确（演示口令为 123456）。';
        errBox.className = 'form-error';
        document.getElementById('oldPwd').focus();
        document.getElementById('oldPwd').select();
        return false;
    }
    if (newPwd.length < 6) {
        errBox.innerHTML = '新口令至少 6 位。';
        errBox.className = 'form-error';
        document.getElementById('newPwd').focus();
        return false;
    }
    if (newPwd !== newPwd2) {
        errBox.innerHTML = '两次输入的新口令不一致。';
        errBox.className = 'form-error';
        document.getElementById('newPwd2').focus();
        document.getElementById('newPwd2').select();
        return false;
    }
    if (newPwd === oldPwd) {
        errBox.innerHTML = '新口令不能和当前口令一样。';
        errBox.className = 'form-error';
        return false;
    }

    /* 写回用户表（静态原型：内存明文，正式系统应存 SHA-256 摘要） */
    const userRow = findRow(users, 'user_id', currentUserId);
    userRow[2] = '（本页已改为：' + newPwd + '）';

    hintBox.innerHTML = '口令已修改，本页内的登录口令即刻变为新口令。刷新页面后恢复演示口令。';
    resetPwdForm();
    return true;
}

/* 功能：清空修改口令表单。参数：无。返回：无。 */
function resetPwdForm() {
    document.getElementById('oldPwd').value = '';
    document.getElementById('newPwd').value = '';
    document.getElementById('newPwd2').value = '';
    document.getElementById('pwdErr').className = 'form-error hidden';
}

/* ---------- 三、技能证明材料 ---------- */

/* 功能：渲染技能证明材料编辑列表。参数：无。返回：无（直接写 DOM）。 */
function renderProofList() {
    const myRows = filterRows(userSkills, 'user_id', currentUserId);

    let html = '<div class="card">';
    if (myRows.length === 0) {
        html += '<p class="empty">还没有登记技能，先去「技能登记」页添加。</p>';
    }
    for (let i = 0; i < myRows.length; i++) {
        const row = myRows[i];
        let proofValue = '';
        if (row[4] !== null) {
            proofValue = row[4];
        }
        html += '<div class="mb-14">'
            + '<div class="flex-baseline flex-baseline--gap">'
            + '<b class="fs-14">' + skillName(row[2]) + '</b>'
            + '<span class="muted">' + row[3] + ' 级 · ' + levelNames[row[3]] + '</span></div>'
            + '<div class="flex-top mt-8">'
            + '<input class="input" type="text" id="proof' + row[0] + '" maxlength="40" value="' + escapeHtml(proofValue) + '" placeholder="证书 / 项目 / 作品链接">'
            + '<button class="btn btn--sm" type="button" onclick="saveProof(' + row[0] + ')">保存</button>'
            + '</div>'
            + '<p class="muted fs-14">更新时间：' + row[5] + '</p>'
            + '</div>';
    }
    html += '</div>';

    document.getElementById('proofList').innerHTML = html;
    document.getElementById('proofNote').innerHTML = '共 ' + myRows.length + ' 项技能';
}

/* 功能：保存指定用户技能的证明材料。参数：userSkillId=用户技能ID。返回：无。 */
function saveProof(userSkillId) {
    const inputBox = document.getElementById('proof' + userSkillId);
    const proofText = inputBox.value.trim();

    for (let i = 1; i < userSkills.length; i++) {
        if (userSkills[i][0] === userSkillId) {
            userSkills[i][4] = proofText === '' ? null : proofText;
            userSkills[i][5] = nowText();
            break;
        }
    }

    renderProofList();
}

/* ---------- 四、统一刷新 ---------- */

window.onload = function () {
    renderNav('user_form.html');
    renderIdentityCard(currentUserId);
    renderAccount();
    renderProofList();
};
