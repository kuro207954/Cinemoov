const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

let heroInterval;

// حقن تنسيقات حماية تصميم البطاقات والسيرفرات
(function injectCardStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .media-card {
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            background: #161920 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            min-height: 280px !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            transition: transform 0.2s ease;
            cursor: pointer;
        }
        .media-card:hover {
            transform: translateY(-4px);
        }
        .card-poster {
            width: 100% !important;
            height: 260px !important;
            object-fit: cover !important;
            display: block !important;
            background-color: #1f232d !important;
        }
        .badge-rating {
            position: absolute !important;
            top: 8px !important;
            left: 8px !important;
            z-index: 5 !important;
            background: rgba(0, 0, 0, 0.8) !important;
            padding: 3px 8px !important;
            border-radius: 4px !important;
            color: #ffc107 !important;
            font-size: 11px !important;
            font-weight: bold;
            backdrop-filter: blur(4px);
        }
        .card-info {
            padding: 10px !important;
            background: #161920 !important;
            z-index: 2 !important;
        }
        .card-title {
            font-size: 13px !important;
            color: #fff !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            font-weight: 500;
        }
        .server-notice {
            background: #1a1d24;
            color: #b0b5c1;
            padding: 12px 18px;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 15px;
            border-right: 4px solid #e50914;
            line-height: 1.5;
        }
        .servers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        .server-btn {
            background: #1f232d;
            color: #fff;
            border: 1px solid #2d323f;
            padding: 10px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
            text-align: center;
        }
        .server-btn:hover, .server-btn.active {
            background: #e50914;
            border-color: #e50914;
            color: #fff;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
})();

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
        renderCategoryPage('movie', 'Movies');
    } else if (hash === '#/tv') {
        renderCategoryPage('tv', 'TV Shows');
    } else if (hash === '#/anime') {
        renderAnimePage();
    } else {
        renderHomePage();
    }
}

function getPosterUrl(path) {
    return `${IMG_PATH}${path}`;
}

async function renderHomePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const continueWatching = JSON.parse(localStorage.getItem('continue_watching') || '[]');

    container.innerHTML = `
        <div id="hero-banner" class="hero-slider-container"></div>

        ${continueWatching.length > 0 ? createSectionHTML('cw-list', 'fa-rotate-left', 'Continue Watching') : ''}
        
        ${createSectionHTML('trending-movies', 'fa-film', 'Trending Movies')}
        ${createSectionHTML('trending-tv', 'fa-tv', 'Trending TV Shows')}
        ${createSectionHTML('top-movies', 'fa-star', 'Top Rated Movies')}
        ${createSectionHTML('top-tv', 'fa-crown', 'Top Rated TV Shows')}
    `;

    if (continueWatching.length > 0) renderSavedList(continueWatching, 'cw-list', true);
    
    loadHeroBanner();
    fetchMediaList(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`, 'trending-movies', 'movie');
    fetchMediaList(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}`, 'trending-tv', 'tv');
    fetchMediaList(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`, 'top-movies', 'movie');
    fetchMediaList(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}`, 'top-tv', 'tv');
}

function createSectionHTML(id, icon, title) {
    return `
        <section class="section-container">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid ${icon}"></i> ${title}</h2>
                <div class="carousel-controls">
                    <button class="scroll-btn-nav" onclick="scrollCarousel('${id}', -300)"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="scroll-btn-nav" onclick="scrollCarousel('${id}', 300)"><i class="fa-solid fa-chevron-right"></i></button>
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
            <img class="card-poster" src="${getPosterUrl(item.poster)}" alt="${item.title}">
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

async function renderWatchPage(type, id) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `<div style="padding: 100px; text-align: center; color: #fff;">جاري تجهيز مشغل الفيديو...</div>`;

    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=recommendations`);
        const data = await res.json();

        const title = data.title || data.name;
        const poster = data.poster_path;
        const backdrop = data.backdrop_path ? BACKDROP_PATH + data.backdrop_path : getPosterUrl(poster);
        const rating = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
        
        saveToContinueWatching({ id, type, title, poster, rating });

        const servers = [
            { name: "Server 1 (VidLink)", url: `https://vidlink.pro/${type}/${id}?primaryColor=e50914` },
            { name: "Server 2 (VidSrc Pro)", url: `https://vidsrc.me/embed/${type}?tmdb=${id}` },
            { name: "Server 3 (AutoEmbed)", url: `https://player.autoembed.cc/embed/${type}/${id}` },
            { name: "Server 4 (VidSrc CC)", url: `https://vidsrc.cc/v2/embed/${type}/${id}` },
            { name: "Server 5 (SmashyStream)", url: `https://embed.smashystream.com/playere.php?tmdb=${id}` },
            { name: "Server 6 (2Embed)", url: `https://www.2embed.cc/embed${type === 'movie' ? '' : 'tv'}/${id}` },
            { name: "Server 7 (MultiEmbed)", url: `https://multiembed.mov/?video_id=${id}&tmdb=1` },
            { name: "Server 8 (NontonGo)", url: `https://www.NontonGo.win/embed/${type}/${id}` }
        ];

        const cleanRecs = (data.recommendations?.results || []).filter(item => item.poster_path);

        container.innerHTML = `
            <div class="watch-backdrop-banner" style="background-image: linear-gradient(to bottom, rgba(13, 15, 18, 0.4), #0d0f12), url('${backdrop}');">
                <div class="watch-backdrop-content">
                    <img class="watch-poster-img" src="${getPosterUrl(poster)}" alt="${title}">
                    <div class="watch-details-info">
                        <h1 class="watch-title">${title}</h1>
                        <div class="watch-meta">
                            <span class="badge-rating">⭐ ${rating}</span>
                            <span>${(data.release_date || data.first_air_date || '').substring(0, 4)}</span>
                            <span>${type === 'movie' ? 'Movie' : 'TV Show'}</span>
                        </div>
                        <p class="watch-overview">${data.overview || 'لا يوجد وصف متوفر.'}</p>
                    </div>
                </div>
            </div>

            <div class="watch-page-container">
                <div class="server-notice">
                    <i class="fa-solid fa-circle-info"></i> <strong>ملاحظة:</strong> إذا لم يعمل السيرفر الأول أو واجهتك مشكلة في العرض، يرجى تجربة التبديل بين السيرفرات المتاحة بالأسفل (كل سيرفر يوفر مصادر وقنوات بث مختلفة).
                </div>

                <div class="player-box-wrapper">
                    <iframe id="video-iframe" src="${servers[0].url}" allowfullscreen frameborder="0" scrolling="no" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"></iframe>
                </div>

                <div class="servers-section">
                    <h3 class="servers-title"><i class="fa-solid fa-server"></i> اختار السيرفر (Choose Server):</h3>
                    <div class="servers-grid">
                        ${servers.map((srv, index) => `
                            <button class="server-btn ${index === 0 ? 'active' : ''}" onclick="changeServer('${srv.url}', this)">${srv.name}</button>
                        `).join('')}
                    </div>
                </div>

                ${cleanRecs.length ? `
                    <div class="recommendations-section">
                        <h2 class="section-title" style="margin-bottom:15px;"><i class="fa-solid fa-thumbs-up"></i> مقترحات لك</h2>
                        <div class="grid-layout">
                            ${cleanRecs.slice(0, 6).map(item => `
                                <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/${type}/${item.id}')">
                                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                                    <img class="card-poster" src="${getPosterUrl(item.poster_path)}" alt="${item.title || item.name}">
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
        const res = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}`);
        const data = await res.json();
        const validResults = (data.results || []).filter(item => item.backdrop_path || item.poster_path);
        if (!validResults.length) return;
        
        const items = validResults.slice(0, 6);
        const heroBanner = document.getElementById('hero-banner');
        if (!heroBanner) return;

        heroBanner.innerHTML = items.map((item, idx) => `
            <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${item.backdrop_path ? BACKDROP_PATH + item.backdrop_path : getPosterUrl(item.poster_path)}')">
                <div class="hero-overlay">
                    <div class="hero-content">
                        <span class="hero-badge">مميّز</span>
                        <h1 class="hero-title">${item.title || item.name}</h1>
                        <p class="hero-overview">${item.overview || 'لا يوجد وصف متوفر.'}</p>
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
        
        const validResults = (data.results || []).filter(item => item.poster_path);
        
        container.innerHTML = validResults.map(item => {
            const type = customType || item.media_type || (item.title ? 'movie' : 'tv');
            const title = item.title || item.name;
            return `
                <div class="media-card" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${getPosterUrl(item.poster_path)}" alt="${title}">
                    <div class="card-info">
                        <div class="card-title">${title}</div>
                        <div class="card-meta">
                            <span>${(item.release_date || item.first_air_date || '').substring(0, 4)}</span>
                            <span>${type === 'movie' ? 'Movie' : 'TV Show'}</span>
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
        ${createSectionHTML('anime-popular', 'fa-fire', 'Top Popular Anime')}
        ${createSectionHTML('anime-top', 'fa-star', 'Top Rated Anime')}
    `;
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`, 'anime-popular', 'tv');
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200`, 'anime-top', 'tv');
}

async function renderCategoryPage(type, title) {
    const container = document.getElementById('app-container');
    if (!container) return;
    container.innerHTML = `
        ${createSectionHTML('cat-trending', 'fa-fire', `Trending ${title}`)}
        ${createSectionHTML('cat-top', 'fa-star', `Top Rated ${title}`)}
    `;
    fetchMediaList(`${BASE_URL}/${type}/popular?api_key=${API_KEY}`, 'cat-trending', type);
    fetchMediaList(`${BASE_URL}/${type}/top_rated?api_key=${API_KEY}`, 'cat-top', type);
}

function renderSearchPage() {
    const container = document.getElementById('app-container');
    if (!container) return;
    container.innerHTML = `
        <div class="search-view-container">
            <input type="text" class="search-bar-input" placeholder="ابحث عن فيلم، مسلسل، أنمي..." oninput="handleSearch(this.value)">
            <h2 class="section-title" id="search-title">Trending Now</h2>
            <div id="search-results" class="grid-layout">جاري التحميل...</div>
        </div>
    `;
    fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}`);
}

async function handleSearch(query) {
    const titleEl = document.getElementById('search-title');
    if (!query.trim()) {
        if (titleEl) titleEl.innerText = 'Trending Now';
        fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}`);
        return;
    }
    if (titleEl) titleEl.innerText = 'نتائج البحث';
    fetchGridMedia(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
}

async function fetchGridMedia(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const container = document.getElementById('search-results');
        if (!container) return;
        
        const validResults = (data.results || []).filter(item => item.poster_path);
        
        container.innerHTML = validResults.map(item => {
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            const title = item.title || item.name;
            return `
                <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/${type}/${item.id}')">
                    <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    <img class="card-poster" src="${getPosterUrl(item.poster_path)}" alt="${title}">
                    <div class="card-info">
                        <div class="card-title">${title}</div>
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