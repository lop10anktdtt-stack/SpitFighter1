function updateNotificationBadge() {
    const user = getCurrentUserData();
    if (!user || !user.notifications) return;
    const unreadCount = user.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (unreadCount > 0) { badge.innerText = unreadCount; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
}

function toggleNotifDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) renderNotifications();
}

function renderNotifications() {
    const user = getCurrentUserData();
    const listEl = document.getElementById('notif-list');
    if (!user || !user.notifications || user.notifications.length === 0) {
        listEl.innerHTML = `<div class="p-4 text-center opacity-50 text-xs">Chưa có thông báo nào</div>`;
        return;
    }
    let html = '';
    user.notifications.forEach(n => n.read = true);
    updateUserData(user);
    updateNotificationBadge();

    user.notifications.slice().reverse().forEach(n => {
        if (n.type === 'friend_request') {
            if (n.status === 'accepted') html += `<div class="p-4 text-xs opacity-75">Đã chấp nhận kết bạn của @${n.sender}</div>`;
            else if (n.status === 'rejected') html += `<div class="p-4 text-xs opacity-75">Đã từ chối lời mời của @${n.sender}</div>`;
            else {
                html += `<div class="p-4 text-xs space-y-2"><p><b>@${n.sender}</b> muốn kết bạn.</p><div class="flex gap-2"><button onclick="acceptFriend('${n.sender}')" class="px-3 py-1 custom-primary-bg text-[#0b0f19] font-bold rounded-lg">Chấp nhận</button><button onclick="rejectFriend('${n.sender}')" class="px-3 py-1 bg-slate-500/20 font-bold rounded-lg">Từ chối</button></div></div>`;
            }
        } else if (n.type === 'group_invite') {
            if (n.status === 'accepted') html += `<div class="p-4 text-xs opacity-75">Bạn đã tham gia nhóm "${n.groupName}"</div>`;
            else if (n.status === 'rejected') html += `<div class="p-4 text-xs opacity-75">Bạn đã từ chối vào nhóm "${n.groupName}"</div>`;
            else {
                html += `<div class="p-4 text-xs space-y-2"><p><b>@${n.inviter}</b> mời bạn vào nhóm <b>${n.groupName}</b>.</p><div class="flex gap-2"><button onclick="acceptGroupInvite('${n.groupId}')" class="px-3 py-1 custom-primary-bg text-[#0b0f19] font-bold rounded-lg">Chấp nhận</button><button onclick="rejectGroupInvite('${n.groupId}')" class="px-3 py-1 bg-slate-500/20 font-bold rounded-lg">Từ chối</button></div></div>`;
            }
        } else if (n.type === 'friend_accepted') {
            html += `<div class="p-4 text-xs"><b>@${n.sender}</b> đã đồng ý kết bạn!</div>`;
        } else if (n.type === 'tag_mention') {
            html += `<div class="p-4 text-xs"><b>@${n.sender}</b> đã nhắc đến bạn: "${n.textSnippet}"</div>`;
        }
    });
    listEl.innerHTML = html;
}

function acceptFriend(senderUsername) {
    let currentUser = getCurrentUserData();
    let users = getUsers();
    let senderUser = users.find(u => u.username === senderUsername);
    if (!currentUser.friends) currentUser.friends = [];
    if (!currentUser.friends.includes(senderUsername)) currentUser.friends.push(senderUsername);
    currentUser.notifications.forEach(n => { if (n.sender === senderUsername) n.status = 'accepted'; });
    updateUserData(currentUser);
    if (senderUser) {
        if (!senderUser.friends) senderUser.friends = [];
        if (!senderUser.friends.includes(currentUser.username)) senderUser.friends.push(currentUser.username);
        senderUser.notifications.push({ type: 'friend_accepted', sender: currentUser.username, read: false });
        updateUserData(senderUser);
    }
    renderNotifications();
}

function rejectFriend(senderUsername) {
    let currentUser = getCurrentUserData();
    currentUser.notifications.forEach(n => { if (n.sender === senderUsername) n.status = 'rejected'; });
    updateUserData(currentUser);
    renderNotifications();
}

function acceptGroupInvite(groupId) {
    let currentUser = getCurrentUserData();
    let groups = getGroups();
    let g = groups.find(item => item.id === groupId);
    if (g && !g.members.includes(currentUser.username)) {
        g.members.push(currentUser.username);
        g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `✨ @${currentUser.username} đã tham gia nhóm.` });
        saveGroups(groups);
    }
    currentUser.notifications.forEach(n => { if (n.groupId === groupId) n.status = 'accepted'; });
    updateUserData(currentUser);
    renderNotifications();
    showChatScreen();
}

function rejectGroupInvite(groupId) {
    let currentUser = getCurrentUserData();
    currentUser.notifications.forEach(n => { if (n.groupId === groupId) n.status = 'rejected'; });
    updateUserData(currentUser);
    renderNotifications();
}

function showChatScreen() {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('search-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');

    const currentUser = getCurrentUserData();
    const friendsListEl = document.getElementById('chat-friends-list');
    if (!friendsListEl) return;
    
    let users = getUsers();
    let groups = getGroups().filter(g => g.members.includes(currentUser.username));

    let htmlChunks = [];

    groups.forEach(g => {
        let groupAvatarHtml = g.avatar ? `<img src="${g.avatar}" class="w-full h-full object-cover">` : '👥';
        htmlChunks.push(`
            <div onclick="openGroupChat('${g.id}')" class="p-3 flex items-center gap-3 hover:bg-slate-500/10 cursor-pointer transition-all ${activeChatId === g.id ? 'bg-slate-500/20 border-r-2 custom-primary-border' : ''}">
                <div class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black shrink-0 shadow overflow-hidden">${groupAvatarHtml}</div>
                <div class="overflow-hidden flex-1">
                    <h4 class="font-bold text-sm truncate">${g.name}</h4>
                    <p class="text-[10px] opacity-60">Nhóm chat (${g.members.length} thành viên)</p>
                </div>
            </div>
        `);
    });

    if (currentUser.friends && currentUser.friends.length > 0) {
        currentUser.friends.forEach(fUser => {
            let friend = users.find(u => u.username === fUser);
            if (!friend) return;
            let displayFriendName = currentUser.nicknames && currentUser.nicknames[friend.username] ? currentUser.nicknames[friend.username] : (friend.displayName || friend.username);
            const friendAvatar = friend.avatar ? `<img src="${friend.avatar}" class="w-full h-full object-cover">` : displayFriendName.charAt(0).toUpperCase();

            htmlChunks.push(`
                <div onclick="openChat('${friend.username}')" class="p-3 flex items-center gap-3 hover:bg-slate-500/10 cursor-pointer transition-all ${activeChatId === friend.username ? 'bg-slate-500/20 border-r-2 custom-primary-border' : ''}">
                    <div class="w-10 h-10 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shrink-0 shadow">
                        ${friendAvatar}
                    </div>
                    <div class="overflow-hidden flex-1">
                        <h4 class="font-bold text-sm truncate">${displayFriendName}</h4>
                    </div>
                </div>
            `);
        });
    }

    friendsListEl.innerHTML = htmlChunks.length > 0 ? htmlChunks.join('') : `<div class="p-6 text-center opacity-50 text-xs">Chưa có bạn bè hoặc nhóm chat</div>`;
}

function openChat(friendUsername) {
    activeChatId = friendUsername;
    let users = getUsers();
    let friend = users.find(u => u.username === friendUsername);
    if (!friend) return;
    const currentUser = getCurrentUserData();

    document.getElementById('chat-placeholder').classList.add('hidden');
    document.getElementById('chat-main-area').classList.remove('hidden');
    document.getElementById('chat-sidebar').classList.remove('hidden');

    let displayFriendName = currentUser.nicknames && currentUser.nicknames[friend.username] ? currentUser.nicknames[friend.username] : (friend.displayName || friend.username);
    const friendAvatar = friend.avatar ? `<img src="${friend.avatar}" class="w-full h-full object-cover">` : displayFriendName.charAt(0).toUpperCase();

    document.getElementById('active-chat-header').innerHTML = `
        <div class="flex items-center gap-3 cursor-pointer" onclick="viewUserProfile('${friend.username}')">
            <div class="w-10 h-10 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shrink-0 shadow border border-slate-500/30">
                ${friendAvatar}
            </div>
            <div>
                <h4 class="font-bold text-sm hover:underline">${displayFriendName}</h4>
                <p class="text-[10px] text-emerald-500">Đang hoạt động</p>
            </div>
        </div>
    `;
    
    const sidebarAvatarEl = document.getElementById('sidebar-avatar');
    sidebarAvatarEl.innerHTML = friend.avatar ? `<img src="${friend.avatar}" class="w-full h-full object-cover">` : displayFriendName.charAt(0).toUpperCase();
    document.getElementById('sidebar-name').innerText = displayFriendName;
    document.getElementById('sidebar-status').innerText = "Đang hoạt động";

    const chatKey = [currentUser.username, friend.username].sort().join('_');
    if(currentUser.messages && currentUser.messages[chatKey]) {
        currentUser.messages[chatKey].forEach(m => { if(m.sender !== currentUser.username) m.seen = true; });
        updateUserData(currentUser);
    }

    document.getElementById('sidebar-actions-container').innerHTML = `
        <p class="text-xs font-bold uppercase tracking-wider text-amber-500">Tùy chỉnh đoạn chat</p>
        <button onclick="openChangeNicknameModal()" class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-xs font-medium transition-colors text-left">✏️ Chỉnh sửa biệt hiệu</button>
        <label class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-xs font-medium transition-colors cursor-pointer">
            🎨 Thay đổi hình nền chat
            <input type="file" accept="image/*" class="hidden" onchange="handleChatBackgroundUpload(event)">
        </label>
        <p class="text-xs font-bold uppercase tracking-wider text-amber-500 pt-2">File và phương tiện</p>
        <button onclick="showSharedChatMedia()" class="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-500/10 text-xs font-medium transition-colors text-left">🖼️ Xem ảnh đã gửi trong đoạn chat</button>
    `;

    applyChatBackground(currentUser.chatBackgrounds && currentUser.chatBackgrounds[friendUsername] ? currentUser.chatBackgrounds[friendUsername] : null);

    showChatScreen();
    renderMessages();
}

function openGroupChat(groupId) {
    activeChatId = groupId;
    let groups = getGroups();
    let group = groups.find(g => g.id === groupId);
    if (!group) return;
    const currentUser = getCurrentUserData();

    if (!group.leader || !group.members.includes(group.leader)) {
        group.leader = group.members.includes('Tyrant') ? 'Tyrant' : group.members[0];
        saveGroups(groups);
    }

    document.getElementById('chat-placeholder').classList.add('hidden');
    document.getElementById('chat-main-area').classList.remove('hidden');
    document.getElementById('chat-sidebar').classList.remove('hidden');

    let groupAvatarDisplay = group.avatar ? `<img src="${group.avatar}" class="w-full h-full object-cover">` : '👥';

    document.getElementById('active-chat-header').innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow overflow-hidden">${groupAvatarDisplay}</div>
            <div>
                <h4 class="font-bold text-sm">${group.name}</h4>
                <p class="text-[10px] text-amber-400">${group.members.length} thành viên trong nhóm</p>
            </div>
        </div>
    `;

    let isLeader = group.leader === currentUser.username;
    let isCoLeader = group.coLeaders && group.coLeaders.includes(currentUser.username);

    let membersHtml = group.members.map(m => {
        let badge = m === group.leader ? '👑 Leader' : (group.coLeaders && group.coLeaders.includes(m) ? '⭐ Co-Leader' : 'Thành viên');
        let memberNickname = group.nicknames && group.nicknames[m] ? `(${group.nicknames[m]})` : '';
        
        let canKick = false;
        if (isLeader && m !== currentUser.username && m !== group.leader) canKick = true;
        if (isCoLeader && !group.coLeaders.includes(m) && m !== group.leader) canKick = true;
        let kickBtn = canKick ? `<button onclick="kickMember('${groupId}', '${m}')" class="text-rose-400 hover:underline text-[10px] font-bold">Kick</button>` : '';

        let promoteBtn = '';
        if (isLeader && m !== group.leader) {
            if (group.coLeaders && group.coLeaders.includes(m)) {
                promoteBtn = `<button onclick="demoteMember('${groupId}', '${m}')" class="text-amber-400 hover:underline text-[10px]">Giáng</button>`;
            } else {
                promoteBtn = `<button onclick="promoteMember('${groupId}', '${m}')" class="text-cyan-400 hover:underline text-[10px]">Thăng</button>`;
            }
        }

        let setNickBtn = `<button onclick="openGroupNicknameModal('${groupId}', '${m}')" class="text-xs hover:text-cyan-400" title="Đặt biệt hiệu">✏️</button>`;

        return `<div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-500/10">
            <span class="truncate max-w-[100px]">@${m} <span class="text-[10px] text-cyan-400">${memberNickname}</span> <span class="text-[9px] opacity-60">(${badge})</span></span> 
            <div class="flex items-center gap-1.5">${setNickBtn} ${promoteBtn} ${kickBtn}</div>
        </div>`;
    }).join('');

    let sidebarAvatarEl = document.getElementById('sidebar-avatar');
    sidebarAvatarEl.innerHTML = groupAvatarDisplay;
    document.getElementById('sidebar-name').innerText = group.name;
    document.getElementById('sidebar-status').innerText = `Nhóm chat (${group.members.length} thành viên)`;

    let addMemberBtn = (isLeader || isCoLeader) ? `<button onclick="openAddMemberModal('${groupId}')" class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-500/10 text-xs font-medium text-left">➕ Thêm thành viên</button>` : '';
    let changeGroupAvatarBtn = isLeader ? `<label class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-500/10 text-xs font-medium text-left cursor-pointer">🖼️ Đổi ảnh đại diện nhóm<input type="file" accept="image/*" class="hidden" onchange="handleGroupAvatarUpload(event, '${groupId}')"></label>` : '';

    document.getElementById('sidebar-actions-container').innerHTML = `
        <p class="text-xs font-bold uppercase tracking-wider text-amber-500">Quản trị nhóm</p>
        ${isLeader ? `<button onclick="document.getElementById('rename-group-modal').classList.remove('hidden')" class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-500/10 text-xs font-medium text-left">✏️ Đổi tên nhóm</button>` : ''}
        ${changeGroupAvatarBtn}
        ${addMemberBtn}
        <button onclick="openCreatePollModal()" class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-500/10 text-xs font-medium text-left">📊 Tạo bình chọn</button>
        <button onclick="showSharedChatMedia()" class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-500/10 text-xs font-medium text-left">🖼️ Kho ảnh/video trong nhóm</button>
        <button onclick="leaveGroup('${groupId}')" class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-500/20 text-rose-400 text-xs font-medium text-left">🚪 Rời khỏi nhóm</button>
        <p class="text-xs font-bold uppercase tracking-wider text-amber-500 pt-2">Thành viên (${group.members.length})</p>
        <div class="max-h-48 overflow-y-auto space-y-1 pr-1">${membersHtml}</div>
    `;

    applyChatBackground(null);
    showChatScreen();
    renderMessages();
}

function handleGroupAvatarUpload(e, groupId) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        let groups = getGroups();
        let g = groups.find(item => item.id === groupId);
        const currentUser = getCurrentUserData();
        if (g && g.leader === currentUser.username) {
            g.avatar = event.target.result;
            g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `🖼️ Trưởng nhóm đã thay đổi ảnh đại diện nhóm.` });
            saveGroups(groups);
            openGroupChat(groupId);
        }
    }
    reader.readAsDataURL(file);
}

function openGroupNicknameModal(groupId, targetUser) {
    activeChatId = groupId;
    window.targetNickUser = targetUser;
    document.getElementById('group-nickname-input').value = '';
    document.getElementById('group-nickname-modal').classList.remove('hidden');
}

function submitGroupNickname() {
    let newNick = document.getElementById('group-nickname-input').value.trim();
    let groups = getGroups();
    let g = groups.find(item => item.id === activeChatId);
    if (g && window.targetNickUser) {
        if (!g.nicknames) g.nicknames = {};
        g.nicknames[window.targetNickUser] = newNick;
        g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `✏️ Đã đặt biệt hiệu cho @${window.targetNickUser} thành "${newNick}"` });
        saveGroups(groups);
        document.getElementById('group-nickname-modal').classList.add('hidden');
        openGroupChat(activeChatId);
    }
}

function promoteMember(groupId, username) {
    let groups = getGroups();
    let g = groups.find(item => item.id === groupId);
    const currentUser = getCurrentUserData();
    if (g && g.leader === currentUser.username) {
        if (!g.coLeaders) g.coLeaders = [];
        if (!g.coLeaders.includes(username)) {
            g.coLeaders.push(username);
            g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `⭐ @${username} đã được thăng chức lên làm Co-Leader.` });
            saveGroups(groups);
            openGroupChat(groupId);
        }
    }
}

function demoteMember(groupId, username) {
    let groups = getGroups();
    let g = groups.find(item => item.id === groupId);
    const currentUser = getCurrentUserData();
    if (g && g.leader === currentUser.username) {
        if (g.coLeaders) {
            g.coLeaders = g.coLeaders.filter(m => m !== username);
            g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `🔻 @${username} đã bị giáng chức xuống thành viên.` });
            saveGroups(groups);
            openGroupChat(groupId);
        }
    }
}

function leaveGroup(groupId) {
    let groups = getGroups();
    let g = groups.find(item => item.id === groupId);
    const currentUser = getCurrentUserData();
    if (!g) return;

    if (g.leader === currentUser.username) {
        let otherMembers = g.members.filter(m => m !== currentUser.username);
        if (otherMembers.length > 0) {
            if (g.coLeaders && g.coLeaders.length > 0) {
                g.leader = g.coLeaders[0];
                g.coLeaders = g.coLeaders.filter(m => m !== g.leader);
            } else {
                g.leader = otherMembers[0];
            }
            g.members = otherMembers;
            g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `👑 Trưởng nhóm @${currentUser.username} đã rời đi. Quyền Leader đã chuyển giao cho @${g.leader}.` });
            saveGroups(groups);
        } else {
            saveGroups(groups.filter(item => item.id !== groupId));
        }
    } else {
        g.members = g.members.filter(m => m !== currentUser.username);
        if (g.coLeaders) g.coLeaders = g.coLeaders.filter(m => m !== currentUser.username);
        g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `🚪 @${currentUser.username} đã rời khỏi nhóm.` });
        saveGroups(groups);
    }

    activeChatId = null;
    document.getElementById('chat-main-area').classList.add('hidden');
    document.getElementById('chat-sidebar').classList.add('hidden');
    document.getElementById('chat-placeholder').classList.remove('hidden');
    showChatScreen();
}

function kickMember(groupId, username) {
    let groups = getGroups();
    let g = groups.find(item => item.id === groupId);
    const currentUser = getCurrentUserData();
    if (!g) return;

    let isLeader = g.leader === currentUser.username;
    let isCoLeader = g.coLeaders && g.coLeaders.includes(currentUser.username);
    let targetIsCoLeader = g.coLeaders && g.coLeaders.includes(username);
    let targetIsLeader = g.leader === username;

    if (targetIsLeader) return;
    if (isCoLeader && targetIsCoLeader) return;

    g.members = g.members.filter(m => m !== username);
    if (g.coLeaders) g.coLeaders = g.coLeaders.filter(m => m !== username);
    g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `👢 @${username} đã bị đưa ra khỏi nhóm bởi @${currentUser.username}.` });
    saveGroups(groups);
    openGroupChat(groupId);
}

function openAddMemberModal(groupId) {
    activeChatId = groupId;
    document.getElementById('add-member-search').value = '';
    renderAddMemberSelection(groupId);
    document.getElementById('add-member-modal').classList.remove('hidden');
}

function renderAddMemberSelection(groupId) {
    const keyword = document.getElementById('add-member-search') ? document.getElementById('add-member-search').value.trim().toLowerCase() : '';
    const users = getUsers();
    const currentUser = getCurrentUserData();
    let groups = getGroups();
    let g = groups.find(item => item.id === groupId);
    if (!g) return;
    const container = document.getElementById('add-member-checkboxes');

    let filtered = users.filter(u => !g.members.includes(u.username) && (u.username.toLowerCase().includes(keyword) || (u.displayName || '').toLowerCase().includes(keyword)));

    let html = '';
    filtered.forEach(u => {
        let name = u.displayName || u.username;
        let avatarHtml = u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover">` : name.charAt(0).toUpperCase();
        let isFriend = currentUser.friends && currentUser.friends.includes(u.username);
        let badge = isFriend ? `<span class="text-[10px] text-emerald-400 font-bold ml-1">(Bạn bè)</span>` : `<span class="text-[10px] text-amber-400 font-bold ml-1">(Người ngoài - Gửi lời mời)</span>`;

        html += `
            <label class="flex items-center gap-3 text-xs cursor-pointer bg-slate-500/10 p-2 rounded-xl hover:bg-slate-500/20">
                <div class="w-8 h-8 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shrink-0">
                    ${avatarHtml}
                </div>
                <div class="flex-1">
                    <span class="font-bold">${name}</span> @${u.username} ${badge}
                </div>
                <input type="checkbox" value="${u.username}" class="add-member-checkbox">
            </label>
        `;
    });
    container.innerHTML = html || '<p class="text-xs opacity-50 text-center py-2">Không tìm thấy người dùng phù hợp hoặc đã ở trong nhóm.</p>';
}

function submitAddMembers() {
    const checkboxes = document.querySelectorAll('.add-member-checkbox:checked');
    if (checkboxes.length === 0) { alert('Vui lòng chọn ít nhất một thành viên!'); return; }
    let groups = getGroups();
    let g = groups.find(item => item.id === activeChatId);
    if (!g) return;

    let currentUser = getCurrentUserData();
    let users = getUsers();

    checkboxes.forEach(cb => {
        let username = cb.value;
        if (currentUser.friends && currentUser.friends.includes(username)) {
            if (!g.members.includes(username)) {
                g.members.push(username);
                g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `✨ @${username} đã được @${currentUser.username} thêm vào nhóm.` });
            }
        } else {
            let target = users.find(u => u.username === username);
            if (target) {
                if (!target.notifications) target.notifications = [];
                target.notifications.push({
                    type: 'group_invite',
                    groupId: g.id,
                    groupName: g.name,
                    inviter: currentUser.username,
                    status: 'pending',
                    read: false
                });
            }
        }
    });

    saveGroups(groups);
    saveUsers(users);
    document.getElementById('add-member-modal').classList.add('hidden');
    openGroupChat(g.id);
}

function applyChatBackground(bgUrl) {
    const chatMainArea = document.getElementById('chat-main-area');
    if (bgUrl) chatMainArea.style.backgroundImage = `url('${bgUrl}')`;
    else chatMainArea.style.backgroundImage = 'none';
}

function handleChatBackgroundUpload(e) {
    const file = e.target.files[0];
    if (!file || !activeChatId || activeChatId.startsWith('group_')) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        let currentUser = getCurrentUserData();
        if (!currentUser.chatBackgrounds) currentUser.chatBackgrounds = {};
        currentUser.chatBackgrounds[activeChatId] = event.target.result;
        updateUserData(currentUser);
        applyChatBackground(event.target.result);
    }
    reader.readAsDataURL(file);
}

function openCreateGroupModal() {
    document.getElementById('group-name-input').value = '';
    document.getElementById('group-user-search').value = '';
    renderGroupMemberSelection();
    document.getElementById('create-group-modal').classList.remove('hidden');
}

function renderGroupMemberSelection() {
    const keyword = document.getElementById('group-user-search') ? document.getElementById('group-user-search').value.trim().toLowerCase() : '';
    const users = getUsers();
    const currentUser = getCurrentUserData();
    const container = document.getElementById('group-members-checkboxes');

    let filtered = users.filter(u => u.username !== currentUser.username && (u.username.toLowerCase().includes(keyword) || (u.displayName || '').toLowerCase().includes(keyword)));

    let html = '';
    filtered.forEach(u => {
        let name = u.displayName || u.username;
        let avatarHtml = u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover">` : name.charAt(0).toUpperCase();
        let isFriend = currentUser.friends && currentUser.friends.includes(u.username);
        let badge = isFriend ? `<span class="text-[10px] text-emerald-400 font-bold ml-1">(Bạn bè)</span>` : `<span class="text-[10px] text-amber-400 font-bold ml-1">(Người ngoài - Gửi lời mời)</span>`;

        html += `
            <label class="flex items-center gap-3 text-xs cursor-pointer bg-slate-500/10 p-2 rounded-xl hover:bg-slate-500/20">
                <div class="w-8 h-8 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shrink-0">
                    ${avatarHtml}
                </div>
                <div class="flex-1">
                    <span class="font-bold">${name}</span> @${u.username} ${badge}
                </div>
                <input type="checkbox" value="${u.username}" class="group-member-checkbox">
            </label>
        `;
    });
    container.innerHTML = html || '<p class="text-xs opacity-50 text-center py-2">Không tìm thấy người dùng phù hợp.</p>';
}

function submitCreateGroup() {
    const groupName = document.getElementById('group-name-input').value.trim();
    if (!groupName) { alert('Vui lòng nhập tên nhóm!'); return; }
    const checkboxes = document.querySelectorAll('.group-member-checkbox:checked');
    let currentUser = getCurrentUserData();
    let members = [currentUser.username];
    let outsiders = [];

    checkboxes.forEach(cb => {
        let username = cb.value;
        if (currentUser.friends && currentUser.friends.includes(username)) {
            members.push(username);
        } else {
            outsiders.push(username);
        }
    });

    let groups = getGroups();
    const newGroupId = 'group_' + Date.now();
    groups.push({
        id: newGroupId,
        name: groupName,
        leader: currentUser.username,
        coLeaders: [],
        members: members,
        messages: [{ sender: 'system', type: 'system', time: Date.now(), text: `✨ Nhóm "${groupName}" đã được tạo bởi @${currentUser.username}` }]
    });
    saveGroups(groups);

    let users = getUsers();
    outsiders.forEach(outUser => {
        let target = users.find(u => u.username === outUser);
        if (target) {
            if (!target.notifications) target.notifications = [];
            target.notifications.push({
                type: 'group_invite',
                groupId: newGroupId,
                groupName: groupName,
                inviter: currentUser.username,
                status: 'pending',
                read: false
            });
        }
    });
    saveUsers(users);

    document.getElementById('create-group-modal').classList.add('hidden');
    openGroupChat(newGroupId);
}

function submitRenameGroup() {
    let newName = document.getElementById('rename-group-input').value.trim();
    if(!newName || !activeChatId || !activeChatId.startsWith('group_')) return;
    let groups = getGroups();
    let g = groups.find(item => item.id === activeChatId);
    if(g) {
        g.name = newName;
        g.messages.push({ sender: 'system', type: 'system', time: Date.now(), text: `✏️ Tên nhóm đã được đổi thành "${newName}"` });
        saveGroups(groups);
        document.getElementById('rename-group-modal').classList.add('hidden');
        openGroupChat(activeChatId);
    }
}

function openCreatePollModal() {
    document.getElementById('poll-question-input').value = '';
    document.querySelectorAll('.poll-option-input').forEach(i => i.value = '');
    document.getElementById('create-poll-modal').classList.remove('hidden');
}

function submitCreatePoll() {
    let question = document.getElementById('poll-question-input').value.trim();
    let optionInputs = document.querySelectorAll('.poll-option-input');
    let options = [];
    optionInputs.forEach(i => { if(i.value.trim()) options.push({ text: i.value.trim(), votes: [] }); });

    if(!question || options.length < 2) { alert('Vui lòng nhập câu hỏi và ít nhất 2 lựa chọn!'); return; }

    let groups = getGroups();
    let g = groups.find(item => item.id === activeChatId);
    if(g) {
        g.messages.push({
            sender: getCurrentUserData().username,
            type: 'poll',
            time: Date.now(),
            question: question,
            options: options
        });
        saveGroups(groups);
        document.getElementById('create-poll-modal').classList.add('hidden');
        renderMessages();
    }
}

function votePoll(groupId, pollIndex, optionIndex) {
    let groups = getGroups();
    let g = groups.find(item => item.id === groupId);
    const currentUser = getCurrentUserData();
    if(g) {
        let msg = g.messages[pollIndex];
        if(msg && msg.type === 'poll') {
            msg.options.forEach(opt => {
                opt.votes = opt.votes.filter(v => v !== currentUser.username);
            });
            msg.options[optionIndex].votes.push(currentUser.username);
            saveGroups(groups);
            renderMessages();
        }
    }
}

function openChangeNicknameModal() {
    if (!activeChatId) return;
    if (activeChatId.startsWith('group_')) return;
    document.getElementById('nickname-input').value = '';
    document.getElementById('nickname-modal').classList.remove('hidden');
}

function submitNickname() {
    const newNickname = document.getElementById('nickname-input').value.trim();
    if (!newNickname || !activeChatId) return;
    let currentUser = getCurrentUserData();
    if (!currentUser.nicknames) currentUser.nicknames = {};
    currentUser.nicknames[activeChatId] = newNickname;
    updateUserData(currentUser);

    let users = getUsers();
    let u1 = users.find(u => u.username === currentUser.username);
    let u2 = users.find(u => u.username === activeChatId);
    const chatKey = [u1.username, u2.username].sort().join('_');

    if (!u1.messages) u1.messages = {};
    if (!u1.messages[chatKey]) u1.messages[chatKey] = [];
    if (!u2.messages) u2.messages = {};
    if (!u2.messages[chatKey]) u2.messages[chatKey] = [];

    const sysMsg = { sender: 'system', type: 'system', time: Date.now(), text: `✨ ${currentUser.displayName || currentUser.username} đã đặt biệt hiệu mới cho ${newNickname}` };
    u1.messages[chatKey].push(sysMsg);
    u2.messages[chatKey].push(sysMsg);
    saveUsers(users);

    document.getElementById('nickname-modal').classList.add('hidden');
    openChat(activeChatId);
}

function reactMessage(msgIndex, emoji) {
    const currentUser = getCurrentUserData();
    if (activeChatId.startsWith('group_')) {
        let groups = getGroups();
        let g = groups.find(item => item.id === activeChatId);
        if (g && g.messages[msgIndex]) {
            if (!g.messages[msgIndex].reactions) g.messages[msgIndex].reactions = {};
            g.messages[msgIndex].reactions[currentUser.username] = emoji;
            saveGroups(groups);
            renderMessages();
        }
    } else {
        let users = getUsers();
        let u1 = users.find(u => u.username === currentUser.username);
        let u2 = users.find(u => u.username === activeChatId);
        const chatKey = [u1.username, u2.username].sort().join('_');
        if (u1.messages && u1.messages[chatKey] && u1.messages[chatKey][msgIndex]) {
            if (!u1.messages[chatKey][msgIndex].reactions) u1.messages[chatKey][msgIndex].reactions = {};
            u1.messages[chatKey][msgIndex].reactions[currentUser.username] = emoji;
            if (u2.messages && u2.messages[chatKey] && u2.messages[chatKey][msgIndex]) {
                if (!u2.messages[chatKey][msgIndex].reactions) u2.messages[chatKey][msgIndex].reactions = {};
                u2.messages[chatKey][msgIndex].reactions[currentUser.username] = emoji;
            }
            saveUsers(users);
            renderMessages();
        }
    }
}

function setReplyMessage(msgIndex, previewText) {
    replyingToMessage = { index: msgIndex, text: previewText };
    document.getElementById('reply-preview-text').innerText = previewText;
    document.getElementById('reply-preview-container').classList.remove('hidden');
    document.getElementById('message-input').focus();
}

function cancelReply() {
    replyingToMessage = null;
    document.getElementById('reply-preview-container').classList.add('hidden');
}

function renderMessages() {
    const currentUser = getCurrentUserData();
    const listEl = document.getElementById('message-list');
    let msgs = [];
    let users = getUsers();
    let currentGroup = null;

    if (activeChatId.startsWith('group_')) {
        let groups = getGroups();
        currentGroup = groups.find(item => item.id === activeChatId);
        msgs = currentGroup ? currentGroup.messages : [];
    } else {
        const chatKey = [currentUser.username, activeChatId].sort().join('_');
        if (!currentUser.messages) currentUser.messages = {};
        msgs = currentUser.messages[chatKey] || [];
    }

    let htmlChunks = [];
    let lastTime = 0;

    msgs.forEach((m, mIndex) => {
        if (m.type === 'system') {
            htmlChunks.push(`<div class="text-center text-[11px] opacity-60 py-1 italic">${m.text}</div>`);
            return;
        }

        let msgTime = m.time || Date.now();
        if (msgTime - lastTime >= 10 * 60 * 1000) {
            let timeStr = new Date(msgTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            htmlChunks.push(`<div class="text-center text-[10px] opacity-50 py-2 font-mono">${timeStr}</div>`);
        }
        lastTime = msgTime;

        const isMe = m.sender === currentUser.username;
        let senderObj = users.find(u => u.username === m.sender);
        
        let senderDisplayName = senderObj ? (senderObj.displayName || senderObj.username) : m.sender;
        if (currentGroup && currentGroup.nicknames && currentGroup.nicknames[m.sender]) {
            senderDisplayName = currentGroup.nicknames[m.sender];
        }

        let senderAvatar = senderObj && senderObj.avatar ? `<img src="${senderObj.avatar}" class="w-full h-full object-cover">` : (m.sender ? m.sender.charAt(0).toUpperCase() : '?');

        let content = '';
        let replyHtml = '';
        if (m.replyTo !== undefined && msgs[m.replyTo]) {
            let originMsg = msgs[m.replyTo];
            let originText = originMsg.type === 'image' ? '[Hình ảnh]' : (originMsg.type === 'video' ? '[Video]' : originMsg.text);
            replyHtml = `<div class="text-[11px] opacity-75 border-l-2 border-current pl-2 mb-1 truncate max-w-xs">↳ Trả lời: ${originText}</div>`;
        }

        if (m.type === 'image') {
            content = `${replyHtml}<img src="${m.text}" loading="lazy" onclick="openImageViewer(this.src)" class="max-w-[220px] sm:max-w-sm rounded-2xl shadow-lg border border-slate-500/30 cursor-zoom-in">`;
        } else if (m.type === 'video') {
            content = `${replyHtml}<video src="${m.text}" controls class="max-w-[220px] sm:max-w-sm rounded-2xl shadow-lg border border-slate-500/30"></video>`;
        } else if (m.type === 'poll') {
            let totalVotes = 0;
            m.options.forEach(o => totalVotes += o.votes.length);
            let optionsHtml = m.options.map((opt, optIdx) => {
                let voted = opt.votes.includes(currentUser.username);
                return `<div onclick="votePoll('${activeChatId}', ${mIndex}, ${optIdx})" class="p-2 rounded-xl text-xs cursor-pointer border ${voted ? 'custom-primary-border bg-cyan-500/20 font-bold' : 'border-slate-500/30 bg-slate-500/10'} flex justify-between items-center"><span>${opt.text}</span> <span class="text-[10px] opacity-75">${opt.votes.length} vote</span></div>`;
            }).join('');

            content = `${replyHtml}<div class="space-y-2 min-w-[200px]"><p class="font-bold text-xs">📊 ${m.question}</p><div class="space-y-1.5">${optionsHtml}</div><p class="text-[9px] opacity-60 text-right">Tổng: ${totalVotes} lượt</p></div>`;
        } else {
            content = `${replyHtml}<span class="break-words leading-relaxed">${m.text}</span>`;
        }

        let reactionsHtml = '';
        if (m.reactions && Object.keys(m.reactions).length > 0) {
            let emojiCounts = {};
            for(let user in m.reactions) {
                let em = m.reactions[user];
                emojiCounts[em] = (emojiCounts[em] || 0) + 1;
            }
            let badges = '';
            for(let em in emojiCounts) {
                badges += `<span class="bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded-full border border-slate-600 shadow">${em} ${emojiCounts[em] > 1 ? emojiCounts[em] : ''}</span>`;
            }
            reactionsHtml = `<div class="absolute -bottom-2 ${isMe ? 'right-2' : 'left-2'} flex gap-1 z-20">${badges}</div>`;
        }

        let statusText = isMe ? `<span class="text-[9px] opacity-60 block text-right mt-0.5">${m.seen ? 'Đã xem' : 'Đã gửi'}</span>` : '';
        let senderNameLabel = !isMe && currentGroup ? `<p class="text-[10px] font-bold custom-primary-text mb-1">${senderDisplayName}</p>` : '';

        htmlChunks.push(`
            <div class="flex items-end gap-2 group/msg relative pb-3 ${isMe ? 'justify-end' : 'justify-start'}">
                ${!isMe ? `<div class="w-7 h-7 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shrink-0 shadow">${senderAvatar}</div>` : ''}
                
                <div class="absolute bottom-1 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} hidden group-hover/msg:flex items-center gap-1 bg-slate-900/95 border border-slate-700 px-2 py-1 rounded-full shadow-2xl z-30">
                    <button onclick="reactMessage(${mIndex}, '👍')" class="hover:scale-125 transition-transform text-sm" title="Thích">👍</button>
                    <button onclick="reactMessage(${mIndex}, '❤️')" class="hover:scale-125 transition-transform text-sm" title="Yêu thích">❤️</button>
                    <button onclick="reactMessage(${mIndex}, '😂')" class="hover:scale-125 transition-transform text-sm" title="Haha">😂</button>
                    <button onclick="reactMessage(${mIndex}, '😮')" class="hover:scale-125 transition-transform text-sm" title="Wow">😮</button>
                    <button onclick="setReplyMessage(${mIndex}, '${(m.text || '').replace(/'/g, "\\'")}')" class="hover:scale-125 transition-transform text-xs font-bold px-1 text-cyan-400" title="Trả lời">Reply</button>
                </div>

                <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] relative">
                    ${senderNameLabel}
                    <div class="px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'custom-primary-bg text-[#0b0f19] font-medium rounded-br-none shadow-md' : 'bg-slate-500/20 rounded-bl-none shadow-md'}">
                        ${content}
                    </div>
                    ${reactionsHtml}
                    ${statusText}
                </div>
            </div>
        `);
    });
    listEl.innerHTML = htmlChunks.join('') || `<div class="text-center opacity-50 text-xs h-full flex items-center justify-center">Chưa có tin nhắn nào. Bắt đầu TalkShit ngay!</div>`;
    setTimeout(() => { listEl.scrollTop = listEl.scrollHeight; }, 10);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    activeMediaType = file.type.startsWith('video') ? 'video' : 'image';
    const reader = new FileReader();
    reader.onload = function(event) {
        pendingImageData = event.target.result;
        if(activeMediaType === 'video') {
            document.getElementById('preview-img-tag').src = '';
        } else {
            document.getElementById('preview-img-tag').src = pendingImageData;
        }
        document.getElementById('image-preview-container').classList.remove('hidden');
    }
    reader.readAsDataURL(file);
}

function cancelImagePreview() {
    pendingImageData = null;
    document.getElementById('image-preview-container').classList.add('hidden');
}

function initEmojiPicker() {
    const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾","👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦿","🦶","👂","🦻","👃","🧠","👁️","👅","👄","💋","🔥","⭐","✨","💫","💥","💢","💦","💨","💬","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","💖","💘","💝","💯"];
    const picker = document.getElementById('emoji-picker-container');
    if (!picker) return;
    let html = '';
    emojis.forEach(e => {
        html += `<button type="button" onclick="insertEmoji('${e}')" class="hover:scale-125 transition-transform">${e}</button>`;
    });
    picker.innerHTML = html;
}

function toggleEmojiPicker() { document.getElementById('emoji-picker-container').classList.toggle('hidden'); }
function insertEmoji(emoji) {
    const input = document.getElementById('message-input');
    input.value += emoji;
    input.focus();
}

function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text && !pendingImageData) return;
    if (!activeChatId) return;

    const currentUser = getCurrentUserData();
    const timeNow = Date.now();
    let replyToIndex = replyingToMessage ? replyingToMessage.index : undefined;

    parseAndSendTagNotifications(text, currentUser.username);

    if (activeChatId.startsWith('group_')) {
        let groups = getGroups();
        let g = groups.find(item => item.id === activeChatId);
        if (g) {
            if (pendingImageData) {
                g.messages.push({ sender: currentUser.username, type: activeMediaType, time: timeNow, seen: true, text: pendingImageData, replyTo: replyToIndex });
                cancelImagePreview();
            }
            if (text) {
                g.messages.push({ sender: currentUser.username, type: 'text', time: timeNow, seen: true, text: text, replyTo: replyToIndex });
                input.value = '';
            }
            cancelReply();
            saveGroups(groups);
            renderMessages();
        }
    } else {
        let users = getUsers();
        let u1 = users.find(u => u.username === currentUser.username);
        let u2 = users.find(u => u.username === activeChatId);
        const chatKey = [u1.username, u2.username].sort().join('_');

        if (!u1.messages) u1.messages = {};
        if (!u1.messages[chatKey]) u1.messages[chatKey] = [];
        if (!u2.messages) u2.messages = {};
        if (!u2.messages[chatKey]) u2.messages[chatKey] = [];

        if (pendingImageData) {
            const newMediaMsg = { sender: u1.username, type: activeMediaType, time: timeNow, seen: false, text: pendingImageData, replyTo: replyToIndex };
            u1.messages[chatKey].push(newMediaMsg);
            u2.messages[chatKey].push(newMediaMsg);
            cancelImagePreview();
        }

        if (text) {
            const newTextMsg = { sender: u1.username, type: 'text', time: timeNow, seen: false, text: text, replyTo: replyToIndex };
            u1.messages[chatKey].push(newTextMsg);
            u2.messages[chatKey].push(newTextMsg);
            input.value = '';
        }

        cancelReply();
        saveUsers(users);
        renderMessages();
    }
}

function showSharedChatMedia() {
    let msgs = [];
    let currentUser = getCurrentUserData();

    if (activeChatId.startsWith('group_')) {
        let groups = getGroups();
        let g = groups.find(item => item.id === activeChatId);
        msgs = g ? g.messages : [];
    } else {
        const chatKey = [currentUser.username, activeChatId].sort().join('_');
        msgs = currentUser.messages && currentUser.messages[chatKey] ? currentUser.messages[chatKey] : [];
    }

    const images = msgs.filter(m => m.type === 'image');
    let grouped = {};
    images.forEach(img => {
        let dateStr = new Date(img.time || Date.now()).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(img.text);
    });

    let html = '';
    if (Object.keys(grouped).length === 0) {
        html = '<p class="text-xs opacity-50 text-center py-8">Chưa có ảnh nào được gửi trong đoạn chat này.</p>';
    } else {
        for (let date in grouped) {
            html += `
                <div class="space-y-3">
                    <h4 class="text-xs font-bold custom-primary-text border-b border-slate-500/20 pb-1 uppercase">📅 Ngày ${date}</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        ${grouped[date].map(src => `<img src="${src}" onclick="openImageViewer(this.src)" class="w-full h-36 object-cover rounded-2xl cursor-zoom-in border border-slate-700/50 shadow-md hover:scale-105 transition-transform">`).join('')}
                    </div>
                </div>
            `;
        }
    }

    document.getElementById('shared-media-content').innerHTML = html;
    document.getElementById('shared-media-modal').classList.remove('hidden');
}

// --- HỆ THỐNG TAG TÊN VÀ GỬI THÔNG BÁO ---
function parseAndSendTagNotifications(text, senderUsername) {
    if (!text) return;
    const tagRegex = /@([a-zA-Z0-9_]+)/g;
    let matches;
    let users = getUsers();
    let hasNewNotif = false;

    while ((matches = tagRegex.exec(text)) !== null) {
        let taggedUsername = matches[1];
        if (taggedUsername === senderUsername) continue;

        let targetUser = users.find(u => u.username === taggedUsername);
        if (targetUser) {
            if (!targetUser.notifications) targetUser.notifications = [];
            targetUser.notifications.push({
                type: 'tag_mention',
                sender: senderUsername,
                textSnippet: text.substring(0, 50) + '...',
                time: Date.now(),
                read: false
            });
            hasNewNotif = true;
        }
    }

    if (hasNewNotif) {
        saveUsers(users);
    }
}

// --- KHỞI TẠO NAVBAR & MỤC "CÁC TRẬN ĐẤU" ---
function renderNavbarMenu() {
    const navContainer = document.getElementById('navbar-menu-items');
    if (!navContainer) return;

    navContainer.innerHTML = `
        <button onclick="switchMainTab('battlers')" class="font-bold text-xs hover:text-cyan-400 transition-colors uppercase tracking-wider">Battlers</button>
        <button onclick="switchMainTab('news')" class="font-bold text-xs hover:text-cyan-400 transition-colors uppercase tracking-wider">Tin battle mới</button>
        <button onclick="switchMainTab('encyclopedia')" class="font-bold text-xs hover:text-cyan-400 transition-colors uppercase tracking-wider">Battle toàn thư</button>
        <button onclick="switchMainTab('matches')" class="font-bold text-xs hover:text-cyan-400 transition-colors uppercase tracking-wider custom-primary-text">Các trận đấu</button>
    `;
}

function getMatchesData() {
    return JSON.parse(localStorage.getItem('talkshit_matches')) || [];
}

function saveMatchesData(matches) {
    localStorage.setItem('talkshit_matches', JSON.stringify(matches));
}

function renderMatchesScreen() {
    const currentUser = getCurrentUserData();
    const isAdmin = currentUser && currentUser.role === 'Admin';
    const container = document.getElementById('main-content-container');
    if (!container) return;

    let matches = getMatchesData();
    let adminControlHtml = isAdmin ? `
        <div class="mb-6 flex justify-between items-center bg-slate-500/10 p-4 rounded-2xl border border-cyan-500/30">
            <span class="text-xs font-bold text-cyan-400">🛡️ Bảng điều khiển Admin</span>
            <button onclick="openAdminMatchModal()" class="px-4 py-2 custom-primary-bg text-[#0b0f19] font-black rounded-xl text-xs uppercase shadow">+ Thêm Trận Đấu Mới</button>
        </div>
    ` : '';

    let matchesHtml = '';
    if (matches.length === 0) {
        matchesHtml = `<p class="text-xs opacity-50 text-center py-12">Chưa có sự kiện trận đấu nào được cập nhật.</p>`;
    } else {
        matches.forEach((m, index) => {
            let avatar1 = m.avatar1 ? `<img src="${m.avatar1}" class="w-full h-full object-cover">` : '⚔️';
            let avatar2 = m.avatar2 ? `<img src="${m.avatar2}" class="w-full h-full object-cover">` : '⚔️';

            let editDeleteBtns = isAdmin ? `
                <div class="absolute top-3 right-3 flex gap-2 z-10">
                    <button onclick="editMatch(${index})" class="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold">Sửa</button>
                    <button onclick="deleteMatch(${index})" class="px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold">Xóa</button>
                </div>
            ` : '';

            matchesHtml += `
                <div class="custom-card relative p-6 rounded-3xl border border-slate-700/50 shadow-2xl mb-6 space-y-4">
                    ${editDeleteBtns}
                    <h3 class="text-center font-black text-sm uppercase tracking-wider text-amber-400">${m.title}</h3>
                    
                    <div class="flex items-center justify-center gap-6 sm:gap-12 py-4">
                        <div class="flex flex-col items-center space-y-2">
                            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shadow-xl border-2 border-cyan-400/50">
                                ${avatar1}
                            </div>
                            <span class="font-black text-xs text-cyan-300">@${m.user1}</span>
                        </div>

                        <div class="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black flex items-center justify-center text-sm shadow-lg rotate-12">
                            VS
                        </div>

                        <div class="flex flex-col items-center space-y-2">
                            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shadow-xl border-2 border-cyan-400/50">
                                ${avatar2}
                            </div>
                            <span class="font-black text-xs text-cyan-300">@${m.user2}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = `
        <div class="max-w-2xl mx-auto p-4">
            <h2 class="font-black text-lg uppercase tracking-wider mb-4 text-center custom-primary-text">Danh Sách Trận Đấu Spit Fighter</h2>
            ${adminControlHtml}
            <div class="space-y-4">${matchesHtml}</div>
        </div>
    `;
}

function openAdminMatchModal(index = null) {
    const currentUser = getCurrentUserData();
    if (!currentUser || currentUser.role !== 'Admin') {
        alert('Bạn không có quyền thực hiện thao tác này!');
        return;
    }

    document.getElementById('admin-match-id').value = index !== null ? index : '';
    document.getElementById('match-title-input').value = '';
    document.getElementById('match-b1-user').value = '';
    document.getElementById('match-b2-user').value = '';
    document.getElementById('match-b1-file').value = '';
    document.getElementById('match-b2-file').value = '';

    if (index !== null) {
        let matches = getMatchesData();
        let m = matches[index];
        document.getElementById('match-title-input').value = m.title;
        document.getElementById('match-b1-user').value = m.user1;
        document.getElementById('match-b2-user').value = m.user2;
    }

    document.getElementById('match-admin-modal').classList.remove('hidden');
}

function submitSaveMatch() {
    let index = document.getElementById('admin-match-id').value;
    let title = document.getElementById('match-title-input').value.trim();
    let user1 = document.getElementById('match-b1-user').value.trim();
    let user2 = document.getElementById('match-b2-user').value.trim();

    if (!title || !user1 || !user2) {
        alert('Vui lòng điền đầy đủ tiêu đề và tên 2 battlers!');
        return;
    }

    let matches = getMatchesData();
    let file1Input = document.getElementById('match-b1-file').files[0];
    let file2Input = document.getElementById('match-b2-file').files[0];

    let processSave = (img1, img2) => {
        let matchObj = {
            title: title,
            user1: user1,
            user2: user2,
            avatar1: img1 || (index !== '' ? matches[index].avatar1 : ''),
            avatar2: img2 || (index !== '' ? matches[index].avatar2 : '')
        };

        if (index !== '') {
            matches[index] = matchObj;
        } else {
            matches.unshift(matchObj);
        }

        saveMatchesData(matches);
        document.getElementById('match-admin-modal').classList.add('hidden');
        renderMatchesScreen();

        parseAndSendTagNotifications(`@${user1} và @${user2} vừa được Admin xếp lịch thi đấu trong sự kiện: ${title}`, 'Admin');
    };

    if (file1Input) {
        let reader1 = new FileReader();
        reader1.onload = function(e1) {
            let res1 = e1.target.result;
            if (file2Input) {
                let reader2 = new FileReader();
                reader2.onload = function(e2) { processSave(res1, e2.target.result); };
                reader2.readAsDataURL(file2Input);
            } else {
                processSave(res1, null);
            }
        };
        reader1.readAsDataURL(file1Input);
    } else if (file2Input) {
        let reader2 = new FileReader();
        reader2.onload = function(e2) { processSave(null, e2.target.result); };
        reader2.readAsDataURL(file2Input);
    } else {
        processSave(null, null);
    }
}

function deleteMatch(index) {
    if (confirm('Bạn có chắc muốn xóa trận đấu này không?')) {
        let matches = getMatchesData();
        matches.splice(index, 1);
        saveMatchesData(matches);
        renderMatchesScreen();
    }
}

function editMatch(index) {
    openAdminMatchModal(index);
}

function switchMainTab(tabName) {
    if (tabName === 'matches') {
        renderMatchesScreen();
    } else {
        const container = document.getElementById('main-content-container');
        if (container) {
            container.innerHTML = `<div class="p-12 text-center opacity-60 text-sm">Mục <b>${tabName}</b> đang được cập nhật...</div>`;
        }
    }
}