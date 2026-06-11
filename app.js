/* ═══════════════════════════════════
   APP.JS — Navigation & Interactions
   ═══════════════════════════════════ */

'use strict';

// ── Audio Player Configuration ──
const AUDIO_CONFIG = {
  // Set to true to play a single compilation audio/video file.
  // Set to false to play individual YouTube tracks for each page.
  useSingleCompilation: false,

  // If useSingleCompilation is true, specify local file path or a single YouTube ID here
  singleSource: 'music.mp3', 

  // Individual tracks configuration (if useSingleCompilation is false)
  tracks: {
    '1': { id: '-UzDZMNZQ7Q', start: 0, title: 'Моё сердце', artist: 'Сплин', cover: 'images/scene1_seats.png' },
    '2': { id: 'fgiBmUy4UcM', start: 42, title: 'Мы', artist: 'Дайте танк (!)', cover: 'images/scene2_travel.png' },
    '3': { id: 'VG1zmgkDv-g', start: 0, title: 'солнце вышло покурить', artist: 'алёна швец.', cover: 'images/scene3_sun_moon.png' },
    '4': { id: '3u9M6NzP0R0', start: 10, title: 'Я и твой кот', artist: 'Свидание', cover: 'images/scene4_cats.png' },
    '5': { id: 'JTeKpWp8Psw', start: 34, title: 'Fourth of July', artist: 'Sufjan Stevens', cover: 'images/scene5_moon_tender.png' },
    '6': { id: 'XLRHkt6WNkg', start: 60, title: 'Будь моим смыслом', artist: 'Flëur', cover: 'images/scene6_heart_confession.png' },
    '7': { id: 'xpJ_fYyAeYk', start: 0, title: 'ХОЧЕШЬ?', artist: 'Земфира', cover: 'images/scene7_sun_lamp.png' },
    '8': { id: 'iggmiF7DNoM', start: 0, title: 'we fell in love in october', artist: 'girl in red', cover: 'images/scene8_girls_sunset.png' },
    '9': { id: 'T-hswDp-e2I', start: 0, title: 'Утро', artist: 'Дайте танк (!)', cover: 'images/scene9_morning.png' }
  },

  // Single compilation timestamps in seconds (if useSingleCompilation is true)
  timestamps: {
    'cover': 0,
    '1': 0,
    '2': 12,
    '3': 22,
    '4': 30,
    '5': 40,
    '6': 52,
    '7': 68,
    '8': 88,
    '9': 98
  }
};

// ── State ──
const state = {
  current: 'cover',
  transitioning: false,
  savedVolume: 0.5
};

// ── Audio player state ──
let currentTrackId = null;
let plyrPlayer = null;
let isAudioInitialized = false;

// ── Page order ──
const pageOrder = ['cover', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// ── DOM refs ──
const pagesContainer = document.getElementById('pages-container');
const navDots         = document.querySelectorAll('.nav-dot');
const heartsContainer = document.getElementById('hearts-container');

// ── Go to page ──
function goTo(targetId) {
  if (state.transitioning || targetId === state.current) return;
  state.transitioning = true;

  const fromPage = document.getElementById(`page-${state.current}`);
  const toPage   = document.getElementById(`page-${targetId}`);

  if (!toPage) { state.transitioning = false; return; }

  // Trigger audio playback
  if (targetId !== 'cover') {
    initAudio();
    playTrackForPage(targetId);
  } else if (plyrPlayer) {
    playTrackForPage('cover');
  }

  // Determine direction
  const fromIdx = pageOrder.indexOf(state.current);
  const toIdx   = pageOrder.indexOf(String(targetId));
  const goingForward = toIdx > fromIdx;

  // Exit current
  if (fromPage) {
    fromPage.classList.remove('active');
    fromPage.classList.add(goingForward ? 'exit-left' : 'exit-right');
  }

  // Enter next
  toPage.style.transform = goingForward ? 'translateX(6%)' : 'translateX(-6%)';
  toPage.style.opacity = '0';
  toPage.classList.add('active');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toPage.style.transform = '';
      toPage.style.opacity   = '';
      toPage.style.transition = 'opacity 0.65s cubic-bezier(0.77,0,0.175,1), transform 0.65s cubic-bezier(0.77,0,0.175,1)';
    });
  });

  state.current = String(targetId);
  updateNav();

  // Spawn hearts on certain pages
  if (['6', '7', '8'].includes(String(targetId))) {
    spawnHearts(5);
  }

  setTimeout(() => {
    if (fromPage) fromPage.classList.remove('exit-left', 'exit-right');
    toPage.style.transition = '';
    state.transitioning = false;
  }, 700);
}

// ── Update nav dots ──
function updateNav() {
  navDots.forEach(dot => {
    dot.classList.toggle('active', dot.dataset.page === state.current);
  });
}

// ── Bind nav dots ──
navDots.forEach(dot => {
  dot.addEventListener('click', () => goTo(dot.dataset.page));
});

// ── Bind start button ──
document.getElementById('btn-start').addEventListener('click', () => goTo('1'));
document.getElementById('btn-back-home').addEventListener('click', () => goTo('cover'));
document.getElementById('btn-home').addEventListener('click', () => goTo('cover'));

// ── Bind prev/next buttons ──
document.querySelectorAll('.btn-next, .btn-prev').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target) goTo(target);
  });
});

// ── Keyboard navigation ──
document.addEventListener('keydown', e => {
  const idx = pageOrder.indexOf(state.current);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (idx < pageOrder.length - 1) goTo(pageOrder[idx + 1]);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (idx > 0) goTo(pageOrder[idx - 1]);
  }
});

// ── Touch / swipe ──
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
    const idx = pageOrder.indexOf(state.current);
    if (dx < 0 && idx < pageOrder.length - 1) goTo(pageOrder[idx + 1]);
    else if (dx > 0 && idx > 0) goTo(pageOrder[idx - 1]);
  }
}, { passive: true });

// ── Floating Hearts ──
const heartEmojis = ['♥', '♡', '❤', '🌸', '✨', '★'];

function spawnHearts(count) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
      heart.style.animationDuration = (4 + Math.random() * 5) + 's';
      heart.style.color = ['#E8927C', '#D4607A', '#F5C842', '#5BB8C4', '#F0D5C0'][Math.floor(Math.random() * 5)];
      heartsContainer.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove());
    }, i * 200 + Math.random() * 300);
  }
}

// ── Ambient hearts on cover ──
function ambientHearts() {
  if (state.current === 'cover') {
    if (Math.random() < 0.3) spawnHearts(1);
  }
  setTimeout(ambientHearts, 2500);
}
ambientHearts();

// ── Mouse parallax on scene images ──
document.querySelectorAll('.scene-image-wrap').forEach(wrap => {
  wrap.addEventListener('mousemove', e => {
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
    wrap.querySelector('.scene-img').style.transform = `scale(1.04) translate(${x}px, ${y}px)`;
  });
  wrap.addEventListener('mouseleave', () => {
    wrap.querySelector('.scene-img').style.transform = '';
  });
});

// ── Scroll wheel navigation (debounced) ──
let wheelCooldown = false;
document.addEventListener('wheel', e => {
  if (wheelCooldown || state.transitioning) return;
  wheelCooldown = true;
  const idx = pageOrder.indexOf(state.current);
  if (e.deltaY > 30 && idx < pageOrder.length - 1) goTo(pageOrder[idx + 1]);
  else if (e.deltaY < -30 && idx > 0) goTo(pageOrder[idx - 1]);
  setTimeout(() => { wheelCooldown = false; }, 800);
}, { passive: true });

// ── Entrance animation on load ──
window.addEventListener('load', () => {
  document.getElementById('page-cover').classList.add('active');
  // subtle entrance
  const cover = document.getElementById('page-cover');
  cover.style.opacity = '0';
  cover.style.transform = 'scale(0.97)';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cover.style.transition = 'opacity 1s ease, transform 1s ease';
      cover.style.opacity = '1';
      cover.style.transform = '';
    });
  });
  setTimeout(() => { cover.style.transition = ''; }, 1100);
});

// ── Audio Player Functions ──
function initAudio() {
  if (isAudioInitialized) return;
  isAudioInitialized = true;

  // Initialize Plyr player instance
  plyrPlayer = new Plyr('#plyr-player', {
    controls: [],
    autoplay: false,
    clickToPlay: false,
    keyboard: { focused: false, global: false }
  });

  // Set default volume
  plyrPlayer.volume = state.savedVolume;

  // Set initial slider value
  const volumeSlider = document.getElementById('player-volume-slider');
  if (volumeSlider) {
    volumeSlider.value = state.savedVolume * 100;
  }

  // Bind controls
  const playPauseBtn = document.getElementById('player-btn-play-pause');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (plyrPlayer.playing) {
        plyrPlayer.pause();
      } else {
        plyrPlayer.play().catch(e => console.log("Play failed:", e));
      }
    });
  }

  const prevBtn = document.getElementById('player-btn-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const idx = pageOrder.indexOf(state.current);
      if (idx > 1) {
        goTo(pageOrder[idx - 1]);
      }
    });
  }

  const nextBtn = document.getElementById('player-btn-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const idx = pageOrder.indexOf(state.current);
      if (idx < pageOrder.length - 1 && idx > 0) {
        goTo(pageOrder[idx + 1]);
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = e.target.value / 100;
      plyrPlayer.volume = vol;
      state.savedVolume = vol;
      updateVolumeIcon(vol);
    });
  }

  const volumeIcon = document.getElementById('player-volume-icon');
  if (volumeIcon) {
    volumeIcon.addEventListener('click', () => {
      if (plyrPlayer.volume > 0) {
        state.savedVolume = plyrPlayer.volume;
        plyrPlayer.volume = 0;
        if (volumeSlider) volumeSlider.value = 0;
      } else {
        const targetVol = state.savedVolume > 0 ? state.savedVolume : 0.5;
        plyrPlayer.volume = targetVol;
        if (volumeSlider) volumeSlider.value = targetVol * 100;
      }
      updateVolumeIcon(plyrPlayer.volume);
    });
  }

  // Handle player state changes for UI updates
  plyrPlayer.on('play', () => {
    document.getElementById('custom-music-player').classList.add('playing');
    if (playPauseBtn) playPauseBtn.textContent = '⏸';
  });

  plyrPlayer.on('pause', () => {
    document.getElementById('custom-music-player').classList.remove('playing');
    if (playPauseBtn) playPauseBtn.textContent = '▶';
  });

  // Track ready event
  plyrPlayer.on('ready', () => {
    if (!AUDIO_CONFIG.useSingleCompilation && currentTrackId) {
      const startSec = AUDIO_CONFIG.tracks[currentTrackId].start;
      safeSeek(startSec);
    } else if (AUDIO_CONFIG.useSingleCompilation) {
      const targetTime = AUDIO_CONFIG.timestamps[state.current] || 0;
      safeSeek(targetTime);
    }
    plyrPlayer.play().catch(err => console.log("Autoplay prevented:", err));
  });
}

function playTrackForPage(pageId) {
  if (!plyrPlayer) return;

  const playerEl = document.getElementById('custom-music-player');

  if (pageId === 'cover') {
    playerEl.classList.add('player-hidden');
    plyrPlayer.pause();
    return;
  }

  playerEl.classList.remove('player-hidden');

  if (AUDIO_CONFIG.useSingleCompilation) {
    const targetTime = AUDIO_CONFIG.timestamps[pageId] || 0;
    
    // Set source if not set
    if (!plyrPlayer.source || plyrPlayer.source === '') {
      const isYouTube = !AUDIO_CONFIG.singleSource.includes('.') && !AUDIO_CONFIG.singleSource.includes('/');
      plyrPlayer.source = {
        type: isYouTube ? 'video' : 'audio',
        sources: [
          {
            src: AUDIO_CONFIG.singleSource,
            provider: isYouTube ? 'youtube' : 'html5',
            type: isYouTube ? undefined : 'audio/mp3'
          }
        ]
      };
    } else {
      safeSeek(targetTime);
      plyrPlayer.play().catch(e => console.log("Play failed:", e));
    }

    // Update UI for compilation
    document.getElementById('player-track-title').textContent = 'Признание в строчках';
    document.getElementById('player-track-artist').textContent = 'Микстейп для тебя';
    document.getElementById('player-cover-img').src = 'images/cover_hero.png';

  } else {
    // Individual track mode
    const track = AUDIO_CONFIG.tracks[pageId];
    if (!track) return;

    if (currentTrackId !== pageId) {
      currentTrackId = pageId;
      
      // Update UI immediately
      document.getElementById('player-track-title').textContent = track.title;
      document.getElementById('player-track-artist').textContent = track.artist;
      document.getElementById('player-cover-img').src = track.cover || 'images/cover_hero.png';

      // Set source
      plyrPlayer.source = {
        type: 'video',
        sources: [
          {
            src: track.id,
            provider: 'youtube'
          }
        ]
      };
    } else {
      // Resume play if paused
      plyrPlayer.play().catch(e => console.log("Play failed:", e));
    }
  }
}

function safeSeek(time) {
  if (!plyrPlayer) return;
  try {
    plyrPlayer.currentTime = time;
  } catch (e) {
    console.warn("Seeking failed, retrying on timeupdate", e);
    const seekOnTimeupdate = () => {
      try {
        plyrPlayer.currentTime = time;
        plyrPlayer.off('timeupdate', seekOnTimeupdate);
      } catch (err) {}
    };
    plyrPlayer.on('timeupdate', seekOnTimeupdate);
  }
}

function updateVolumeIcon(vol) {
  const icon = document.getElementById('player-volume-icon');
  if (!icon) return;
  if (vol === 0) icon.textContent = '🔇';
  else if (vol < 0.4) icon.textContent = '🔈';
  else if (vol < 0.7) icon.textContent = '🔉';
  else icon.textContent = '🔊';
}

