/* 功能：切换口令输入框的明文/密文显示。参数：无。返回：无。 */
function togglePassword() {
    const pwdInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye');
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        eyeIcon.className = 'eye eye--off';
    } else {
        pwdInput.type = 'password';
        eyeIcon.className = 'eye';
    }
}

/* 功能：校验账号口令，通过后跳转工作台或提示错误。参数：无。返回：false（阻止表单默认提交）。 */
function validateLogin() {
    const nameInput = document.getElementById('username');
    const pwdInput = document.getElementById('password');
    const errBox = document.getElementById('err');
    errBox.style.display = 'none';
    errBox.innerHTML = '';

    if (nameInput.value.trim() === '') {
        errBox.innerHTML = '用户名不能为空，请填写后再提交。';
        errBox.style.display = 'block';
        nameInput.focus();
        nameInput.select();
        return false;
    }

    if (pwdInput.value.trim() === '') {
        errBox.innerHTML = '密码不能为空，请填写后再提交。';
        errBox.style.display = 'block';
        pwdInput.focus();
        pwdInput.select();
        return false;
    }

    const accountRow = findRow(users, 'username', nameInput.value.trim());
    if (accountRow === null) {
        errBox.innerHTML = '用户「' + nameInput.value.trim() + '」不存在，请检查用户名。';
        errBox.style.display = 'block';
        nameInput.focus();
        nameInput.select();
        return false;
    }

    if (pwdInput.value !== '123456') {
        errBox.innerHTML = '密码不正确。演示口令为 123456。';
        errBox.style.display = 'block';
        pwdInput.focus();
        pwdInput.select();
        return false;
    }

    return true;   /* 校验通过，表单按 action 跳到工作台 */
}
