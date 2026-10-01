// تغيير لون القائمة عند التمرير
window.addEventListener('scroll', () => {
    const navbar = id('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

function id(elemId) {
    return document.getElementById(elemId);
}

// فتح نافذة تفاصيل الفيلم/المسلسل
function openModal(title, meta, imgSrc, desc) {
    id('modalTitle').innerText = title;
    id('modalMeta').innerText = meta;
    id('modalImg').src = imgSrc;
    id('modalDesc').innerText = desc;
    id('detailModal').style.display = 'flex';
}

// إغلاق النافذة المنبثقة
function closeModal() {
    id('detailModal').style.display = 'none';
}

// تشغيل/إيقاف الزر في القائمة (حفظ في القائمة)
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

// فتح مشغل الفيديو
function startVideo() {
    closeModal();
    const player = id('playerModal');
    const iframe = id('videoIframe');
    // رابط فيديو لتجربة المشغل
    iframe.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";
    player.style.display = 'block';
}

// إغلاق مشغل الفيديو
function closePlayer() {
    const player = id('playerModal');
    const iframe = id('videoIframe');
    iframe.src = "";
    player.style.display = 'none';
}