// ================= GLOBAL VARIABLES =================
let activeChatId = null;
let activeMediaType = 'image';
let pendingImageData = null;
let replyingToMessage = null;
let viewingProfileUsername = null;
let activeCommentMedia = null;
let pendingPostImages = [];

// ================= LOCALSTORAGE HELPERS =================
function getUsers() {
    let users = localStorage.getItem('spit_users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('spit_users', JSON.stringify(users));
}

function getCurrentUserData() {
    let username = localStorage.getItem('spit_current_user');
    if (!username) return null;
    let users = getUsers();
    return users.find(u => u.username === username) || null;
}

function updateUserData(updatedUser) {
    let users = getUsers();
    let index = users.findIndex(u => u.username === updatedUser.username);
    if (index !== -1) {
        users[index] = updatedUser;
        saveUsers(users);
    }
}

function getGroups() {
    let groups = localStorage.getItem('spit_groups');
    return groups ? JSON.parse(groups) : [];
}

function saveGroups(groups) {
    localStorage.setItem('spit_groups', JSON.stringify(groups));
}

function getPosts() {
    let posts = localStorage.getItem('spit_posts');
    return posts ? JSON.parse(posts) : [];
}

function savePosts(posts) {
    localStorage.setItem('spit_posts', JSON.stringify(posts));
}

// ================= SCREEN NAVIGATION & SETTINGS =================
function hideSubScreens() {
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('search-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
}

function showDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    hideSubScreens();
    const user = getCurrentUserData();
    if (user) {
        document.getElementById('dash-display-name').innerText = user.displayName || user.username;
        document.getElementById('dash-role-tag').innerText = user.role || 'Thành viên';
        document.getElementById('highlight-name').innerText = user.displayName || user.username;
        
        const avatarEl = document.getElementById('dash-avatar');
        if (user.avatar) {
            avatarEl.innerHTML = `<img src="${user.avatar}" class="w-full h-full object-cover">`;
        } else {
            avatarEl.innerHTML = (user.displayName || user.username).charAt(0).toUpperCase();
        }
        updateNotificationBadge();
    }
}

function showSettingsScreen() {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('search-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.remove('hidden');
}

function setTheme(theme) {
    const body = document.getElementById('main-body');
    if (theme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
    }
    localStorage.setItem('spit_theme', theme);
}

function setCustomColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('spit_primary_color', color);
}

function resetToDefaultSettings() {
    setTheme('dark');
    setCustomColor('#00f2fe');
    localStorage.removeItem('spit_theme');
    localStorage.removeItem('spit_primary_color');
    alert('Đã khôi phục cài đặt gốc thành công!');
}

// Khởi chạy khi load trang
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('spit_current_user');
    const savedTheme = localStorage.getItem('spit_theme') || 'dark';
    const savedColor = localStorage.getItem('spit_primary_color') || '#00f2fe';

    setTheme(savedTheme);
    setCustomColor(savedColor);
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) colorPicker.value = savedColor;

    if (savedUser) {
        showDashboard();
    }
    initEmojiPicker();
});