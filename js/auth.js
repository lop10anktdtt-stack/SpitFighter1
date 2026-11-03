function switchTab(tab) {
    const loginMsg = document.getElementById('login-msg');
    const regMsg = document.getElementById('reg-msg');
    const regAlert = document.getElementById('reg-username-alert');
    if (loginMsg) loginMsg.classList.add('hidden');
    if (regMsg) regMsg.classList.add('hidden');
    if (regAlert) regAlert.classList.add('hidden');

    if (tab === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('form-register').classList.add('hidden');
        document.getElementById('tab-login').className = "flex-1 pb-3 text-sm font-bold custom-primary-text border-b-2 custom-primary-border transition-all uppercase";
        document.getElementById('tab-register').className = "flex-1 pb-3 text-sm font-bold opacity-60 border-b-2 border-transparent hover:opacity-100 transition-all uppercase";
    } else {
        document.getElementById('form-login').classList.add('hidden');
        document.getElementById('form-register').classList.remove('hidden');
        document.getElementById('tab-register').className = "flex-1 pb-3 text-sm font-bold custom-primary-text border-b-2 custom-primary-border transition-all uppercase";
        document.getElementById('tab-login').className = "flex-1 pb-3 text-sm font-bold opacity-60 border-b-2 border-transparent hover:opacity-100 transition-all uppercase";
    }
}

function checkRegisterUsername(val) {
    const username = val.trim().toLowerCase();
    const alertEl = document.getElementById('reg-username-alert');
    const submitBtn = document.getElementById('btn-submit-reg');
    if (!username) { alertEl.classList.add('hidden'); submitBtn.disabled = false; return; }
    let users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username)) {
        alertEl.innerText = "Tên tài khoản này đã có người dùng";
        alertEl.classList.remove('hidden');
        submitBtn.disabled = true;
    } else {
        alertEl.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-user').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const passConfirm = document.getElementById('reg-pass-confirm').value;
    const msgEl = document.getElementById('reg-msg');

    if (pass !== passConfirm) {
        msgEl.innerText = "Mật khẩu không khớp!";
        msgEl.className = "text-sm font-bold text-rose-500 text-center block";
        return;
    }

    let users = getUsers();
    users.push({ username, pass, displayName: "", role: "Khán giả", dob: "", bio: "", avatar: "", cover: "", friends: [], notifications: [], messages: {}, nicknames: {}, chatBackgrounds: {} });
    saveUsers(users);

    msgEl.innerText = "Đăng ký thành công! Hãy đăng nhập.";
    msgEl.className = "text-sm font-bold text-emerald-500 text-center block";
    setTimeout(() => { switchTab('login'); document.getElementById('login-user').value = username; document.getElementById('login-pass').value = ''; }, 1500);
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const user = getUsers().find(u => u.username.toLowerCase() === username.toLowerCase() && u.pass === pass);
    if (!user) {
        document.getElementById('login-msg').innerText = "Sai tài khoản hoặc mật khẩu!";
        document.getElementById('login-msg').classList.remove('hidden');
        return;
    }
    localStorage.setItem('spit_current_user', user.username);
    showDashboard();
}

function handleSignOut() {
    localStorage.removeItem('spit_current_user');
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('search-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('login-pass').value = '';
    document.getElementById('login-msg').classList.add('hidden');
}