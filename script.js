const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

const gridTrending = document.getElementById('gridTrending');
const gridTopRated = document.getElementById('gridTopRated');
const topRatedSection = document.getElementById('topRatedSection');
const continueWatchingSection = document.getElementById('continueWatchingSection');
const continueWatchingGrid = document.getElementById('continueWatchingGrid');

const heroBanner = document.getElementById('heroBanner');
const heroTitle = document.getElementById('heroTitle');
const heroOverview = document.getElementById('heroOverview');
const heroPlayBtn = document.getElementById('heroPlayBtn');

const playerModal = document.getElementById('playerModal');
const videoPlayer = document.getElementById('videoPlayer');
const closeModal = document.querySelector('.close-modal');
const modalMediaTitle = document.getElementById('modalMediaTitle');
const tvControlsModal = document.getElementById('tvControlsModal');
const modalSeasonSelect = document.getElementById('modalSeasonSelect');
const episodesList = document.getElementById('episodesList');
const serverBtns = document.querySelectorAll('.server-btn');

let currentItem = null;
let currentServer = 'vidsrc';
let currentSeason = 1;
let currentEpisode = 1;

// التحميل الأولي
initHome();

async function initHome() {
    loadHero();
    fetchMedia(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=ar`, gridTrending);
    fetchMedia(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar`, gridTopRated);
    loadContinueWatching();
}

// جلب البنر الرئيسي
async function loadHero() {
    try {
        const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=ar`);
        const data = await res.json();
        const item = data.results[0];
        
        heroBanner.style.backgroundImage = `url(${BACKDROP_URL}${item.backdrop_path})`;
        heroTitle.textContent = item.title || item.name;
        heroOverview.textContent = item.overview || 'لا يوجد وصف متاح.';
        
        heroPlayBtn.onclick = () => openPlayer(item, 'movie');
    } catch (e) {
        console.error(e);
    }
}

// التنقل عبر القائمة الجانبية
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const type = btn.dataset.type;
        topRatedSection.style.display = 'block';

        if (type === 'home') {
            initHome();
        } else if (type === 'movie') {
            document.getElementById('section1Title').innerHTML = '<i class="fas fa-compact-disc"></i> الأفلام الرائجة';
            fetchMedia(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ar`, gridTrending);
            fetchMedia(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ar`, gridTopRated);
        } else if (type === 'tv') {
            document.getElementById('section1Title').innerHTML = '<i class="fas fa-tv"></i> المسلسلات الرائجة';
            fetchMedia(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=ar`, gridTrending);
            fetchMedia(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=ar`, gridTopRated);
        } else if (type === 'anime') {
            document.getElementById('section1Title').innerHTML = '<i class="fas fa-mask"></i> أنمي شائع';
            fetchMedia(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&language=ar`, gridTrending);
            topRatedSection.style.display = 'none';
        }
    });
});

// البحث
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
            document.getElementById('section1Title').textContent = `نتائج البحث عن: ${query}`;
            fetchMedia(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=ar&query=${encodeURIComponent(query)}`, gridTrending);
            topRatedSection.style.display = 'none';
        }
    }
});

// جلب العروض لعرضها في الشبكة
async function fetchMedia(url, container) {
    container.innerHTML = '<p style="color:#aaa;">جاري التحميل...</p>';
    try {
        const res = await fetch(url);
        const data = await res.json();
        container.innerHTML = '';

        data.results.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('card');
            const title = item.title || item.name;
            const poster = item.poster_path ? `${IMAGE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750';
            const type = item.title ? 'movie' : 'tv';

            card.innerHTML = `
                <img src="${poster}" alt="${title}">
                <div class="card-info">
                    <div class="card-title">${title}</div>
                    <div class="card-rating"><i class="fas fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</div>
                </div>
            `;

            card.onclick = () => openPlayer(item, type);
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p style="color:red;">حدث خطأ أثناء تحميل البيانات</p>';
    }
}

// المشغل وتخزين المشاهدات
async function openPlayer(item, type) {
    currentItem = { id: item.id, type: type, title: item.title || item.name, poster: item.poster_path };
    modalMediaTitle.textContent = currentItem.title;
    saveToContinueWatching(currentItem);

    if (type === 'tv') {
        tvControlsModal.style.display = 'block';
        await loadSeasons(item.id);
    } else {
        tvControlsModal.style.display = 'none';
        updateVideoSrc();
    }

    playerModal.style.display = 'flex';
}

async function loadSeasons(tvId) {
    const res = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=ar`);
    const data = await res.json();

    modalSeasonSelect.innerHTML = '';
    data.seasons.forEach(s => {
        if (s.season_number > 0) {
            const opt = document.createElement('option');
            opt.value = s.season_number;
            opt.textContent = `الموسم ${s.season_number}`;
            modalSeasonSelect.appendChild(opt);
        }
    });

    currentSeason = modalSeasonSelect.value || 1;
    loadEpisodes(tvId, currentSeason);
}

async function loadEpisodes(tvId, seasonNum) {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}&language=ar`);
    const data = await res.json();

    episodesList.innerHTML = '';
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

    currentEpisode = 1;
    updateVideoSrc();
}

modalSeasonSelect.onchange = () => {
    currentSeason = modalSeasonSelect.value;
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
        url = currentServer === 'vidsrc' ? `https://vidsrc.to/embed/movie/${id}` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
    } else {
        url = currentServer === 'vidsrc' ? `https://vidsrc.to/embed/tv/${id}/${currentSeason}/${currentEpisode}` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`;
    }
    videoPlayer.src = url;
}

// حفظ في "تابع المشاهدة" (LocalStorage)
function saveToContinueWatching(item) {
    let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    history = history.filter(i => i.id !== item.id);
    history.unshift(item);
    if (history.length > 6) history.pop();
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
            const poster = item.poster ? `${IMAGE_URL}${item.poster}` : 'https://via.placeholder.com/500x750';
            card.innerHTML = `<img src="${poster}"><div class="card-info"><div class="card-title">${item.title}</div></div>`;
            card.onclick = () => openPlayer(item, item.type);
            continueWatchingGrid.appendChild(card);
        });
    }
}

closeModal.onclick = () => {
    playerModal.style.display = 'none';
    videoPlayer.src = '';
};