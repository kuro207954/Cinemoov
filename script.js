const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

let heroInterval;

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRoute() {
    if (heroInterval) clearInterval(heroInterval);
    const hash = window.location.hash || '#/';
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (hash.startsWith('#/movies')) document.getElementById('nav-movies')?.classList.add('active');
    else if (hash.startsWith('#/tv')) document.getElementById('nav-tv')?.classList.add('active');
    else if (hash.startsWith('#/anime')) document.getElementById('nav-anime')?.classList.add('active');
    else if (hash.startsWith('#/search')) document.getElementById('nav-search')?.classList.add('active');
    else if (hash === '#/') document.getElementById('nav-home')?.classList.add('active');

    if (hash.startsWith('#/watch/')) {
        const parts = hash.split('/');
        renderWatchPage(parts[2], parts[3]);
    } else if (hash === '#/search') {
        renderSearchPage();
    } else if (hash === '#/movies') {
        renderCategoryPage('movie', 'الأفلام');
    } else if (hash === '#/tv') {
        renderCategoryPage('tv', 'المسلسلات');
    } else if (hash === '#/anime') {
        renderAnimePage();
    } else {
        renderHomePage();
    }
}

// 1. الصفحة الرئيسية المنظمة
async function renderHomePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const continueWatching = JSON.parse(localStorage.getItem('continue_watching') || '[]');

    container.innerHTML = `
        <div id="hero-banner" class="hero-slider-container"></div>

        ${continueWatching.length > 0 ? createSectionHTML('cw-list', 'fa-rotate-left', 'متابعة المشاهدة') : ''}
        ${createSectionHTML('trending-movies', 'fa-film', 'الأفلام الرائجة اليوم')}
        ${createSectionHTML('trending-tv', 'fa-tv', 'المسلسلات الرائجة اليوم')}
        ${createSectionHTML('top-movies', 'fa-star', 'الأفلام الأعلى تقييماً')}
        ${createSectionHTML('top-tv', 'fa-crown', 'المسلسلات الأعلى تقييماً')}

        <!-- قسم شركات الإنتاج العالمية -->
        <section class="section-container">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid fa-building"></i> استوديوهات وشركات الإنتاج</h2>
            </div>
            <div class="companies-grid">
                <div class="company-card" onclick="loadCompanyMedia(420, 'Marvel Studios')">Marvel</div>
                <div class="company-card" onclick="loadCompanyMedia(2, 'Walt Disney')">Disney</div>
                <div class="company-card" onclick="loadCompanyMedia(178464, 'Netflix')">Netflix</div>
                <div class="company-card" onclick="loadCompanyMedia(174, 'Warner Bros')">Warner Bros</div>
                <div class="company-card" onclick="loadCompanyMedia(3, 'Pixar')">Pixar</div>
                <div class="company-card" onclick="loadCompanyMedia(3268, 'HBO')">HBO</div>
            </div>
            <div id="company-results-title" class="section-title" style="margin-top: 20px; display: none;"></div>
            <div id="company-results" class="grid-layout" style="margin-top: 15px;"></div>
        </section>
    `;

    if (continueWatching.length > 0) renderContinueWatchingList(continueWatching);
    loadHeroBanner();
    fetchMediaList(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=ar-SA`, 'trending-movies', 'movie');
    fetchMediaList(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}&language=ar-SA`, 'trending-tv', 'tv');
    fetchMediaList(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA`, 'top-movies', 'movie');
    fetchMediaList(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=ar-SA`, 'top-tv', 'tv');
}

// دالة إنشاء هيكل الأقسام مع أسهم التنقل بالأعلى
function createSectionHTML(id, icon, title) {
    return `
        <section class="section-container">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid ${icon}"></i> ${title}</h2>
                <div class="carousel-controls">
                    <button class="scroll-btn-nav" onclick="scrollCarousel('${id}', 300)"><i class="fa-solid fa-chevron-right"></i></button>
                    <button class="scroll-btn-nav" onclick="scrollCarousel('${id}', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                </div>
            </div>
            <div class="media-carousel" id="${id}">جاري التحميل...</div>
        </section>
    `;
}

function renderContinueWatchingList(list) {
    const container = document.getElementById('cw-list');
    if (!container) return;
    container.innerHTML = list.map(item => `
        <div class="media-card" onclick="navigateTo('#/watch/${item.type}/${item.id}')">
            <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.rating || 'N/A'}</span>
            <img class="card-poster" src="${item.poster ? IMG_PATH + item.poster : 'https://via.placeholder.com/160x230?text=No+Poster'}" alt="${item.title}">
            <div class="card-info">
                <div class="card-title">${item.title}</div>
            </div>
        </div>
    `).join('');
}

// جلب أعمال شركة إنتاج معينة
async function loadCompanyMedia(companyId, companyName) {
    document.querySelectorAll('.company-card').forEach(c => c.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const titleEl = document.getElementById('company-results-title');
    const container = document.getElementById('company-results');
    
    titleEl.style.display = 'block';
    titleEl.innerHTML = `<i class="fa-solid fa-clapperboard"></i> أشهر وأحدث أعمال ${companyName}`;
    container.innerHTML = 'جاري الجلب...';

    try {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=popularity.desc&language=ar-SA`);
        const data = await res.json();
        
        container.innerHTML = data.results.slice(0, 12).map(item => `
            <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/movie/${item.id}')">
                <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/160x230?text=No+Poster'}" alt="${item.title}">
                <div class="card-info">
                    <div class="card-title">${item.title}</div>
                </div>
            </div>
        `).join('');
    } catch(e) { console.error(e); }
}

async function loadHeroBanner() {
    try {
        const res = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=ar-SA`);
        const data = await res.json();
        if (!data.results || !data.results.length) return;
        
        const items = data.results.slice(0, 6);
        const heroBanner = document.getElementById('hero-banner');
        if (!heroBanner) return;

        heroBanner.innerHTML = items.map((item, idx) => `
            <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${BACKDROP_PATH + item.backdrop_path}')">
                <div class="hero-overlay">
                    <div class="hero-content">
                        <span class="hero-badge">الأبرز حالياً</span>
                        <h1 class="hero-title">${item.title || item.name}</h1>
                        <p class="hero-overview">${item.overview || 'لا يوجد وصف متاح.'}</p>
                        <button class="btn-primary" onclick="navigateTo('#/watch/${item.media_type || 'movie'}/${item.id}')">
                            <i class="fa-solid fa-play"></i> تشغيل الآن
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        let currentSlide = 0;
        heroInterval = setInterval(() => {
            const slides = document.querySelectorAll('.hero-slide');
            if (slides.length) {
                slides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % slides.length;
                slides[currentSlide].classList.add('active');
            }
        }, 5000);
    } catch (e) { console.error(e); }
}

async function fetchMediaList(url, containerId, customType = null) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!data.results || data.results.length === 0) {
            container.innerHTML = '<p style="padding:10px; color:#aaa;">لا تتوفر نتائج.</p>';
            return;
        }

        container.innerHTML = data.results.map(item => {
            const type = customType || item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="media-card" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/160x230?text=No+Poster'}" alt="${item.title || item.name}">
                    <div class="card-info">
                        <div class="card-title">${item.title || item.name}</div>
                        <div class="card-meta">
                            <span>${(item.release_date || item.first_air_date || '').substring(0, 4)}</span>
                            <span>${type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) { console.error(e); }
}

// قسم الأنمي المفلتر والمنظم للأشهر فقط
function renderAnimePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
        ${createSectionHTML('anime-popular', 'fa-fire', 'أشهر أنميات العصر (Top Popular)')}
        ${createSectionHTML('anime-top', 'fa-star', 'الأنميات الأعلى تقييماً')}
    `;

    // تصفية جلب الأنمي الياباني الأعلى تقييماً وشهرة
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&language=ar-SA`, 'anime-popular', 'tv');
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200&language=ar-SA`, 'anime-top', 'tv');
}

async function renderCategoryPage(type, title) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
        ${createSectionHTML('cat-trending', 'fa-fire', `${title} الرائجة`)}
        ${createSectionHTML('cat-top', 'fa-star', `${title} الأعلى تقييماً`)}
    `;

    fetchMediaList(`${BASE_URL}/${type}/popular?api_key=${API_KEY}&language=ar-SA`, 'cat-trending', type);
    fetchMediaList(`${BASE_URL}/${type}/top_rated?api_key=${API_KEY}&language=ar-SA`, 'cat-top', type);
}

function renderSearchPage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
        <div class="search-view-container">
            <input type="text" class="search-bar-input" id="search-input" placeholder="ابحث عن أي فيلم، مسلسل، أو أنمي (عربي، أجنبي، قديم، جديد)..." oninput="handleSearch(this.value)">
            <h2 class="section-title" id="search-title">الأكثر رواجاً الآن</h2>
            <div id="search-results" class="grid-layout">جاري التحميل...</div>
        </div>
    `;
    fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=ar-SA`);
}

async function handleSearch(query) {
    const titleEl = document.getElementById('search-title');
    if (!query.trim()) {
        if (titleEl) titleEl.innerText = 'الأكثر رواجاً الآن';
        fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=ar-SA`);
        return;
    }
    if (titleEl) titleEl.innerText = 'نتائج البحث الشاملة';
    fetchGridMedia(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=ar-SA&query=${encodeURIComponent(query)}`);
}

async function fetchGridMedia(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const container = document.getElementById('search-results');
        if (!container) return;

        if (!data.results || !data.results.length) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 20px;">لا توجد نتائج مطابقة لاسم البحث.</p>';
            return;
        }

        container.innerHTML = data.results.map(item => {
            if (!item.poster_path && !item.backdrop_path) return '';
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/160x230?text=No+Poster'}" alt="${item.title || item.name}">
                    <div class="card-info">
                        <div class="card-title">${item.title || item.name}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) { console.error(e); }
}

async function renderWatchPage(type, id) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `<div style="padding: 100px; text-align: center;">جاري تجهيز المشغل والمعلومات...</div>`;

    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ar-SA&append_to_response=credits,recommendations`);
        const data = await res.json();

        saveToContinueWatching({
            id: data.id,
            type: type,
            title: data.title || data.name,
            poster: data.poster_path,
            rating: data.vote_average ? data.vote_average.toFixed(1) : 'N/A'
        });

        const cast = data.credits?.cast?.slice(0, 6) || [];
        const recommended = data.recommendations?.results?.slice(0, 10) || [];

        container.innerHTML = `
            <div class="watch-container">
                <div>
                    <div class="player-box">
                        <iframe id="video-iframe" src="https://vidsrc.me/embed/${type}?tmdb=${id}" allowfullscreen></iframe>
                    </div>

                    <h3 style="margin-top: 20px;">اختر سيرفر التشغيل</h3>
                    <div class="servers-grid">
                        <button class="server-btn active" onclick="changeServer('https://vidsrc.me/embed/${type}?tmdb=${id}', this)">سيرفر 1 (أساسي)</button>
                        <button class="server-btn" onclick="changeServer('https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1', this)">سيرفر 2 (VIP)</button>
                        <button class="server-btn" onclick="changeServer('https://2embed.org/embed/${id}', this)">سيرفر 3 (سريع)</button>
                        <button class="server-btn" onclick="changeServer('https://autoembed.co/${type}/tmdb/${id}', this)">سيرفر 4 (احتياطي)</button>
                    </div>

                    <h1 style="margin-top: 15px;">${data.title || data.name}</h1>
                    <p style="color: var(--text-muted); margin-top: 10px; line-height: 1.6;">${data.overview || 'لا يوجد قصة مضافة لهذا العمل.'}</p>
                </div>

                <div>
                    <h3>أعمال مشابهة</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
                        ${recommended.map(item => `
                            <div class="media-card" style="width: 100%; display: flex; gap: 10px;" onclick="navigateTo('#/watch/${type}/${item.id}')">
                                <img src="${item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/80x110'}" style="width: 70px; height: 95px; object-fit: cover;">
                                <div style="padding: 5px;">
                                    <div class="card-title">${item.title || item.name}</div>
                                    <div style="font-size: 11px; color: #ffd700; margin-top: 5px;">⭐ ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch(e) {
        container.innerHTML = `<div style="padding: 50px; text-align: center; color: red;">حدث خطأ في جلب بيانات العمل.</div>`;
    }
}

function scrollCarousel(id, distance) {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: distance, behavior: 'smooth' });
}

function changeServer(url, btn) {
    const iframe = document.getElementById('video-iframe');
    if (iframe) iframe.src = url;
    document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function saveToContinueWatching(item) {
    let list = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    list = list.filter(i => !(i.id === item.id && i.type === item.type));
    list.unshift(item);
    localStorage.setItem('continue_watching', JSON.stringify(list.slice(0, 10)));
}