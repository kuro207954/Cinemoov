
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
    if (hash.startsWith('#/movies')) {
        const el = document.getElementById('nav-movies');
        if (el) el.classList.add('active');
    } else if (hash.startsWith('#/tv')) {
        const el = document.getElementById('nav-tv');
        if (el) el.classList.add('active');
    } else if (hash.startsWith('#/anime')) {
        const el = document.getElementById('nav-anime');
        if (el) el.classList.add('active');
    } else if (hash.startsWith('#/search')) {
        const el = document.getElementById('nav-search');
        if (el) el.classList.add('active');
    } else if (hash === '#/') {
        const el = document.getElementById('nav-home');
        if (el) el.classList.add('active');
    }

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

async function renderHomePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
        container.innerHTML = `<div style="padding: 100px 20px; text-align: center; color: #ff4d4d; font-size: 20px;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 50px; margin-bottom: 20px;"></i><br>
            يرجى وضع مفتاح TMDB API الخاص بك في السطر الأول من ملف script.js ليعمل الموقع بجلب الأفلام والمسلسلات.
        </div>`;
        return;
    }

    const continueWatching = JSON.parse(localStorage.getItem('continue_watching') || '[]');

    container.innerHTML = `
        <div id="hero-banner" class="hero-slider-container"></div>

        ${continueWatching.length > 0 ? `
            <section class="section-container">
                <h2 class="section-title"><i class="fa-solid fa-rotate-left"></i> متابعة المشاهدة</h2>
                <div class="carousel-wrapper">
                    <button class="scroll-btn left" onclick="scrollCarousel('cw-list', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                    <div class="media-carousel" id="cw-list">
                        ${continueWatching.map(item => `
                            <div class="media-card" onclick="navigateTo('#/watch/${item.type}/${item.id}')">
                                <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.rating || 'N/A'}</span>
                                <img class="card-poster" src="${item.poster ? IMG_PATH + item.poster : 'https://via.placeholder.com/160x230?text=No+Poster'}" alt="${item.title}">
                                <div class="card-info">
                                    <div class="card-title">${item.title}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="scroll-btn right" onclick="scrollCarousel('cw-list', 300)"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </section>
        ` : ''}

        <section class="section-container">
            <h2 class="section-title"><i class="fa-solid fa-fire"></i> الأعمال الرائجة اليوم</h2>
            <div class="carousel-wrapper">
                <button class="scroll-btn left" onclick="scrollCarousel('trending-list', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="media-carousel" id="trending-list">جاري التحميل...</div>
                <button class="scroll-btn right" onclick="scrollCarousel('trending-list', 300)"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </section>

        <section class="section-container">
            <h2 class="section-title"><i class="fa-solid fa-star"></i> الأعلى تقييماً</h2>
            <div class="carousel-wrapper">
                <button class="scroll-btn left" onclick="scrollCarousel('top-list', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="media-carousel" id="top-list">جاري التحميل...</div>
                <button class="scroll-btn right" onclick="scrollCarousel('top-list', 300)"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </section>
    `;

    loadHeroBanner();
    fetchMediaList(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=ar-SA`, 'trending-list');
    fetchMediaList(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA`, 'top-list');
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
                        <div class="hero-btns">
                            <button class="btn-primary" onclick="navigateTo('#/watch/${item.media_type || 'movie'}/${item.id}')">
                                <i class="fa-solid fa-play"></i> تشغيل الآن
                            </button>
                        </div>
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
    } catch (e) {
        console.error(e);
    }
}

async function fetchMediaList(url, containerId, customType = null) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!data.results || data.results.length === 0) {
            container.innerHTML = '<p style="padding:10px; color:#aaa;">لا تتوفر نتائج حالياً.</p>';
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
    } catch (e) {
        console.error(e);
    }
}

async function renderCategoryPage(type, title) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
        <div class="section-container">
            <h1 style="margin-bottom: 20px;">قسم ${title}</h1>
            
            <h2 class="section-title"><i class="fa-solid fa-fire"></i> ${title} الرائجة</h2>
            <div class="carousel-wrapper">
                <button class="scroll-btn left" onclick="scrollCarousel('cat-trending', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="media-carousel" id="cat-trending">جاري التحميل...</div>
                <button class="scroll-btn right" onclick="scrollCarousel('cat-trending', 300)"><i class="fa-solid fa-chevron-right"></i></button>
            </div>

            <h2 class="section-title" style="margin-top: 30px;"><i class="fa-solid fa-star"></i> الأعلى تقييماً</h2>
            <div class="carousel-wrapper">
                <button class="scroll-btn left" onclick="scrollCarousel('cat-top', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="media-carousel" id="cat-top">جاري التحميل...</div>
                <button class="scroll-btn right" onclick="scrollCarousel('cat-top', 300)"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </div>
    `;

    fetchMediaList(`${BASE_URL}/${type}/popular?api_key=${API_KEY}&language=ar-SA`, 'cat-trending', type);
    fetchMediaList(`${BASE_URL}/${type}/top_rated?api_key=${API_KEY}&language=ar-SA`, 'cat-top', type);
}

function renderAnimePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
        <div class="section-container">
            <h1 style="margin-bottom: 20px;">قسم الأنمي</h1>
            <div class="carousel-wrapper">
                <button class="scroll-btn left" onclick="scrollCarousel('anime-list', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="media-carousel" id="anime-list">جاري التحميل...</div>
                <button class="scroll-btn right" onclick="scrollCarousel('anime-list', 300)"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </div>
    `;
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&language=ar-SA`, 'anime-list', 'tv');
}

function renderSearchPage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
        <div class="search-view-container">
            <input type="text" class="search-bar-input" id="search-input" placeholder="ابحث في جميع المحتويات (أفلام، مسلسلات، أنمي)..." oninput="handleSearch(this.value)">
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
    if (titleEl) titleEl.innerText = 'نتائج البحث';
    fetchGridMedia(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=ar-SA&query=${encodeURIComponent(query)}`);
}

async function fetchGridMedia(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const container = document.getElementById('search-results');
        if (!container) return;

        if (!data.results || !data.results.length) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 20px;">لا توجد نتائج مطابقة.</p>';
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

                    <h3 style="margin-top: 25px;">طاقم التمثيل (Cast)</h3>
                    <div class="cast-grid">
                        ${cast.map(c => `
                            <div class="cast-card">
                                <img src="${c.profile_path ? IMG_PATH + c.profile_path : 'https://via.placeholder.com/100x120?text=No+Img'}" alt="${c.name}">
                                <p><strong>${c.name}</strong></p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <h3>مستحسن (أعمال مشابهة)</h3>
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