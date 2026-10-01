const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';
// صورة افتراضية عند عدم توفر الملصق
const NO_IMAGE_URL = 'https://via.placeholder.com/300x450/19212b/ffffff?text=%D9%84%D8%A7+%D8%AA%D9%88%D8%AC%D8%AF+%D8%B5%D9%88%D8%B1%D8%A9';

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
    } else if (hash.startsWith('#/company/')) {
        const parts = hash.split('/');
        renderCompanyPage(parts[2], decodeURIComponent(parts[3] || 'الشركة'));
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

// 1. الصفحة الرئيسية
async function renderHomePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const favorites = JSON.parse(localStorage.getItem('favorites_list') || '[]');
    const continueWatching = JSON.parse(localStorage.getItem('continue_watching') || '[]');

    container.innerHTML = `
        <div id="hero-banner" class="hero-slider-container"></div>

        ${favorites.length > 0 ? createSectionHTML('fav-list', 'fa-heart', 'قائمتي المفضلة ❤️') : ''}
        ${continueWatching.length > 0 ? createSectionHTML('cw-list', 'fa-rotate-left', 'متابعة المشاهدة') : ''}
        
        ${createSectionHTML('trending-movies', 'fa-film', 'الأفلام الرائجة اليوم')}
        ${createSectionHTML('trending-tv', 'fa-tv', 'المسلسلات الرائجة اليوم')}
        ${createSectionHTML('top-movies', 'fa-star', 'الأفلام الأعلى تقييماً')}
        ${createSectionHTML('top-tv', 'fa-crown', 'المسلسلات الأعلى تقييماً')}

        <!-- شركات الإنتاج -->
        <section class="section-container">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid fa-building"></i> استوديوهات وشركات الإنتاج</h2>
            </div>
            <div class="companies-grid">
                <div class="company-card-logo" onclick="navigateTo('#/company/420/Marvel%20Studios')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Marvel_Logo.svg" alt="Marvel">
                </div>
                <div class="company-card-logo" onclick="navigateTo('#/company/2/Walt%20Disney')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Disney_wordmark.svg" alt="Disney">
                </div>
                <div class="company-card-logo" onclick="navigateTo('#/company/178464/Netflix')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix">
                </div>
                <div class="company-card-logo" onclick="navigateTo('#/company/174/Warner%20Bros')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/64/Warner_Bros_logo.svg" alt="Warner Bros">
                </div>
                <div class="company-card-logo" onclick="navigateTo('#/company/3/Pixar')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/40/Pixar_Disney_Logo.svg" alt="Pixar">
                </div>
                <div class="company-card-logo" onclick="navigateTo('#/company/3268/HBO')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg" alt="HBO">
                </div>
            </div>
        </section>
    `;

    if (favorites.length > 0) renderSavedList(favorites, 'fav-list', false);
    if (continueWatching.length > 0) renderSavedList(continueWatching, 'cw-list', true);
    
    loadHeroBanner();
    fetchMediaList(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=ar-SA`, 'trending-movies', 'movie');
    fetchMediaList(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}&language=ar-SA`, 'trending-tv', 'tv');
    fetchMediaList(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA`, 'top-movies', 'movie');
    fetchMediaList(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=ar-SA`, 'top-tv', 'tv');
}

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

// عرض القوائم المحفوظة مع إمكانية مسح العناصر من متابعة المشاهدة
function renderSavedList(list, elementId, isContinueWatching = false) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = list.map(item => `
        <div class="media-card" onclick="navigateTo('#/watch/${item.type}/${item.id}')">
            ${isContinueWatching ? `<button class="remove-btn" title="حذف" onclick="event.stopPropagation(); removeFromContinueWatching('${item.id}', '${item.type}')"><i class="fa-solid fa-xmark"></i></button>` : ''}
            <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.rating || 'N/A'}</span>
            <img class="card-poster" src="${item.poster ? IMG_PATH + item.poster : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${item.title}">
            <div class="card-info">
                <div class="card-title">${item.title}</div>
            </div>
        </div>
    `).join('');
}

// دالة مسح العنصر من قائمة "متابعة المشاهدة"
function removeFromContinueWatching(id, type) {
    let list = JSON.parse(localStorage.getItem('continue_watching') || '[]');
    list = list.filter(item => !(item.id == id && item.type == type));
    localStorage.setItem('continue_watching', JSON.stringify(list));
    renderHomePage(); // إعادة بناء الواجهة مباشرة لتحديث القائمة
}

// 2. صفحة شركة إنتاج مع التعامل مع الصور الفارغة
async function renderCompanyPage(companyId, companyName) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `
        <div class="search-view-container">
            <h2 class="section-title" style="font-size: 24px; margin-bottom: 20px;">
                <i class="fa-solid fa-film"></i> جميع أعمال شركة: ${companyName}
            </h2>
            <div id="company-results" class="grid-layout">جاري التحميل...</div>
        </div>
    `;

    try {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=popularity.desc&language=ar-SA`);
        const data = await res.json();
        const grid = document.getElementById('company-results');
        
        if (!data.results || !data.results.length) {
            grid.innerHTML = '<p>لا تتوفر أعمال لهذه الشركة حالياً.</p>';
            return;
        }

        grid.innerHTML = data.results.map(item => `
            <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/movie/${item.id}')">
                <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${item.title}">
                <div class="card-info">
                    <div class="card-title">${item.title}</div>
                    <div class="card-meta">
                        <span>${(item.release_date || '').substring(0, 4)}</span>
                        <span>فيلم</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch(e) { console.error(e); }
}

// 3. صفحة المشاهدة بحجم متناسق ومصغر لراحة العين
async function renderWatchPage(type, id) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `<div style="padding: 100px; text-align: center;">جاري تجهيز السينما...</div>`;

    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=ar-SA&append_to_response=recommendations`);
        const data = await res.json();

        const title = data.title || data.name;
        const poster = data.poster_path;
        const backdrop = data.backdrop_path || data.poster_path;
        const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
        
        saveToContinueWatching({ id, type, title, poster, rating });

        const isFav = isFavorite(id, type);

        container.innerHTML = `
            <!-- Banner Poster Header (مصغر ومتناسق) -->
            <div class="netflix-hero" style="background-image: url('${backdrop ? BACKDROP_PATH + backdrop : ''}')">
                <div class="netflix-overlay">
                    <img class="netflix-poster" src="${poster ? IMG_PATH + poster : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${title}">
                    <div class="netflix-details">
                        <h1 class="netflix-title">${title}</h1>
                        <div class="netflix-meta-bar">
                            <span class="badge-green">${Math.round((data.vote_average || 7) * 10)}% تطابق</span>
                            <span>${(data.release_date || data.first_air_date || '').substring(0, 4)}</span>
                            <span>⭐ ${rating}</span>
                            <span>${type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
                        </div>
                        <p style="color: var(--text-muted); line-height: 1.5; font-size: 13px; max-width: 650px;">${data.overview || 'لا يوجد وصف متاح لهذا العمل.'}</p>
                        
                        <div class="action-buttons-group">
                            <button class="btn-primary" onclick="scrollToPlayer()">
                                <i class="fa-solid fa-play"></i> مشاهدة الآن
                            </button>
                            <button class="btn-secondary" id="fav-btn" onclick="toggleFavorite('${id}', '${type}', '${encodeURIComponent(title)}', '${poster}', '${rating}')">
                                <i class="fa-solid ${isFav ? 'fa-heart-circle-check' : 'fa-heart'}" style="${isFav ? 'color: red;' : ''}"></i> 
                                ${isFav ? 'في المفضلة' : 'إضافة للمفضلة'}
                            </button>
                            <button class="btn-secondary" onclick="triggerDownload('${type}', '${id}')">
                                <i class="fa-solid fa-download"></i> تحميل الفيلم
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- منطقة المشغل (محددة بحد أقصى للعرض وموسّطة) -->
            <div class="player-section" id="player-area">
                <h2 class="section-title" style="margin-bottom: 15px;"><i class="fa-solid fa-tv"></i> مشغل الفيديو</h2>
                <div class="player-box">
                    <iframe id="video-iframe" src="https://vidsrc.me/embed/${type}?tmdb=${id}" allowfullscreen></iframe>
                </div>

                <h3 style="font-size: 14px; margin-bottom: 8px;">اختر سيرفر المشاهدة:</h3>
                <div class="servers-grid">
                    <button class="server-btn active" onclick="changeServer('https://vidsrc.me/embed/${type}?tmdb=${id}', this)">سيرفر 1 (سريع)</button>
                    <button class="server-btn" onclick="changeServer('https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1', this)">سيرفر 2 (VIP)</button>
                    <button class="server-btn" onclick="changeServer('https://2embed.org/embed/${id}', this)">سيرفر 3</button>
                    <button class="server-btn" onclick="changeServer('https://autoembed.co/${type}/tmdb/${id}', this)">سيرفر 4</button>
                </div>

                <!-- الأعمال المقترحة -->
                ${data.recommendations && data.recommendations.results.length ? `
                    <h2 class="section-title" style="margin-top: 30px; margin-bottom: 15px;"><i class="fa-solid fa-thumbs-up"></i> أعمال نوصي بها</h2>
                    <div class="grid-layout">
                        ${data.recommendations.results.slice(0, 6).map(item => `
                            <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/${type}/${item.id}')">
                                <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                                <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${item.title || item.name}">
                                <div class="card-info">
                                    <div class="card-title">${item.title || item.name}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    } catch(e) {
        container.innerHTML = `<div style="padding: 50px; text-align: center; color: red;">حدث خطأ في تحميل البيانات.</div>`;
    }
}

function scrollToPlayer() {
    document.getElementById('player-area')?.scrollIntoView({ behavior: 'smooth' });
}

function isFavorite(id, type) {
    const list = JSON.parse(localStorage.getItem('favorites_list') || '[]');
    return list.some(item => item.id == id && item.type == type);
}

function toggleFavorite(id, type, encodedTitle, poster, rating) {
    const title = decodeURIComponent(encodedTitle);
    let list = JSON.parse(localStorage.getItem('favorites_list') || '[]');
    const index = list.findIndex(item => item.id == id && item.type == type);

    if (index > -1) {
        list.splice(index, 1);
        alert('تم الإزالة من المفضلة');
    } else {
        list.push({ id, type, title, poster, rating });
        alert('تمت الإضافة إلى المفضلة ❤️');
    }
    localStorage.setItem('favorites_list', JSON.stringify(list));
    renderWatchPage(type, id);
}

function triggerDownload(type, id) {
    const downloadUrl = `https://vidsrc.me/embed/${type}?tmdb=${id}`;
    window.open(downloadUrl, '_blank');
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
            <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${item.backdrop_path ? BACKDROP_PATH + item.backdrop_path : ''}')">
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
        
        container.innerHTML = data.results.map(item => {
            const type = customType || item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="media-card" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${item.title || item.name}">
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
        ${createSectionHTML('anime-popular', 'fa-fire', 'أشهر أنميات العصر (Top Popular)')}
        ${createSectionHTML('anime-top', 'fa-star', 'الأنميات الأعلى تقييماً')}
    `;
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
            <input type="text" class="search-bar-input" placeholder="ابحث عن أي فيلم، مسلسل، أو أنمي..." oninput="handleSearch(this.value)">
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
        container.innerHTML = data.results.map(item => {
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${item.title || item.name}">
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