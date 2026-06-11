/* ═══════════════════════════════════
   APP.JS — Navigation, Interactions
   & YouTube IFrame Player API Audio
   ═══════════════════════════════════ */

'use strict';

// ══════════════════════════════════
//  TRACK CONFIG — YouTube Video IDs
//  start = seconds to seekTo when loading
// ══════════════════════════════════
const TRACKS = {
  '1': { videoId: '-UzDZMNZQ7Q', start: 0,   end: 20,  title: 'Моё сердце',              artist: 'Сплин',             cover: 'images/scene1_seats.png', lyrics: '«Мы не знали друг друга до этого лета...»' },
  '2': { videoId: 'fgiBmUy4UcM', start: 42,  end: 72,  title: 'Мы',                      artist: 'Дайте танк (!)',     cover: 'images/scene2_travel.png', lyrics: '«Мы решили: дорога каждая минута...»' },
  '3': { videoId: 'VG1zmgkDv-g', start: 0,   end: 22,  title: 'солнце вышло покурить',    artist: 'алёна швец.',       cover: 'images/scene3_sun_moon.png', lyrics: '«Солнце вышло покурить на балкон...»' },
  '4': { videoId: '3u9M6NzP0R0', start: 81,  end: 110, title: 'Я и твой кот',            artist: 'Свидание',          cover: 'images/scene4_cats.png', lyrics: '«Я и твой кот греем твою кровать...»' },
  '5': { videoId: 'JTeKpWp8Psw', start: 125, end: 160, title: 'Fourth of July',          artist: 'Sufjan Stevens',    cover: 'images/scene5_moon_tender.png', lyrics: '«Did you get enough love, my little dove?...»' },
  '6': { videoId: 'XLRHkt6WNkg', start: 60,  end: 75,  title: 'Будь моим смыслом',       artist: 'Flëur',             cover: 'images/scene6_heart_confession.png', lyrics: '«Пожалуйста, будь моим смыслом...»' },
  '7': { videoId: 'xpJ_fYyAeYk', start: 95,  end: 115, title: 'ХОЧЕШЬ?',                artist: 'Земфира',           cover: 'images/scene7_sun_lamp.png', lyrics: '«Хочешь солнце вместо лампы?...»' },
  '8': { videoId: 'iggmiF7DNoM', start: 42,  end: 65,  title: 'we fell in love in october', artist: 'girl in red',    cover: 'images/scene8_girls_sunset.png', lyrics: '«My girl, my girl, my girl — you will be my girl»' },
  '9': { videoId: 'T-hswDp-e2I', start: 45,  end: 75,  title: 'Утро',                    artist: 'Дайте танк (!)',     cover: 'images/scene9_morning.png', lyrics: '«Это не первое и не последнее утро...»' }
};

// ══════════════════════════════════
//  STATE
// ══════════════════════════════════
const state = {
  current: 'cover',
  transitioning: false
};

let ytPlayer       = null;   // YT.Player instance
let ytReady        = false;  // true once onPlayerReady fires
let ytApiReady     = false;  // true once onYouTubeIframeAPIReady fires
let currentTrackId = null;   // which page's track is loaded
let pendingPageId  = null;   // queued page to play when API finishes loading
let volumeLevel    = 50;     // 0..100

// ══════════════════════════════════
//  PAGE ORDER & DOM
// ══════════════════════════════════
const pageOrder     = ['cover', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const navDots       = document.querySelectorAll('.nav-dot');
const heartsContainer = document.getElementById('hearts-container');

// ══════════════════════════════════
//  YOUTUBE IFRAME API — Global callback
//  Called automatically by the API script
// ══════════════════════════════════
window.onYouTubeIframeAPIReady = function() {
  ytApiReady = true;
  // Don't create the player yet — wait until the user clicks "Начать"
  // so the first interaction gesture allows autoplay.
  if (pendingPageId) {
    createPlayerAndPlay(pendingPageId);
    pendingPageId = null;
  }
};

function createPlayerAndPlay(pageId) {
  const track = TRACKS[pageId];
  if (!track) return;

  if (ytPlayer) {
    // Player already exists — just load a new video
    loadTrack(pageId);
    return;
  }

  currentTrackId = pageId;
  updatePlayerUI(track);

  ytPlayer = new YT.Player('yt-player', {
    height: '1',
    width: '1',
    videoId: track.videoId,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      start: track.start,
      end: track.end,
      origin: window.location.origin
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError
    }
  });
}

function onPlayerReady(event) {
  ytReady = true;
  event.target.setVolume(volumeLevel);
  event.target.playVideo();
  showPlayer();
}

function onPlayerStateChange(event) {
  const playerEl = document.getElementById('custom-music-player');
  const btn      = document.getElementById('player-btn-play-pause');
  if (!playerEl || !btn) return;

  // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
  if (event.data === YT.PlayerState.PLAYING) {
    playerEl.classList.add('playing');
    btn.textContent = '⏸';
  } else if (event.data === YT.PlayerState.PAUSED) {
    playerEl.classList.remove('playing');
    btn.textContent = '▶';
  } else if (event.data === YT.PlayerState.ENDED) {
    // Auto-advance to next scene
    const idx = pageOrder.indexOf(state.current);
    if (idx > 0 && idx < pageOrder.length - 1) {
      goTo(pageOrder[idx + 1]);
    }
  }
}

function onPlayerError(event) {
  console.warn('YouTube Player Error:', event.data);
  // Try to continue — skip to next track if possible
}

// ══════════════════════════════════
//  LOAD & PLAY TRACKS
// ══════════════════════════════════
function loadTrack(pageId) {
  const track = TRACKS[pageId];
  if (!track) return;

  if (currentTrackId === pageId && ytPlayer && ytReady) {
    // Same track — just resume if paused
    const st = ytPlayer.getPlayerState();
    if (st === YT.PlayerState.PAUSED) {
      ytPlayer.playVideo();
    }
    return;
  }

  currentTrackId = pageId;
  updatePlayerUI(track);

  if (ytPlayer && ytReady) {
    ytPlayer.loadVideoById({
      videoId: track.videoId,
      startSeconds: track.start,
      endSeconds: track.end
    });
  }
}

function playTrackForPage(pageId) {
  const playerEl = document.getElementById('custom-music-player');

  if (pageId === 'cover') {
    // Pause & hide player on cover
    if (ytPlayer && ytReady) {
      ytPlayer.pauseVideo();
    }
    playerEl.classList.add('player-hidden');
    return;
  }

  // Show the player
  playerEl.classList.remove('player-hidden');

  if (!ytApiReady) {
    // API not ready yet — queue
    pendingPageId = pageId;
    return;
  }

  if (!ytPlayer) {
    createPlayerAndPlay(pageId);
  } else {
    loadTrack(pageId);
  }
}

function showPlayer() {
  const el = document.getElementById('custom-music-player');
  if (el) el.classList.remove('player-hidden');
}

function updatePlayerUI(track) {
  document.getElementById('player-track-title').textContent  = track.title;
  document.getElementById('player-track-artist').textContent = track.artist;
  document.getElementById('player-cover-img').src            = track.cover || 'images/cover_hero.png';

  // Update lyrics tooltip above the player
  const tooltip = document.getElementById('player-lyrics-tooltip');
  if (tooltip) {
    if (track.lyrics) {
      tooltip.textContent = track.lyrics;
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
  }
}

// ══════════════════════════════════
//  PLAYER CONTROLS BINDING
// ══════════════════════════════════
function bindPlayerControls() {
  const playPauseBtn = document.getElementById('player-btn-play-pause');
  const prevBtn      = document.getElementById('player-btn-prev');
  const nextBtn      = document.getElementById('player-btn-next');
  const volumeSlider = document.getElementById('player-volume-slider');
  const volumeIcon   = document.getElementById('player-volume-icon');

  playPauseBtn.addEventListener('click', () => {
    if (!ytPlayer || !ytReady) return;
    const st = ytPlayer.getPlayerState();
    if (st === YT.PlayerState.PLAYING) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  });

  prevBtn.addEventListener('click', () => {
    const idx = pageOrder.indexOf(state.current);
    if (idx > 1) goTo(pageOrder[idx - 1]);
  });

  nextBtn.addEventListener('click', () => {
    const idx = pageOrder.indexOf(state.current);
    if (idx > 0 && idx < pageOrder.length - 1) goTo(pageOrder[idx + 1]);
  });

  volumeSlider.addEventListener('input', (e) => {
    volumeLevel = parseInt(e.target.value, 10);
    if (ytPlayer && ytReady) {
      ytPlayer.setVolume(volumeLevel);
    }
    updateVolumeIcon(volumeLevel);
  });

  volumeIcon.addEventListener('click', () => {
    if (!ytPlayer || !ytReady) return;
    if (ytPlayer.getVolume() > 0) {
      volumeLevel = ytPlayer.getVolume(); // save
      ytPlayer.setVolume(0);
      volumeSlider.value = 0;
      updateVolumeIcon(0);
    } else {
      const restoreVol = volumeLevel > 0 ? volumeLevel : 50;
      ytPlayer.setVolume(restoreVol);
      volumeSlider.value = restoreVol;
      updateVolumeIcon(restoreVol);
    }
  });
}

function updateVolumeIcon(vol) {
  const icon = document.getElementById('player-volume-icon');
  if (!icon) return;
  if (vol === 0)       icon.textContent = '🔇';
  else if (vol < 34)   icon.textContent = '🔈';
  else if (vol < 67)   icon.textContent = '🔉';
  else                 icon.textContent = '🔊';
}

// ══════════════════════════════════
//  PAGE NAVIGATION
// ══════════════════════════════════
function goTo(targetId) {
  if (state.transitioning || targetId === state.current) return;
  state.transitioning = true;

  const fromPage = document.getElementById(`page-${state.current}`);
  const toPage   = document.getElementById(`page-${targetId}`);

  if (!toPage) { state.transitioning = false; return; }

  // ─ Trigger music ─
  playTrackForPage(targetId);

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

// ══════════════════════════════════
//  EVENT BINDINGS
// ══════════════════════════════════

// Nav dots
navDots.forEach(dot => {
  dot.addEventListener('click', () => goTo(dot.dataset.page));
});

// Start / home buttons
document.getElementById('btn-start').addEventListener('click', () => goTo('1'));
document.getElementById('btn-back-home').addEventListener('click', () => goTo('cover'));
document.getElementById('btn-home').addEventListener('click', () => goTo('cover'));

// Prev / next buttons in scenes
document.querySelectorAll('.btn-next, .btn-prev').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target) goTo(target);
  });
});

// Keyboard
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

// Touch / swipe
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

// ══════════════════════════════════
//  FLOATING HEARTS
// ══════════════════════════════════
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

function ambientHearts() {
  if (state.current === 'cover') {
    if (Math.random() < 0.3) spawnHearts(1);
  }
  setTimeout(ambientHearts, 2500);
}
ambientHearts();

// ══════════════════════════════════
//  MOUSE PARALLAX
// ══════════════════════════════════
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

// ══════════════════════════════════
//  SCROLL WHEEL NAV
// ══════════════════════════════════
let wheelCooldown = false;
document.addEventListener('wheel', e => {
  if (wheelCooldown || state.transitioning) return;
  wheelCooldown = true;
  const idx = pageOrder.indexOf(state.current);
  if (e.deltaY > 30 && idx < pageOrder.length - 1) goTo(pageOrder[idx + 1]);
  else if (e.deltaY < -30 && idx > 0) goTo(pageOrder[idx - 1]);
  setTimeout(() => { wheelCooldown = false; }, 800);
}, { passive: true });

// ══════════════════════════════════
//  INIT ON LOAD
// ══════════════════════════════════
window.addEventListener('load', () => {
  document.getElementById('page-cover').classList.add('active');
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

  // Bind player controls
  bindPlayerControls();
});

// ══════════════════════════════════
//  SCENE 5: INTERACTIVE LOVE LETTER
// ══════════════════════════════════
const scene5LetterTrigger = document.getElementById('scene5-letter-trigger');
const loveLetterCard = document.querySelector('.love-letter-card');
if (scene5LetterTrigger && loveLetterCard) {
  scene5LetterTrigger.addEventListener('click', () => {
    const isOpen = loveLetterCard.classList.toggle('visible');
    scene5LetterTrigger.classList.toggle('active', isOpen);
  });
}

// ══════════════════════════════════
//  EASTER EGG: LOVE LETTER & WALKING CATS
// ══════════════════════════════════
const LETTER_TEXT = `Моя любимая девочка!

Ты — мой мир, моё солнце и моё утро. Спасибо тебе за каждый твой взгляд, за твою нежную улыбку и за то, как сладко сопят наши кошки на кровати.

Впечатления — действительно наша валюта, и мы с тобой сказочно богаты. Любовь моя, пусть этот маленький музыкальный дневник всегда напоминает тебе о том, как сильно я тебя люблю!

Навсегда твой. ❤️`;

let letterInterval = null;
let catsInterval = null;

const outroHeartBtn = document.getElementById('outroHeartBtn');
if (outroHeartBtn) {
  outroHeartBtn.addEventListener('click', () => {
    openLoveLetterModal();
  });
}

function openLoveLetterModal() {
  const modal = document.getElementById('loveLetterModal');
  const envelope = document.getElementById('letterEnvelope');
  const container = document.getElementById('letterTextContainer');
  if (!modal || !envelope || !container) return;

  container.innerHTML = '';
  modal.classList.add('active');

  setTimeout(() => {
    envelope.classList.add('open');
    setTimeout(() => startTypewriterEffect(container, LETTER_TEXT), 800);
  }, 500);

  spawnWalkingCat('luna');
  setTimeout(() => spawnWalkingCat('athena'), 3000);

  if (catsInterval) clearInterval(catsInterval);
  catsInterval = setInterval(() => {
    if (!modal.classList.contains('active')) return;
    spawnWalkingCat(Math.random() > 0.5 ? 'luna' : 'athena');
  }, 7000);
}

function startTypewriterEffect(element, text) {
  if (letterInterval) clearInterval(letterInterval);
  let i = 0;
  letterInterval = setInterval(() => {
    if (i < text.length) {
      element.innerHTML += text[i++];
      const paper = document.querySelector('.letter-paper');
      if (paper) paper.scrollTop = paper.scrollHeight;
    } else {
      clearInterval(letterInterval);
    }
  }, 45);
}

function closeLoveLetterModal() {
  const modal = document.getElementById('loveLetterModal');
  const envelope = document.getElementById('letterEnvelope');
  if (modal) modal.classList.remove('active');
  if (envelope) envelope.classList.remove('open');
  if (letterInterval) clearInterval(letterInterval);
  if (catsInterval) clearInterval(catsInterval);
}

const closeLetterBtn = document.getElementById('closeLetterBtn');
if (closeLetterBtn) {
  closeLetterBtn.addEventListener('click', closeLoveLetterModal);
}
const modalBackdrop = document.getElementById('modalBackdrop');
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', closeLoveLetterModal);
}

function spawnWalkingCat(type) {
  const cat = document.createElement('div');
  cat.className = `walking-cat ${type}`;
  cat.style.bottom = (10 + Math.random() * 25) + 'px';
  const goRight = Math.random() > 0.5;
  cat.style.animation = goRight ? 'walkRight 13s linear forwards' : 'walkLeft 13s linear forwards';
  if (!goRight) cat.style.transform = 'scaleX(-1)';

  cat.addEventListener('click', () => {
    // Create self-contained simple audio context for the meow synth chirp if Web Audio is supported
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        const tempCtx = new AudioCtxClass();
        const now = tempCtx.currentTime;
        const osc = tempCtx.createOscillator();
        const g = tempCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.12, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(g);
        g.connect(tempCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }

    const bubble = document.createElement('div');
    bubble.className = 'meow-bubble';
    bubble.textContent = type === 'luna' ? 'Мяу! Люблю тебя! 🐾' : 'Мур-мур! Люблю тебя! 💕';
    cat.appendChild(bubble);
    setTimeout(() => bubble.remove(), 2500);
  });

  document.body.appendChild(cat);
  setTimeout(() => cat.remove(), 14000);
}
