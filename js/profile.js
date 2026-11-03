function viewOwnProfile() {
    const currentUser = getCurrentUserData();
    if (currentUser) loadProfileData(currentUser.username);
}

function viewUserProfile(username) { loadProfileData(username); }
function viewUserProfileFromChat() { if (activeChatId && !activeChatId.startsWith('group_')) loadProfileData(activeChatId); }
function showProfileScreen() { viewOwnProfile(); }

function loadProfileData(targetUsername) {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('search-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.remove('hidden');

    const currentUser = getCurrentUserData();
    const users = getUsers();
    const targetUser = users.find(u => u.username === targetUsername);
    if (!targetUser) return;

    viewingProfileUsername = targetUser.username;
    const isOwner = (currentUser.username === targetUser.username);

    const dispName = targetUser.displayName || targetUser.username;
    document.getElementById('view-display-name').innerText = dispName;
    document.getElementById('view-username').innerText = `@${targetUser.username}`;
    document.getElementById('view-role').innerText = targetUser.role || 'Khán giả';
    document.getElementById('view-bio').innerText = targetUser.bio || 'Chưa có tiểu sử';
    document.getElementById('view-dob').innerText = targetUser.dob || 'Chưa cập nhật';

    const avatarPreview = document.getElementById('profile-avatar-preview');
    const avatarText = document.getElementById('profile-avatar-text');
    if (targetUser.avatar) {
        avatarPreview.src = targetUser.avatar;
        avatarPreview.classList.remove('hidden');
        avatarText.classList.add('hidden');
    } else {
        avatarPreview.classList.add('hidden');
        avatarText.classList.remove('hidden');
        avatarText.innerText = dispName.charAt(0).toUpperCase();
    }

    const postBoxAvatar = document.getElementById('post-box-avatar');
    if (currentUser.avatar) {
        postBoxAvatar.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover">`;
    } else {
        postBoxAvatar.innerHTML = (currentUser.displayName || currentUser.username).charAt(0).toUpperCase();
    }

    const coverImg = document.getElementById('profile-cover-img');
    const coverPlaceholder = document.getElementById('profile-cover-placeholder');
    if (targetUser.cover) {
        coverImg.src = targetUser.cover;
        coverImg.classList.remove('hidden');
        coverPlaceholder.classList.add('hidden');
    } else {
        coverImg.classList.add('hidden');
        coverPlaceholder.classList.remove('hidden');
    }

    const postBoxContainer = document.getElementById('post-box-container');
    const editAvatarBtn = document.getElementById('btn-edit-avatar');
    const editCoverBtn = document.getElementById('btn-edit-cover');
    const ownerEditSection = document.getElementById('owner-edit-section');

    if (isOwner) {
        postBoxContainer.classList.remove('hidden');
        editAvatarBtn.classList.remove('hidden');
        editCoverBtn.classList.remove('hidden');
        ownerEditSection.classList.remove('hidden');
        document.getElementById('profile-display-name').value = targetUser.displayName || '';
        document.getElementById('profile-role').value = targetUser.role || 'Khán giả';
        document.getElementById('profile-dob').value = targetUser.dob || '';
        document.getElementById('profile-bio').value = targetUser.bio || '';
        updateBioCounter();
    } else {
        postBoxContainer.classList.add('hidden');
        editAvatarBtn.classList.add('hidden');
        editCoverBtn.classList.add('hidden');
        ownerEditSection.classList.add('hidden');
    }

    renderProfilePhotos(targetUser.username);
    renderProfilePosts(targetUser.username);
}

function renderProfilePhotos(username) {
    const container = document.getElementById('profile-photos-grid');
    const allPosts = getPosts().filter(p => p.username === username);
    let allImages = [];
    allPosts.forEach(p => {
        if (p.images && p.images.length > 0) allImages.push(...p.images);
    });

    if (allImages.length === 0) {
        container.innerHTML = `<p class="text-xs opacity-50 col-span-3 text-center py-4">Chưa có ảnh nào</p>`;
        return;
    }

    container.innerHTML = allImages.slice(0, 9).map(img => `
        <img src="${img}" onclick="openImageViewer(this.src)" class="w-full h-24 object-cover rounded-xl cursor-zoom-in border border-slate-700/50 shadow hover:opacity-90 transition-opacity">
    `).join('');
}

function renderProfilePosts(username) {
    const container = document.getElementById('profile-posts-container');
    const allPosts = getPosts().filter(p => p.username === username);
    const users = getUsers();
    const targetUser = users.find(u => u.username === username);
    const authorName = targetUser.displayName || targetUser.username;
    const authorAvatar = targetUser.avatar ? `<img src="${targetUser.avatar}" class="w-full h-full object-cover">` : authorName.charAt(0).toUpperCase();

    if (allPosts.length === 0) {
        container.innerHTML = `<div class="custom-card rounded-3xl p-6 text-center opacity-60 text-sm">Chưa có bài viết hoặc khoảnh khắc nào được đăng tải.</div>`;
        return;
    }

    let html = '';
    allPosts.slice().reverse().forEach(post => {
        let imagesHtml = '';
        if (post.images && post.images.length > 0) {
            let gridClass = post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
            let imgs = post.images.map(img => `<img src="${img}" onclick="openImageViewer(this.src)" class="w-full h-64 object-cover rounded-2xl cursor-zoom-in border border-slate-700/50 shadow-md">`).join('');
            imagesHtml = `<div class="grid ${gridClass} gap-2 pt-2">${imgs}</div>`;
        }

        let reactions = post.reactions || {like:0, love:0, haha:0, sad:0, rage:0};
        let userReacted = post.userReacted || {};
        let totalReactions = Object.values(reactions).reduce((a,b)=>a+b, 0);

        let detailReacts = [];
        for(let u in userReacted) {
            let uObj = users.find(x => x.username === u);
            if(uObj) detailReacts.push(`${uObj.displayName || uObj.username} (${userReacted[u]})`);
        }
        let tooltipText = detailReacts.length > 0 ? detailReacts.join(', ') : 'Chưa có cảm xúc';

        html += `
            <div class="custom-card rounded-3xl p-6 space-y-4 backdrop-blur-md shadow-xl">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full custom-primary-bg flex items-center justify-center font-black text-[#0b0f19] overflow-hidden shadow">
                        ${authorAvatar}
                    </div>
                    <div>
                        <h4 class="font-bold text-base uppercase">${authorName}</h4>
                        <p class="text-[10px] opacity-60">@${username} • Vừa xong</p>
                    </div>
                </div>
                ${post.caption ? `<p class="text-sm leading-relaxed">${post.caption}</p>` : ''}
                ${imagesHtml}
                
                <div class="flex items-center justify-between pt-2 text-xs opacity-75 border-t border-slate-500/20">
                    <div class="relative group cursor-pointer">
                        <span>👍❤️😂😢😡 ${totalReactions} lượt cảm xúc</span>
                        <div class="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-black/90 text-white text-[11px] px-3 py-1.5 rounded-xl shadow-xl z-30 whitespace-nowrap border border-white/10">
                            ${tooltipText}
                        </div>
                    </div>
                    <span>${post.comments ? post.comments.length : 0} bình luận</span>
                </div>

                <div class="flex items-center justify-around py-1.5 border-y border-slate-500/20 text-xs font-bold relative">
                    <div class="relative group/react flex items-center justify-center py-1 flex-1">
                        <button class="hover:text-cyan-400 transition-colors flex items-center gap-1.5">👍 Thích</button>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/react:flex items-center gap-2 bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded-full shadow-2xl z-40">
                            <button onclick="reactPost('${post.id}', 'like')" class="hover:scale-125 transition-transform text-lg" title="Thích">👍</button>
                            <button onclick="reactPost('${post.id}', 'love')" class="hover:scale-125 transition-transform text-lg" title="Yêu thích">❤️</button>
                            <button onclick="reactPost('${post.id}', 'haha')" class="hover:scale-125 transition-transform text-lg" title="Haha">😆</button>
                            <button onclick="reactPost('${post.id}', 'sad')" class="hover:scale-125 transition-transform text-lg" title="Buồn">😢</button>
                            <button onclick="reactPost('${post.id}', 'rage')" class="hover:scale-125 transition-transform text-lg" title="Phẫn nộ">😡</button>
                        </div>
                    </div>
                </div>

                <div class="space-y-3 pt-1">
                    <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
                        ${renderNestedComments(post.comments || [], post.id, null)}
                    </div>
                    <form onsubmit="submitComment(event, '${post.id}', null)" class="flex gap-2 pt-2">
                        <input type="text" placeholder="Viết bình luận công khai..." class="flex-1 bg-slate-500/10 border border-slate-500/20 rounded-xl px-4 py-2 text-xs focus:outline-none">
                        <label class="cursor-pointer p-2 opacity-75 hover:opacity-100 transition-colors shrink-0" title="Gửi ảnh hoặc video trong bình luận">
                            📎 <input type="file" accept="image/*,video/*" class="hidden" onchange="handleCommentFileSelect(event)">
                        </label>
                        <button type="submit" class="px-4 py-2 glow-button rounded-xl text-xs">Gửi</button>
                    </form>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderNestedComments(comments, postId, parentId) {
    let filtered = comments.filter(c => c.parentId === parentId);
    if (filtered.length === 0) return '';
    const users = getUsers();

    return filtered.map(c => {
        let authorObj = users.find(u => u.username === c.username);
        let avatar = authorObj && authorObj.avatar ? `<img src="${authorObj.avatar}" class="w-full h-full object-cover">` : c.name.charAt(0).toUpperCase();
        let cReactions = c.reactions || {like:0, love:0, haha:0, sad:0, rage:0};
        let cTotal = Object.values(cReactions).reduce((a,b)=>a+b, 0);

        let mediaHtml = '';
        if(c.media) {
            if(c.mediaType && c.mediaType.startsWith('video')) {
                mediaHtml = `<video src="${c.media}" controls class="max-w-[200px] rounded-xl mt-2 border border-slate-700/50"></video>`;
            } else {
                mediaHtml = `<img src="${c.media}" onclick="openImageViewer(this.src)" class="max-w-[200px] rounded-xl mt-2 cursor-zoom-in border border-slate-700/50 shadow">`;
            }
        }

        let childHtml = renderNestedComments(comments, postId, c.id);

        return `
            <div class="flex flex-col gap-2 pt-2 text-xs ${parentId ? 'ml-6 sm:ml-8 border-l-2 border-slate-500/20 pl-3' : ''}">
                <div class="flex items-start gap-2.5">
                    <div class="w-7 h-7 rounded-full custom-primary-bg flex items-center justify-center font-bold text-[#0b0f19] overflow-hidden shrink-0 shadow">
                        ${avatar}
                    </div>
                    <div class="flex-1 bg-slate-500/10 rounded-2xl px-3.5 py-2">
                        <div class="flex items-center justify-between">
                            <span class="font-bold">${c.name}</span>
                            <span class="text-[9px] opacity-50">Vừa xong</span>
                        </div>
                        <p class="opacity-90 mt-0.5">${c.text}</p>
                        ${mediaHtml}
                        <div class="flex items-center gap-4 mt-2 text-[10px] font-bold opacity-80">
                            <span onclick="reactComment('${postId}', '${c.id}', 'like')" class="cursor-pointer hover:text-cyan-400">👍 Thích (${cTotal})</span>
                            <span onclick="setReplyTarget('${c.id}')" class="cursor-pointer hover:text-cyan-400">Phản hồi</span>
                        </div>
                    </div>
                </div>
                ${childHtml}
                <div id="reply-box-${c.id}" class="hidden ml-8 pt-1">
                    <form onsubmit="submitComment(event, '${postId}', '${c.id}')" class="flex gap-2">
                        <input type="text" placeholder="Phản hồi ${c.name}..." class="flex-1 bg-slate-500/10 border border-slate-500/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none">
                        <button type="submit" class="px-3 py-1.5 glow-button rounded-xl text-xs">Gửi</button>
                    </form>
                </div>
            </div>
        `;
    }).join('');
}

function handleCommentFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        activeCommentMedia = { data: event.target.result, type: file.type };
        alert('Đã đính kèm tệp vào bình luận!');
    }
    reader.readAsDataURL(file);
}

function setReplyTarget(commentId) {
    let box = document.getElementById(`reply-box-${commentId}`);
    if(box) box.classList.toggle('hidden');
}

function openPostModal() {
    document.getElementById('post-modal').classList.remove('hidden');
    pendingPostImages = [];
    document.getElementById('post-caption-input').value = '';
    document.getElementById('post-images-preview').innerHTML = '';
}

function closePostModal() { document.getElementById('post-modal').classList.add('hidden'); }

function handlePostImagesSelect(e) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(event) {
            pendingPostImages.push(event.target.result);
            renderPostImagesPreview();
        }
        reader.readAsDataURL(files[i]);
    }
}

function renderPostImagesPreview() {
    const container = document.getElementById('post-images-preview');
    container.innerHTML = pendingPostImages.map((img, idx) => `
        <div class="relative">
            <img src="${img}" class="w-full h-24 object-cover rounded-xl border border-slate-500/30">
            <button type="button" onclick="pendingPostImages.splice(${idx}, 1); renderPostImagesPreview();" class="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">×</button>
        </div>
    `).join('');
}

function submitNewPost() {
    const caption = document.getElementById('post-caption-input').value.trim();
    if (!caption && pendingPostImages.length === 0) {
        alert('Vui lòng viết nội dung hoặc chọn ảnh để đăng bài!');
        return;
    }

    const currentUser = getCurrentUserData();
    let posts = getPosts();
    posts.push({
        id: 'post_' + Date.now(),
        username: currentUser.username,
        caption: caption,
        images: pendingPostImages,
        reactions: {like:0, love:0, haha:0, sad:0, rage:0},
        userReacted: {},
        comments: [],
        createdAt: Date.now()
    });
    savePosts(posts);
    closePostModal();
    loadProfileData(currentUser.username);
}

function reactPost(postId, type) {
    let posts = getPosts();
    let post = posts.find(p => p.id === postId);
    const currentUser = getCurrentUserData();
    if (post) {
        if (!post.reactions) post.reactions = {like:0, love:0, haha:0, sad:0, rage:0};
        if (!post.userReacted) post.userReacted = {};

        let currentReact = post.userReacted[currentUser.username];
        if (currentReact === type) {
            post.reactions[type] = Math.max(0, (post.reactions[type] || 1) - 1);
            delete post.userReacted[currentUser.username];
        } else {
            if (currentReact) {
                post.reactions[currentReact] = Math.max(0, (post.reactions[currentReact] || 1) - 1);
            }
            post.reactions[type] = (post.reactions[type] || 0) + 1;
            post.userReacted[currentUser.username] = type;
        }
        savePosts(posts);
        loadProfileData(viewingProfileUsername);
    }
}

function reactComment(postId, commentId, type) {
    let posts = getPosts();
    let post = posts.find(p => p.id === postId);
    if(post && post.comments) {
        let c = post.comments.find(item => item.id === commentId);
        if(c) {
            if(!c.reactions) c.reactions = {like:0, love:0, haha:0, sad:0, rage:0};
            c.reactions[type] = (c.reactions[type] || 0) + 1;
            savePosts(posts);
            loadProfileData(viewingProfileUsername);
        }
    }
}

function submitComment(e, postId, parentId) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const text = input.value.trim();
    if (!text && !activeCommentMedia) return;

    const currentUser = getCurrentUserData();
    let posts = getPosts();
    let post = posts.find(p => p.id === postId);
    if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push({
            id: 'comment_' + Date.now(),
            parentId: parentId || null,
            username: currentUser.username,
            name: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar,
            text: text,
            media: activeCommentMedia ? activeCommentMedia.data : null,
            mediaType: activeCommentMedia ? activeCommentMedia.type : null,
            reactions: {like:0, love:0, haha:0, sad:0, rage:0}
        });
        savePosts(posts);
        input.value = '';
        activeCommentMedia = null;
        loadProfileData(viewingProfileUsername);
    }
}

function openImageViewer(src) {
    document.getElementById('viewer-img-tag').src = src;
    document.getElementById('image-viewer-modal').classList.remove('hidden');
}

function closeImageViewer() { document.getElementById('image-viewer-modal').classList.add('hidden'); }

function updateBioCounter() {
    const bio = document.getElementById('profile-bio').value;
    document.getElementById('bio-counter').innerText = `${bio.length}/10000`;
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        let user = getCurrentUserData();
        user.avatar = e.target.result;
        updateUserData(user);
        loadProfileData(user.username);
    }
    reader.readAsDataURL(file);
}

function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        let user = getCurrentUserData();
        user.cover = e.target.result;
        updateUserData(user);
        loadProfileData(user.username);
    }
    reader.readAsDataURL(file);
}

function saveProfile(event) {
    event.preventDefault();
    let user = getCurrentUserData();
    user.displayName = document.getElementById('profile-display-name').value.trim();
    user.role = document.getElementById('profile-role').value;
    user.dob = document.getElementById('profile-dob').value;
    user.bio = document.getElementById('profile-bio').value.trim();
    updateUserData(user);
    
    const msg = document.getElementById('profile-msg');
    msg.innerText = "Đã lưu hồ sơ thành công!";
    msg.className = "text-sm font-bold text-emerald-500 text-center block";
    setTimeout(() => { msg.classList.add('hidden'); loadProfileData(user.username); }, 1500);
}

function showSearchScreen() {
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('settings-screen').classList.add('hidden');
    document.getElementById('search-screen').classList.remove('hidden');
}

function handleSearch() {
    const keyword = document.getElementById('search-input').value.trim().toLowerCase();
    const container = document.getElementById('search-results');
    const currentUser = getCurrentUserData();
    if (!keyword) { container.innerHTML = '<p class="text-center opacity-50 text-sm py-8">Nhập từ khóa...</p>'; return; }
    let scoredUsers = getUsers().filter(u => u.username !== currentUser.username).map(u => {
        let score = (u.username.toLowerCase().includes(keyword) || (u.displayName || '').toLowerCase().includes(keyword)) ? 50 : 0;
        return { user: u, score };
    }).filter(i => i.score > 0);

    let html = '';
    scoredUsers.forEach(item => {
        const u = item.user;
        const isFriend = currentUser.friends && currentUser.friends.includes(u.username);
        const dispName = u.displayName || u.username;
        const avatarHtml = u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover">` : dispName.charAt(0).toUpperCase();
        let btn = isFriend ? `<span class="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl">Đã kết bạn</span>` : `<button onclick="sendFriendRequest('${u.username}')" class="px-4 py-2 glow-button text-xs rounded-xl">Kết bạn</button>`;
        html += `<div class="custom-card rounded-2xl p-4 flex items-center justify-between gap-4"><div class="flex items-center gap-4"><div onclick="viewUserProfile('${u.username}')" class="w-12 h-12 rounded-full custom-primary-bg flex items-center justify-center font-black text-[#0b0f19] overflow-hidden shadow-md cursor-pointer hover:scale-105">${avatarHtml}</div><div><h4 onclick="viewUserProfile('${u.username}')" class="font-bold cursor-pointer hover:underline">${dispName}</h4><p class="text-xs opacity-60">@${u.username}</p></div></div>${btn}</div>`;
    });
    container.innerHTML = html || '<p class="text-center opacity-50 text-sm py-8">Không tìm thấy kết quả</p>';
}

function sendFriendRequest(targetUsername) {
    const currentUser = getCurrentUserData();
    let users = getUsers();
    let targetUser = users.find(u => u.username === targetUsername);
    if (!targetUser) return;
    if (!targetUser.notifications) targetUser.notifications = [];
    targetUser.notifications.push({ type: 'friend_request', sender: currentUser.username, status: 'pending', read: false });
    updateUserData(targetUser);
    showSearchScreen();
}