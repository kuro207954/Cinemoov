const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';
const PLACEHOLDER_IMG = 'https://via.placeholder.com/500x750/1f1f1f/FFFFFF?text=CineMoov';

// Views
const homeView = document.getElementById('homeView');
const gridView = document.getElementById('gridView');
const detailView = document.getElementById('detailView');

// Home Containers
const rowTrendingMovies = document.getElementById('rowTrendingMovies');
const rowTrendingTV = document.getElementById('rowTrendingTV');
const rowTopMovies = document.getElementById('rowTopMovies');
const rowTopTV = document.getElementById('rowTopTV');
const continueWatchingSection = document.getElementById('continueWatchingSection');
const continueWatchingGrid = document.getElementById('continueWatchingGrid');

// Details
const detailPoster = document.getElementById('detailPoster');
const detailTitle = document.getElementById('detailTitle');
const detailOverview = document.getElementById('detailOverview');
const detailRating = document.getElementById('detailRating');
const detailYear = document.getElementById('detailYear');
const detailType = document.getElementById('detailType');
const detailBackdrop = document.getElementById('detailBackdrop');

const videoPlayer = document.getElementById('videoPlayer');
const backBtn = document.getElementById('backBtn');
const tvControlsPanel = document.getElementById('tvControlsPanel');
const seasonSelect = document.getElementById('seasonSelect');
const episodesList = document.getElementById('episodesList');
const serverBtns = document.querySelectorAll('.server-btn');

// State
let currentItem = null;
let currentServer = 'vidsrc';
let currentSeason = 1;
let currentEpisode = 1;

// App Init
init();

function init() {
    setupNavbar();
    setupMobileDrawer();
    setupSearch();
    loadHomePage();
}

function showView(view) {
    homeView.style.display = view === 'home' ? 'block' : 'none';
    gridView.style.display = view === 'grid' ? 'block' : 'none';
    detailView.style.display = view === 'detail' ? 'block' : 'none';
    window.scrollTo(0, 0);
}

function setupNavbar() {
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

    document.querySelectorAll('.nav-link, .drawer-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const type = link.dataset.type;
            
            document.querySelectorAll('.nav-link, .drawer-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (type === 'home') {
                loadHomePage();
            } else if (type === 'movie') {
                showGrid('الأفلام الشائعة', `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ar-SA`, 'movie');
            } else if (type === 'tv') {
                showGrid('المسلسلات الشائعة', `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ar-SA`, 'tv');
            } else if (type === 'anime') {
                showGrid('عالم الأنمي', `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&language=ar-SA`, 'tv');
            }
            closeDrawer();
        });
    });

    document.getElementById('logoBtn').onclick = () => loadHomePage();
}

function setupMobileDrawer() {
    const btn = document.getElementById('menuToggleBtn');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const closeBtn = document.getElementById('closeDrawerBtn');

    btn.onclick = () => { drawer.classList.add('open'); overlay.classList.add('active'); };
    closeBtn.onclick = closeDrawer;
    overlay.onclick = closeDrawer;
}

function closeDrawer() {
    document.getElementById('mobileDrawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('active');
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            const query = input.value.trim();
            showGrid(`نتائج البحث عن: "${query}"`, `${BASE_URL}/search/multi?api_key=${API_KEY}&language=ar-SA&query=${encodeURIComponent(query)}`, 'multi');
        }
    });
}

function loadHomePage() {
    showView('home');
    loadHero();
    loadRow(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ar-SA`, rowTrendingMovies, 'movie');
    loadRow(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ar-SA`, rowTrendingTV, 'tv');
    loadRow(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA`, rowTopMovies, 'movie');
    loadRow(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=ar-SA`, rowTopTV, 'tv');
    loadContinueWatching();
}

async function loadHero() {
    try {
        const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ar-SA`);
        const data = await res.json();
        const item = data.results[0];

        document.getElementById('heroBg').style.backgroundImage = `url(${BACKDROP_URL}${item.backdrop_path})`;
        document.getElementById('heroTitle').textContent = item.title || item.name;
        document.getElementById('heroOverview').textContent = item.overview || 'استمتع بمشاهدة أحدث الأعمال بجودة عالية.';
        document.getElementById('heroRating').innerHTML = `<i class="fas fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : '8.5'}`;
        document.getElementById('heroYear').textContent = (item.release_date || item.first_air_date || '').substring(0, 4);

        document.getElementById('heroPlayBtn').onclick = () => openDetail(item, 'movie');
        document.getElementById('heroMoreBtn').onclick = () => openDetail(item, 'movie');
    } catch (e) {
        console.error(e);
    }
}

async function loadRow(url, container, forceType) {
    container.innerHTML = '<p style="color:#666;">جاري التحميل...</p>';
    try {
        const res = await fetch(url);
        const data = await res.json();
        container.innerHTML = '';

        data.results.forEach(item => {
            const card = createCard(item, forceType);
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p style="color:#e50914;">تعذر الجلب</p>';
    }
}

function createCard(item, forceType) {
    const card = document.createElement('div');
    card.className = 'media-card';

    const title = item.title || item.name;
    const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : PLACEHOLDER_IMG;
    const type = item.media_type || forceType || (item.title ? 'movie' : 'tv');
    const year = (item.release_date || item.first_air_date || '').substring(0, 4);

    card.innerHTML = `
        <img src="${poster}" alt="${title}" onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';">
        <div class="card-details">
            <div class="card-title">${title}</div>
            <div class="card-sub">
                <span>${year}</span>
                <span class="card-rating"><i class="fas fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
            </div>
        </div>
    `;

    card.onclick = () => openDetail(item, type);
    return card;
}

function showGrid(title, url, defaultType) {
    showView('grid');
    document.getElementById('gridTitle').textContent = title;
    const container = document.getElementById('fullGrid');
    loadRow(url, container, defaultType);
}

// "عرض الكل" buttons
document.querySelectorAll('.see-more').forEach(btn => {
    btn.onclick = () => {
        const type = btn.dataset.type;
        if (type === 'movie_trending') showGrid('الأفلام الرائجة', `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ar-SA`, 'movie');
        if (type === 'tv_trending') showGrid('المسلسلات الرائجة', `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=ar-SA`, 'tv');
        if (type === 'movie_top') showGrid('الأفلام الأعلى تقييماً', `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar-SA`, 'movie');
        if (type === 'tv_top') showGrid('المسلسلات الأعلى تقييماً', `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=ar-SA`, 'tv');
    };
});

// Detail View & Stream Player
async function openDetail(item, type) {
    currentItem = {
        id: item.id,
        type: type,
        title: item.title || item.name,
        poster: item.poster_path,
        backdrop: item.backdrop_path,
        overview: item.overview,
        vote: item.vote_average,
        date: item.release_date || item.first_air_date
    };

    saveToHistory(currentItem);
    showView('detail');

    detailTitle.textContent = currentItem.title;
    detailOverview.textContent = currentItem.overview || 'لا يوجد وصف متاح لهذا العمل.';
    detailRating.innerHTML = `<i class="fas fa-star"></i> ${currentItem.vote ? currentItem.vote.toFixed(1) : 'N/A'}`;
    detailYear.textContent = (currentItem.date || '').substring(0, 4);
    detailType.textContent = type === 'movie' ? 'فيلم' : 'مسلسل';

    detailPoster.src = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : PLACEHOLDER_IMG;
    if (item.backdrop_path) {
        detailBackdrop.style.backgroundImage = `url(${BACKDROP_URL}${item.backdrop_path})`;
    } else {
        detailBackdrop.style.backgroundImage = 'none';
    }

    if (type === 'tv') {
        tvControlsPanel.style.display = 'block';
        await loadSeasons(item.id);
    } else {
        tvControlsPanel.style.display = 'none';
        updateVideoSrc();
    }
}

backBtn.onclick = () => {
    videoPlayer.src = '';
    loadHomePage();
};

async function loadSeasons(tvId) {
    try {
        const res = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=ar-SA`);
        const data = await res.json();

        seasonSelect.innerHTML = '';
        if (data.seasons) {
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
                const btn = document.createElement('div');
                btn.className = 'ep-btn';
                btn.textContent = `حلقة ${ep.episode_number}: ${ep.name}`;
                btn.onclick = () => {
                    document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentEpisode = ep.episode_number;
                    updateVideoSrc();
                };
                episodesList.appendChild(btn);
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

// Watch History (LocalStorage)
function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    history = history.filter(i => i.id !== item.id);
    history.unshift(item);
    if (history.length > 10) history.pop();
    localStorage.setItem('watchHistory', JSON.stringify(history));
    loadContinueWatching();
}

function loadContinueWatching() {
    const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    if (history.length > 0) {
        continueWatchingSection.style.display = 'block';
        continueWatchingGrid.innerHTML = '';
        history.forEach(item => {
            const card = createCard(item, item.type);
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeFromHistory(item.id);
            };
            card.appendChild(removeBtn);
            continueWatchingGrid.appendChild(card);
        });
    } else {
        continueWatchingSection.style.display = 'none';
    }
}

function removeFromHistory(id) {
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    history = history.filter(i => i.id !== id);
    localStorage.setItem('watchHistory', JSON.stringify(history));
    loadContinueWatching();
}