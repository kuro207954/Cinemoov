const API_KEY = 'e45956e29bfc581e0131eb6710b738c0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';
const NO_IMAGE_URL = 'https://via.placeholder.com/300x450/19212b/ffffff?text=No+Image';

let heroInterval;
let currentCompanyPage = 1;
let currentCompanyId = null;
let allCompanyMovies = [];

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
        renderCompanyPage(parts[2], decodeURIComponent(parts[3] || 'Company'));
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

// 1. Home Page (LTR English + Studio & Network Logos matched with image)
async function renderHomePage() {
    const container = document.getElementById('app-container');
    if (!container) return;

    const continueWatching = JSON.parse(localStorage.getItem('continue_watching') || '[]');

    container.innerHTML = `
        <div id="hero-banner" class="hero-slider-container"></div>

        ${continueWatching.length > 0 ? createSectionHTML('cw-list', 'fa-rotate-left', 'Continue Watching') : ''}

        <!-- Networks Section -->
        <section class="section-container">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-solid fa-tv"></i> Popular Networks</h2>
            </div>
            <div class="networks-grid">
                <div class="network-card net-netflix" onclick="navigateTo('#/company/178464/Netflix')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix">
                </div>
                <div class="network-card net-disney" onclick="navigateTo('#/company/2/Disney')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg" alt="Disney+">
                </div>
                <div class="network-card net-prime" onclick="navigateTo('#/company/1024/Amazon')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.svg" alt="Prime Video">
                </div>
                <div class="network-card net-hbo" onclick="navigateTo('#/company/3268/HBO')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg" alt="HBO Max" style="filter: brightness(0) invert(1);">
                </div>
                <div class="network-card net-apple" onclick="navigateTo('#/company/2552/Apple%20TV')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg" alt="Apple TV+" style="filter: brightness(0) invert(1);">
                </div>
                <div class="network-card net-hulu" onclick="navigateTo('#/company/453/Hulu')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg" alt="Hulu">
                </div>
                <div class="network-card net-crunchyroll" onclick="navigateTo('#/company/11123/Crunchyroll')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Crunchyroll_Logo.svg" alt="Crunchyroll" style="filter: brightness(0) invert(1);">
                </div>
                <div class="network-card net-paramount" onclick="navigateTo('#/company/4/Paramount')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Paramount_Pictures_2022.svg" alt="Paramount+" style="filter: brightness(0) invert(1);">
                </div>
            </div>

            <!-- Studios Section -->
            <div class="section-header" style="margin-top: 35px;">
                <h2 class="section-title"><i class="fa-solid fa-building"></i> Popular Studios</h2>
            </div>
            <div class="studios-grid">
                <div class="studio-card" onclick="navigateTo('#/company/420/Marvel%20Studios')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/Marvel-Language-Bean.svg" alt="Marvel Studios">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/3/Pixar')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/40/Pixar_Loop.svg" alt="Pixar">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/2/Walt%20Disney')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d2/Walt_Disney_Pictures_logo.svg" alt="Walt Disney">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/174/Warner%20Bros')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/64/Warner_Bros_logo.svg" alt="Warner Bros">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/33/Universal')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Universal_Pictures_logo.svg" alt="Universal">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/521/DreamWorks')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7d/DreamWorks_Animation_logo.svg" alt="DreamWorks">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/4/Paramount')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Paramount_Pictures_2022.svg" alt="Paramount">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/5/Columbia%20Pictures')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/03/Columbia_Pictures_2024_logo.svg" alt="Columbia Pictures">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/25/20th%20Century%20Studios')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d4/20th_Century_Studios_2020.svg" alt="20th Century Fox">
                </div>
                <div class="studio-card" onclick="navigateTo('#/company/923/Legendary')">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Legendary_Pictures_logo.svg" alt="Legendary">
                </div>
            </div>
        </section>
        
        ${createSectionHTML('trending-movies', 'fa-film', 'Trending Movies')}
        ${createSectionHTML('trending-tv', 'fa-tv', 'Trending TV Shows')}
        ${createSectionHTML('top-movies', 'fa-star', 'Top Rated Movies')}
        ${createSectionHTML('top-tv', 'fa-crown', 'Top Rated TV Shows')}
    `;

    if (continueWatching.length > 0) renderSavedList(continueWatching, 'cw-list', true);
    
    loadHeroBanner();
    fetchMediaList(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=en-US`, 'trending-movies', 'movie');
    fetchMediaList(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}&language=en-US`, 'trending-tv', 'tv');
    fetchMediaList(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`, 'top-movies', 'movie');
    fetchMediaList(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US`, 'top-tv', 'tv');
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
            <div class="media-carousel" id="${id}">Loading...</div>
        </section>
    `;
}

function renderSavedList(list, elementId, isContinueWatching = false) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = list.map(item => `
        <div class="media-card" onclick="navigateTo('#/watch/${item.type}/${item.id}')">
            ${isContinueWatching ? `<button class="remove-btn" title="Remove" onclick="event.stopPropagation(); removeFromContinueWatching('${item.id}', '${item.type}')"><i class="fa-solid fa-xmark"></i></button>` : ''}
            <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.rating || 'N/A'}</span>
            <img class="card-poster" src="${item.poster ? IMG_PATH + item.poster : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${item.title}">
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

// 2. Company Page (Load More + Filter Search)
async function renderCompanyPage(companyId, companyName) {
    const container = document.getElementById('app-container');
    if (!container) return;

    currentCompanyPage = 1;
    currentCompanyId = companyId;
    allCompanyMovies = [];

    container.innerHTML = `
        <div class="search-view-container">
            <h2 class="section-title" style="font-size: 24px; margin-bottom: 15px;">
                <i class="fa-solid fa-film"></i> All Content from: ${companyName}
            </h2>
            
            <input type="text" 
                   id="company-search-input" 
                   class="search-bar-input" 
                   placeholder="Search within ${companyName}..." 
                   oninput="filterCompanyMovies(this.value)"
                   style="margin-bottom: 25px;">

            <div id="company-results" class="grid-layout">Loading...</div>

            <div style="text-align: center; margin: 30px 0;">
                <button id="load-more-btn" class="btn-primary" onclick="loadMoreCompanyMovies()" style="display:none; padding: 12px 30px; font-size: 16px;">
                    <i class="fa-solid fa-plus"></i> Load More Movies
                </button>
            </div>
        </div>
    `;

    await fetchCompanyMovies();
}

async function fetchCompanyMovies() {
    try {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${currentCompanyId}&sort_by=popularity.desc&language=en-US&page=${currentCompanyPage}`);
        const data = await res.json();
        const grid = document.getElementById('company-results');
        const loadMoreBtn = document.getElementById('load-more-btn');
        
        if (!data.results || !data.results.length) {
            if (currentCompanyPage === 1) grid.innerHTML = '<p>No content available for this studio.</p>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        allCompanyMovies = [...allCompanyMovies, ...data.results];
        displayCompanyMovies(allCompanyMovies);

        if (loadMoreBtn) {
            if (currentCompanyPage < data.total_pages) {
                loadMoreBtn.style.display = 'inline-block';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch(e) { console.error(e); }
}

function displayCompanyMovies(movies) {
    const grid = document.getElementById('company-results');
    if (!grid) return;

    if (!movies.length) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No movies found matching your search.</p>';
        return;
    }

    grid.innerHTML = movies.map(item => `
        <div class="media-card" style="width:100%" onclick="navigateTo('#/watch/movie/${item.id}')">
            <span class="badge-rating"><i class="fa-solid fa-star"></i> ${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
            <img class="card-poster" src="${item.poster_path ? IMG_PATH + item.poster_path : NO_IMAGE_URL}" onerror="this.src='${NO_IMAGE_URL}'" alt="${item.title}">
            <div class="card-info">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">
                    <span>${(item.release_date || '').substring(0, 4)}</span>
                    <span>Movie</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadMoreCompanyMovies() {
    currentCompanyPage++;
    await fetchCompanyMovies();
}

function filterCompanyMovies(query) {
    const filtered = allCompanyMovies.filter(movie => 
        (movie.title || '').toLowerCase().includes(query.toLowerCase())
    );
    displayCompanyMovies(filtered);
}

// 3. Watch Page
async function renderWatchPage(type, id) {
    const container = document.getElementById('app-container');
    if (!container) return;

    container.innerHTML = `<div style="padding: 100px; text-align: center;">Preparing video player...</div>`;

    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=recommendations`);
        const data = await res.json();

        const title = data.title || data.name;
        const poster = data.poster_path;
        const backdrop = data.backdrop_path ? BACKDROP_PATH + data.backdrop_path : (poster ? IMG_PATH + poster : '');
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
                    <img class="watch-poster-img" src="${poster ? IMG_PATH + poster : NO_IMAGE_URL}" alt="${title}">
                    <div class="watch-details-info">
                        <h1 class="watch-title">${title}</h1>
                        <div class="watch-meta">
                            <span class="badge-rating">⭐ ${rating}</span>
                            <span>${(data.release_date || data.first_air_date || '').substring(0, 4)}</span>
                            <span>${type === 'movie' ? 'Movie' : 'TV Show'}</span>
                        </div>
                        <p class="watch-overview">${data.overview || 'No overview available.'}</p>
                    </div>
                </div>
            </div>

            <div class="watch-page-container">
                <div class="player-box-wrapper">
                    <iframe id="video-iframe" src="${server1}" allowfullscreen frameborder="0" scrolling="no"></iframe>
                </div>

                <div class="servers-section">
                    <h3 class="servers-title"><i class="fa-solid fa-server"></i> Choose Server:</h3>
                    <div class="servers-grid">
                        <button class="server-btn active" onclick="changeServer('${server1}', this)">Server 1 (VidLink)</button>
                        <button class="server-btn" onclick="changeServer('${server2}', this)">Server 2 (VidSrc)</button>
                        <button class="server-btn" onclick="changeServer('${server3}', this)">Server 3 (Pro)</button>
                        <button class="server-btn" onclick="changeServer('${server4}', this)">Server 4 (SmashyStream)</button>
                        <button class="server-btn" onclick="changeServer('${server5}', this)">Server 5 (2Embed)</button>
                        <button class="server-btn" onclick="changeServer('${server6}', this)">Server 6 (AutoEmbed)</button>
                    </div>
                </div>

                ${data.recommendations && data.recommendations.results.length ? `
                    <div class="recommendations-section">
                        <h2 class="section-title" style="margin-bottom:15px;"><i class="fa-solid fa-thumbs-up"></i> Recommended For You</h2>
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
                    </div>
                ` : ''}
            </div>
        `;
    } catch(e) {
        container.innerHTML = `<div style="padding: 50px; text-align: center; color: red;">Error loading data.</div>`;
    }
}

async function loadHeroBanner() {
    try {
        const res = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US`);
        const data = await res.json();
        if (!data.results || !data.results.length) return;
        
        const items = data.results.slice(0, 6);
        const heroBanner = document.getElementById('hero-banner');
        if (!heroBanner) return;

        heroBanner.innerHTML = items.map((item, idx) => `
            <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${item.backdrop_path ? BACKDROP_PATH + item.backdrop_path : ''}')">
                <div class="hero-overlay">
                    <div class="hero-content">
                        <span class="hero-badge">Featured</span>
                        <h1 class="hero-title">${item.title || item.name}</h1>
                        <p class="hero-overview">${item.overview || 'No overview available.'}</p>
                        <button class="btn-primary" onclick="navigateTo('#/watch/${item.media_type || 'movie'}/${item.id}')">
                            <i class="fa-solid fa-play"></i> Watch Now
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
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc&language=en-US`, 'anime-popular', 'tv');
    fetchMediaList(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200&language=en-US`, 'anime-top', 'tv');
}

async function renderCategoryPage(type, title) {
    const container = document.getElementById('app-container');
    if (!container) return;
    container.innerHTML = `
        ${createSectionHTML('cat-trending', 'fa-fire', `Trending ${title}`)}
        ${createSectionHTML('cat-top', 'fa-star', `Top Rated ${title}`)}
    `;
    fetchMediaList(`${BASE_URL}/${type}/popular?api_key=${API_KEY}&language=en-US`, 'cat-trending', type);
    fetchMediaList(`${BASE_URL}/${type}/top_rated?api_key=${API_KEY}&language=en-US`, 'cat-top', type);
}

function renderSearchPage() {
    const container = document.getElementById('app-container');
    if (!container) return;
    container.innerHTML = `
        <div class="search-view-container">
            <input type="text" class="search-bar-input" placeholder="Search movies, TV shows, anime..." oninput="handleSearch(this.value)">
            <h2 class="section-title" id="search-title">Trending Now</h2>
            <div id="search-results" class="grid-layout">Loading...</div>
        </div>
    `;
    fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=en-US`);
}

async function handleSearch(query) {
    const titleEl = document.getElementById('search-title');
    if (!query.trim()) {
        if (titleEl) titleEl.innerText = 'Trending Now';
        fetchGridMedia(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=en-US`);
        return;
    }
    if (titleEl) titleEl.innerText = 'Search Results';
    fetchGridMedia(`${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}`);
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