/* 功能：切换指定口令框的明文/密文显示。参数：btnEl=按钮元素，boxId=输入框 id。返回：无。 */
function togglePassword(btnEl, boxId) {
    const box = document.getElementById(boxId);
    const eyeIcon = btnEl.querySelector('.eye');
    if (box.type === 'password') {
        box.type = 'text';
        eyeIcon.className = 'eye eye--off';
    } else {
        box.type = 'password';
        eyeIcon.className = 'eye';
    }
}

/* 功能：根据新口令内容更新口令强度提示。参数：无。返回：无（直接写 DOM）。 */
function updateStrength() {
    const value = document.getElementById('password').value;
    const meterBars = document.querySelectorAll('#meter span');
    const hintEl = document.getElementById('hint');
    let score = 0;

    if (value.length > 0) { score = 1; }
    if (value.length >= 8) { score = 2; }
    if (value.length >= 8 && /[0-9]/.test(value)) { score = 3; }
    if (value.length >= 10 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value)) { score = 4; }

    for (let i = 0; i < meterBars.length; i++) {
        if (i < score) { meterBars[i].className = 'on'; } else { meterBars[i].className = ''; }
    }

    const strengthWords = ['未输入', '弱', '一般', '较强', '强'];
    hintEl.innerHTML = '密码强度：' + strengthWords[score];
}

/* 功能：校验注册表单（必填、格式、两次口令一致）并写入用户表。参数：无。返回：false（阻止表单默认提交）。 */
function validateRegister() {
    const nameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const pwdInput = document.getElementById('password');
    const pwd2Input = document.getElementById('password2');
    const agreeBox = document.getElementById('agree');
    const errBox = document.getElementById('err');

    errBox.style.display = 'none';
    errBox.innerHTML = '';

    const getUsername = nameInput.value.trim();
    const emailValue = emailInput.value.trim();

    if (getUsername === '') { return showError('用户名不能为空，请填写后再提交。', nameInput); }
    if (getUsername.length < 3 || getUsername.length > 16) { return showError('用户名请填写 3～16 个字符。', nameInput); }
    if (getUsername.indexOf(' ') !== -1) { return showError('用户名不能包含空格。', nameInput); }

    const nameTaken = findRow(users, 'username', getUsername);
    if (nameTaken !== null) { return showError('用户名「' + getUsername + '」已被注册，请换一个。', nameInput); }

    if (emailValue === '') { return showError('电子邮箱不能为空，请填写后再提交。', emailInput); }
    const atPos = emailValue.indexOf('@');
    if (atPos < 1 || emailValue.indexOf('.', atPos) < atPos + 2) {
        return showError('邮箱格式不正确，请填写类似 you@example.com 的地址。', emailInput);
    }
    const emailTaken = findRow(users, 'email', emailValue);
    if (emailTaken !== null) { return showError('该邮箱已被注册，请换一个或直接登录。', emailInput); }

    if (pwdInput.value === '') { return showError('密码不能为空，请设置后再提交。', pwdInput); }
    if (pwdInput.value.length < 6) { return showError('密码至少 6 位，请重新设置。', pwdInput); }
    if (pwd2Input.value === '') { return showError('请再输入一次密码进行确认。', pwd2Input); }
    if (pwdInput.value !== pwd2Input.value) { return showError('两次输入的密码不一致，请检查。', pwd2Input); }

    if (agreeBox.checked === false) { return showError('请先勾选同意用户协议与隐私说明。', agreeBox); }

    /* 模拟 INSERT INTO 用户：只在当前页面内存里追加一条 */
    users.push([users.length, getUsername, '（演示未加密）', emailValue, '普通用户', '2026-10-28 21:00:00']);

    document.getElementById('regForm').style.display = 'none';
    document.getElementById('doneText').innerHTML = '用户名 <b>' + getUsername + '</b> ｜ 邮箱 ' + emailValue;
    document.getElementById('done').style.display = 'block';

    return false;   /* 阻止真实提交，留在本页展示结果 */
}

/* 功能：显示表单错误提示。参数：text=提示文本，box=提示容器元素。返回：无。 */
function showError(text, box) {
    const errBox = document.getElementById('err');
    errBox.innerHTML = text;
    errBox.style.display = 'block';
    box.focus();
    if (box.select) { box.select(); }
    return false;
}
