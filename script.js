const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

// صورة احتياطية مصممة ديناميكياً لضمان عدم ظهور أي كرت فارغ أو أسود
const PLACEHOLDER_IMG = 'https://via.placeholder.com/500x750/1c1f2a/FFFFFF?text=CineMoov';

// DOM Elements
const homeView = document.getElementById('homeView');
const gridView = document.getElementById('gridView');
const detailView = document.getElementById('detailView');

const rowTrendingMovies = document.getElementById('rowTrendingMovies');
const rowTrendingTV = document.getElementById('rowTrendingTV');
const rowTopRated = document.getElementById('rowTopRated');
const continueWatchingSection = document.getElementById('continueWatchingSection');
const continueWatchingGrid = document.getElementById('continueWatchingGrid');

const fullGrid = document.getElementById('fullGrid');
const gridTitle = document.getElementById('gridTitle');

const heroBanner = document.getElementById('heroBanner');
const heroTitle = document.getElementById('heroTitle');
const heroOverview = document.getElementById('heroOverview');
const heroPlayBtn = document.getElementById('heroPlayBtn');

const detailHeader = document.getElementById('detailHeader');
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const videoPlayer = document.getElementById('videoPlayer');
const backBtn = document.getElementById('backBtn');
const tvControls = document.getElementById('tvControls');
const seasonSelect = document.getElementById('seasonSelect');
const episodesList = document.getElementById('episodesList');
const serverBtns = document.querySelectorAll('.server-btn');

// Mobile Menu Elements
const menuToggleBtn = document.getElementById('menuToggleBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

let currentItem = null;
let currentServer = 'vidsrc';
let currentSeason = 1;
let currentEpisode = 1;

// Mobile Menu Logic
function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}

if (menuToggleBtn) menuToggleBtn.addEventListener('click', toggleMobileMenu);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileMenu);

// Initialize
initHome();

function showView(view) {
    homeView.style.display = view === 'home' ? 'block' : 'none';
    gridView.style.display = view === 'grid' ? 'block' : 'none';
    detailView.style.display = view === 'detail' ? 'block' : 'none';
    window.scrollTo(0, 0);
    closeMobileMenu();
}

async function initHome() {
    showView('home');
    loadHero();
    fetchMedia(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ar-SA`, rowTrendingMovies, 'movie');
    fetchMedia(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ar-SA`, rowTrendingTV, 'tv');
    fetchMedia(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA`, rowTopRated, 'movie');
    loadContinueWatching();
}

// Hero Load
async function loadHero() {
    try {
        const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ar-SA`);
        const data = await res.json();
        const item = data.results[0];

        if (item.backdrop_path) {
            heroBanner.style.backgroundImage = `url(${BACKDROP_URL}${item.backdrop_path})`;
        }
        heroTitle.textContent = item.title || item.name;
        heroOverview.textContent = item.overview || 'استمتع بمشاهدة أفضل الأعمال السينمائية بجودة عالية وبدون إعلانات مزعجة.';
        heroPlayBtn.onclick = () => openDetail(item, 'tv');
    } catch (e) {
        console.error(e);
    }
}

// Navigation Menu
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const type = btn.dataset.type;
        if (type === 'home') {
            initHome();
        } else if (type === 'movie') {
            showGrid('الأفلام الشائعة', `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ar-SA`, 'movie');
        } else if (type === 'tv') {
            showGrid('المسلسلات الشائعة', `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ar-SA`, 'tv');
        } else if (type === 'anime') {
            showGrid('أنمي', `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&language=ar-SA`, 'tv');
        }
    });
});

// View All Buttons
document.querySelectorAll('.see-more-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        if (type === 'movie') {
            showGrid('الأفلام الأكثر شهرة', `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ar-SA`, 'movie');
        } else if (type === 'tv') {
            showGrid('المسلسلات الأكثر شهرة', `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ar-SA`, 'tv');
        } else if (type === 'top_rated') {
            showGrid('الأعلى تقييماً', `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA`, 'movie');
        }
    });
});

// Search
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
            showGrid(`نتائج البحث عن: "${query}"`, `${BASE_URL}/search/multi?api_key=${API_KEY}&language=ar-SA&query=${encodeURIComponent(query)}`, 'multi');
        }
    }
});

function showGrid(title, url, defaultType) {
    showView('grid');
    gridTitle.textContent = title;
    fetchMedia(url, fullGrid, defaultType);
}

// Fetch Media
async function fetchMedia(url, container, forceType) {
    container.innerHTML = '<p style="color:#aaa; padding:10px;">جاري تحميل المحتوى...</p>';
    try {
        const res = await fetch(url);
        const data = await res.json();
        container.innerHTML = '';

        if (!data.results || data.results.length === 0) {
            container.innerHTML = '<p style="color:#aaa; padding:10px;">لم يتم العثور على نتائج.</p>';
            return;
        }

        data.results.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('card');
            const title = item.title || item.name;
            const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : PLACEHOLDER_IMG;
            const type = item.media_type || forceType || (item.title ? 'movie' : 'tv');

            card.innerHTML = `
                <img src="${poster}" alt="${title}" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';">
                <div class="card-info">
                    <div class="card-title">${title}</div>
                    <div class="card-rating"><i class="fas fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</div>
                </div>
            `;

            card.onclick = () => openDetail(item, type);
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p style="color:#e50914; padding:10px;">تعذر تحميل البيانات، يرجى المحاولة لاحقاً.</p>';
    }
}

// Detail View & Streaming
async function openDetail(item, type) {
    currentItem = { 
        id: item.id, 
        type: type, 
        title: item.title || item.name, 
        poster: item.poster_path,
        backdrop: item.backdrop_path,
        overview: item.overview
    };

    saveToContinueWatching(currentItem);
    showView('detail');

    detailTitle.textContent = currentItem.title;
    detailOverview.textContent = currentItem.overview || 'لا يوجد وصف متاح لهذا العمل حالياً.';
    detailPoster.src = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : PLACEHOLDER_IMG;
    detailPoster.onerror = function() { this.src = PLACEHOLDER_IMG; };

    if (item.backdrop_path) {
        detailHeader.style.backgroundImage = `url(${BACKDROP_URL}${item.backdrop_path})`;
    } else {
        detailHeader.style.backgroundImage = 'none';
    }

    if (type === 'tv') {
        tvControls.style.display = 'block';
        await loadSeasons(item.id);
    } else {
        tvControls.style.display = 'none';
        updateVideoSrc();
    }
}

backBtn.onclick = () => {
    videoPlayer.src = '';
    initHome();
};

async function loadSeasons(tvId) {
    try {
        const res = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=ar-SA`);
        const data = await res.json();

        seasonSelect.innerHTML = '';
        if (data.seasons && data.seasons.length > 0) {
            data.seasons.forEach(s => {
                if (s.season_number > 0) {
                    const opt = document.createElement('option');
                    opt.value = s.season_number;
                    opt.textContent = `الموسم ${s.season_number}`;
                    seasonSelect.appendChild(opt);
                }
            });
            currentSeason = seasonSelect.value || 1;
            loadEpisodes(tvId, currentSeason);
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadEpisodes(tvId, seasonNum) {
    try {
        const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}&language=ar-SA`);
        const data = await res.json();

        episodesList.innerHTML = '';
        if (data.episodes) {
            data.episodes.forEach(ep => {
                const div = document.createElement('div');
                div.classList.add('ep-item');
                div.textContent = `الحلقة ${ep.episode_number}: ${ep.name || ''}`;
                div.onclick = () => {
                    document.querySelectorAll('.ep-item').forEach(d => d.classList.remove('active'));
                    div.classList.add('active');
                    currentEpisode = ep.episode_number;
                    updateVideoSrc();
                };
                episodesList.appendChild(div);
            });
        }
        currentEpisode = 1;
        updateVideoSrc();
    } catch (e) {
        console.error(e);
    }
}

seasonSelect.onchange = () => {
    currentSeason = seasonSelect.value;
    loadEpisodes(currentItem.id, currentSeason);
};

// 4 Streaming Servers
serverBtns.forEach(btn => {
    btn.onclick = () => {
        serverBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentServer = btn.dataset.server;
        updateVideoSrc();
    };
});

function updateVideoSrc() {
    if (!currentItem) return;
    let url = '';
    const { id, type } = currentItem;

    if (type === 'movie') {
        if (currentServer === 'vidsrc') url = `https://vidsrc.to/embed/movie/${id}`;
        else if (currentServer === 'superembed') url = `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
        else if (currentServer === 'autoembed') url = `https://player.autoembed.cc/embed/movie/${id}`;
        else if (currentServer === '2embed') url = `https://www.2embed.cc/embed/${id}`;
    } else {
        if (currentServer === 'vidsrc') url = `https://vidsrc.to/embed/tv/${id}/${currentSeason}/${currentEpisode}`;
        else if (currentServer === 'superembed') url = `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`;
        else if (currentServer === 'autoembed') url = `https://player.autoembed.cc/embed/tv/${id}/${currentSeason}/${currentEpisode}`;
        else if (currentServer === '2embed') url = `https://www.2embed.cc/embedtv/${id}&s=${currentSeason}&e=${currentEpisode}`;
    }
    videoPlayer.src = url;
}

// Continue Watching
function saveToContinueWatching(item) {
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    history = history.filter(i => i.id !== item.id);
    history.unshift(item);
    if (history.length > 10) history.pop();
    localStorage.setItem('watchHistory', JSON.stringify(history));
    loadContinueWatching();
}

function removeFromHistory(e, id) {
    e.stopPropagation();
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    history = history.filter(item => item.id !== id);
    localStorage.setItem('watchHistory', JSON.stringify(history));
    loadContinueWatching();
}

function loadContinueWatching() {
    const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    if (history.length > 0) {
        continueWatchingSection.style.display = 'block';
        continueWatchingGrid.innerHTML = '';
        history.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('card');
            const poster = item.poster ? `${IMAGE_URL}${item.poster}` : PLACEHOLDER_IMG;

            card.innerHTML = `
                <button class="remove-history-btn" onclick="removeFromHistory(event, ${item.id})"><i class="fas fa-times"></i></button>
                <img src="${poster}" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';">
                <div class="card-info">
                    <div class="card-title">${item.title}</div>
                </div>
            `;
            card.onclick = () => openDetail(item, item.type);
            continueWatchingGrid.appendChild(card);
        });
    } else {
        continueWatchingSection.style.display = 'none';
    }
}