function id(elemId) {
    return document.getElementById(elemId);
}

// فتح نافذة تفاصيل الفيلم أو المسلسل أو الأنمي
function openModal(title, meta, imgSrc, desc) {
    id('modalTitle').innerText = title;
    id('modalMeta').innerText = meta;
    id('modalImg').src = imgSrc;
    id('modalDesc').innerText = desc;
    id('detailModal').style.display = 'flex';
}

// إغلاق النافذة
function closeModal() {
    id('detailModal').style.display = 'none';
}

// إضافة للحفظ / المفضلة
let isAdded = false;
function toggleList() {
    const btn = id('addListBtn');
    isAdded = !isAdded;
    if (isAdded) {
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.style.color = '#46d369';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btn.style.color = '#fff';
    }
}

// تشغيل المشغل
function startVideo() {
    closeModal();
    const player = id('playerModal');
    const iframe = id('videoIframe');
    iframe.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";
    player.style.display = 'block';
}

// إغلاق المشغل
function closePlayer() {
    const player = id('playerModal');
    const iframe = id('videoIframe');
    iframe.src = "";
    player.style.display = 'none';
}