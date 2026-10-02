const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';
const NO_IMAGE_URL = 'https://via.placeholder.com/500x750/161920/FFFFFF?text=No+Poster';

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

// دالة دقيقة ومحصنة لجلب رابط الصورة الصحيح
function getPosterUrl(path) {
    if (path && path !== 'null' && path !== 'undefined' && path !== '') {
        return path.startsWith('http') ? path : `${IMG_PATH}${path}`;
    }
    return NO_IMAGE_URL;
}

// الصفحة الرئيسية
async function renderHomePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const continueWatching = JSON.parse(localStorage.getItem('continue_watching') || '[]');

    container.innerHTML = `
        <div id="hero-banner" class="hero-slider-container"></div>

        ${continueWatching.length > 0 ? createSectionHTML('cw-list', 'fa-rotate-left', 'متابعة المشاهدة') : ''}
        
        ${createSectionHTML('trending-movies', 'fa-film', 'الأفلام الأكثر تداولاً')}
        ${createSectionHTML('trending-tv', 'fa-tv', 'المسلسلات الأكثر تداولاً')}
        ${createSectionHTML('top-movies', 'fa-star', 'الأفلام الأعلى تقييماً')}
        ${createSectionHTML('top-tv', 'fa-crown', 'المسلسلات الأعلى تقييماً')}
    `;

    if (continueWatching.length > 0) renderSavedList(continueWatching, 'cw-list', true);
    
    loadHeroBanner();
    fetchMediaList(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`, 'trending-movies', 'movie');
    fetchMediaList(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`, 'trending-tv', 'tv');
    fetchMediaList(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`, 'top-movies', 'movie');
    fetchMediaList(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`, 'top-tv', 'tv');
}

function createSectionHTML(id, icon, title) {
    return `
        <section class="section-container">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid ${icon}"></i> ${title}</h2>
                <div class="carousel-controls">
                    <button class="scroll-btn-nav" onclick="scrollCarousel('${id}', -300)"><i class="fa-solid fa-chevron-right"></i></button>
                    <button class="scroll-btn-nav" onclick="scrollCarousel('${id}', 300)"><i class="fa-solid fa-chevron-left"></i></button>
                </div>
            </div>
            <div class="media-carousel" id="${id}">جاري التحميل...</div>
        </section>
    `;
}

function renderSavedList(list, elementId, isContinueWatching = false) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = list.map(item => `
        <div class="media-card" onclick="navigateTo('#/watch/${item.type}/${item.id}')">
            ${isContinueWatching ? `<button class="remove-btn" title="حذف" onclick="event.stopPropagation(); removeFromContinueWatching('${item.id}', '${item.type}')"><i class="fa-solid fa-xmark"></i></button>` : ''}
            <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.rating || 'N/A'}</span>
            <img class="card-poster" src="${getPosterUrl(item.poster)}" onerror="this.onerror=null; this.src='${NO_IMAGE_URL}';" alt="${item.title}">
            <div class="card-info">
                <div class="card-title">${item.title}</div>
            </div>
        </div>
    `).join('');
}

function removeFromContinueWatching(id, type) {
    let list = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    list = list.filter(item => !(item.id == id && item.type == type));
    localStorage.setItem('continue_watching', JSON.stringify(list));
    renderHomePage(); 
}

// صفحة المشاهدة
async function renderWatchPage(type, id) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `<div style="padding: 100px; text-align: center;">جاري تجهيز مشغل الفيديو...</div>`;

    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ar-SA&append_to_response=recommendations&include_image_language=en,null`);
        const data = await res.json();

        const title = data.title || data.name;
        const poster = data.poster_path;
        const backdrop = data.backdrop_path ? BACKDROP_PATH + data.backdrop_path : getPosterUrl(poster);
        const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
        
        saveToContinueWatching({ id, type, title, poster, rating });

        const server1 = `https://vidlink.pro/${type}/${id}?primaryColor=e50914`;
        const server2 = `https://vidsrc.to/embed/${type}/${id}`;
        const server3 = `https://vidsrc.me/embed/${type}?tmdb=${id}`;
        const server4 = `https://player.smashystream.com/video/${type}/${id}`;
        const server5 = `https://www.2embed.cc/embed${type === 'movie' ? 'movie' : 'tv'}?id=${id}`;
        const server6 = `https://autoembed.co/${type}/tmdb/${id}`;

        container.innerHTML = `
            <div class="watch-backdrop-banner" style="background-image: linear-gradient(to bottom, rgba(13, 15, 18, 0.3), #0d0f12), url('${backdrop}');">
                <div class="watch-backdrop-content">
                    <img class="watch-poster-img" src="${getPosterUrl(poster)}" onerror="this.onerror=null; this.src='${NO_IMAGE_URL}';" alt="${title}">
                    <div class="watch-details-info">
                        <h1 class="watch-title">${title}</h1>
                        <div class="watch-meta">
                            <span class="badge-rating">⭐ ${rating}</span>
                            <span>${(data.release_date || data.first_air_date || '').substring(0, 4)}</span>
                            <span>${type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
                        </div>
                        <p class="watch-overview">${data.overview || 'لا يوجد وصف متاح لهذا العرض.'}</p>
                    </div>
                </div>
            </div>

            <div class="watch-page-container">
                <div class="player-box-wrapper">
                    <iframe id="video-iframe" src="${server1}" allowfullscreen frameborder="0" scrolling="no"></iframe>
                </div>

                <div class="servers-section">
                    <h3 class="servers-title"><i class="fa-solid fa-server"></i> اختر السيرفر:</h3>
                    <div class="servers-grid">
                        <button class="server-btn active" onclick="changeServer('${server1}', this)">السيرفر 1 (VidLink)</button>
                        <button class="server-btn" onclick="changeServer('${server2}', this)">السيرفر 2 (VidSrc)</button>
                        <button class="server-btn" onclick="changeServer('${server3}', this)">السيرفر 3 (Pro)</button>
                        <button class="server-btn" onclick="changeServer('${server4}', this)">السيرفر 4 (SmashyStream)</button>
                        <button class="server-btn" onclick="changeServer('${server5}', this)">السيرفر 5 (2Embed)</button>
                        <button class="server-btn" onclick="changeServer('${server6}', this)">السيرفر 6 (AutoEmbed)</button>
                    </div>
                </div>

                ${data.recommendations && data.recommendations.results.length ? `
                    <div class="recommendations-section">
                        <h2 class="section-title" style="margin-bottom:15px;"><i class="fa-solid fa-thumbs-up"></i> اقتراحات قد تعجبك</h2>
                        <div class="grid-layout">
                            ${data.recommendations.results.slice(0, 6).map(item => `
                                <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/${type}/${item.id}')">
                                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                                    <img class="card-poster" src="${getPosterUrl(item.poster_path)}" onerror="this.onerror=null; this.src='${NO_IMAGE_URL}';" alt="${item.title || item.name}">
                                    <div class="card-info">
                                        <div class="card-title">${item.title || item.name}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } catch(e) {
        container.innerHTML = `<div style="padding: 50px; text-align: center; color: red;">حدث خطأ أثناء تحميل البيانات.</div>`;
    }
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
            <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${item.backdrop_path ? BACKDROP_PATH + item.backdrop_path : getPosterUrl(item.poster_path)}')">
                <div class="hero-overlay">
                    <div class="hero-content">
                        <span class="hero-badge">مميز</span>
                        <h1 class="hero-title">${item.title || item.name}</h1>
                        <p class="hero-overview">${item.overview || 'لا يوجد وصف متاح.'}</p>
                        <button class="btn-primary" onclick="navigateTo('#/watch/${item.media_type || 'movie'}/${item.id}')">
                            <i class="fa-solid fa-play"></i> شاهد الآن
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
        
        container.innerHTML = data.results.map(item => {
            const type = customType || item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="media-card" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${getPosterUrl(item.poster_path)}" onerror="this.onerror=null; this.src='${NO_IMAGE_URL}';" alt="${item.title || item.name}">
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

function renderAnimePage() {
    const container = document.getElementById('app-container');
    if (!container) return;
    container.innerHTML = `
        ${createSectionHTML('anime-popular', 'fa-fire', 'أنمي شائع')}
        ${createSectionHTML('anime-top', 'fa-star', 'أنمي الأعلى تقييماً')}
    `;
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&language=ar-SA&include_image_language=en,null`, 'anime-popular', 'tv');
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200&language=ar-SA&include_image_language=en,null`, 'anime-top', 'tv');
}

async function renderCategoryPage(type, title) {
    const container = document.getElementById('app-container');
    if (!container) return;
    container.innerHTML = `
        ${createSectionHTML('cat-trending', 'fa-fire', `${title} الأكثر تداولاً`)}
        ${createSectionHTML('cat-top', 'fa-star', `${title} الأعلى تقييماً`)}
    `;
    fetchMediaList(`${BASE_URL}/${type}/popular?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`, 'cat-trending', type);
    fetchMediaList(`${BASE_URL}/${type}/top_rated?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`, 'cat-top', type);
}

function renderSearchPage() {
    const container = document.getElementById('app-container');
    if (!container) return;
    container.innerHTML = `
        <div class="search-view-container">
            <input type="text" class="search-bar-input" placeholder="ابحث عن أفلام، مسلسلات، أنمي..." oninput="handleSearch(this.value)">
            <h2 class="section-title" id="search-title">الأكثر تداولاً الآن</h2>
            <div id="search-results" class="grid-layout">جاري التحميل...</div>
        </div>
    `;
    fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`);
}

async function handleSearch(query) {
    const titleEl = document.getElementById('search-title');
    if (!query.trim()) {
        if (titleEl) titleEl.innerText = 'الأكثر تداولاً الآن';
        fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=ar-SA&include_image_language=en,null`);
        return;
    }
    if (titleEl) titleEl.innerText = 'نتائج البحث';
    fetchGridMedia(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=ar-SA&query=${encodeURIComponent(query)}&include_image_language=en,null`);
}

async function fetchGridMedia(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const container = document.getElementById('search-results');
        if (!container) return;
        container.innerHTML = data.results.map(item => {
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${getPosterUrl(item.poster_path)}" onerror="this.onerror=null; this.src='${NO_IMAGE_URL}';" alt="${item.title || item.name}">
                    <div class="card-info">
                        <div class="card-title">${item.title || item.name}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) { console.error(e); }
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