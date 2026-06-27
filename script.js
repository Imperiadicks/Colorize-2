(() => {
  /*──────────────────────── helpers ────────────────────────*/
  const LOG = (...a) => console.log('[Colorize 2]', ...a);

  const rgb2hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
  };
  const H = o => `hsl(${o.h},${o.s}%,${o.l}%)`;
  const HA = (o, a) => `hsla(${o.h},${o.s}%,${o.l}%,${a})`;

  const parseHEX = hex => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    if (Number.isNaN(n)) return { h: 0, s: 0, l: 50 };
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return rgb2hsl(r, g, b);
  };

  /*──────────────────────── settings ────────────────────────*/
  const ADDON_NAME = 'Colorize 2';
  const OLD_VIBE_SELECTOR = '[class*="MainPage_vibe"], [data-test-id="VIBE_BLOCK"]';
  const NEW_WAVE_SELECTOR = '[class*="VibePage_root"], [class*="DefaultLayout_rootNewWave"]';
  let lastAppliedVars = null;
  let lastNewWaveState = null;

  function getSettings() {
    const api = window.pulsesyncApi;
    const store = api && typeof api.getSettings === 'function'
      ? api.getSettings(ADDON_NAME)
      : null;
    const current = store && typeof store.getCurrent === 'function'
      ? store.getCurrent()
      : {};

    const val = (key, fallback) => {
      const entry = current[key];
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        if (entry.value !== undefined) return entry.value;
        if (entry.bool !== undefined) return entry.bool;
        if (entry.input !== undefined) return entry.input;
        if (entry.default !== undefined) return entry.default;
        if (entry.defaultParameter !== undefined) return entry.defaultParameter;
      }
      return entry !== undefined ? entry : fallback;
    };

    return {
      useCustomColor: val('useCustomColor', false),
      baseColor: val('baseColor', '#d56767'),
      enableBackgroundImage: val('enableBackgroundImage', false),
      staticBackground: val('staticBackground', false),
      FullVibe: val('FullVibe', true),
      enableAvatarZoom: val('enableAvatarZoom', false),
      onChange: store && typeof store.onChange === 'function'
        ? store.onChange.bind(store)
        : function () {}
    };
  }

  function isNewWavePage() {
    return !!document.querySelector(NEW_WAVE_SELECTOR);
  }

  function getOldVibeBlock() {
    if (isNewWavePage()) return null;
    return document.querySelector(OLD_VIBE_SELECTOR);
  }

  function getVibeBackgroundTarget() {
    const newWaveRoot = document.querySelector('[class*="VibePage_root"]');
    if (newWaveRoot) return newWaveRoot;

    if (document.querySelector('[class*="DefaultLayout_rootNewWave"]')) return null;

    return document.querySelector(OLD_VIBE_SELECTOR);
  }

  function clearOldVibeSize() {
    document.querySelectorAll(OLD_VIBE_SELECTOR).forEach(vibe => {
      if (vibe.style.getPropertyValue('height')) vibe.style.removeProperty('height');
      if (vibe.style.getPropertyValue('min-height')) vibe.style.removeProperty('min-height');
    });
  }

  function syncWaveLayoutState() {
    const newWave = isNewWavePage();
    if (newWave !== lastNewWaveState) {
      document.documentElement.classList.toggle('colorize-new-wave-page', newWave);
      lastNewWaveState = newWave;
    }
    if (newWave) clearOldVibeSize();
  }

  /*──────────────────────── cover helpers ───────────────────*/
  const COVER_IMAGE_SELECTORS = [
    'div[data-test-id="PLAYERBAR_DESKTOP_COVER_CONTAINER"] img',
    '[data-test-id="FULLSCREEN_PLAYER_MODAL"] img[data-test-id="ENTITY_COVER_IMAGE"]',
    'img[data-test-id="ENTITY_COVER_IMAGE"]',
    'img[class*="AlbumCover_cover__"][src*="avatars.yandex.net/get-music-content"]',
    'img[class*="AlbumCover_cover__"][srcset*="avatars.yandex.net/get-music-content"]',
    'img[src*="avatars.yandex.net/get-music-content"]',
    'img[srcset*="avatars.yandex.net/get-music-content"]'
  ];

  const coverSrcFromImg = (img) => {
    if (!img) return '';
    const src = img.currentSrc || img.src || img.getAttribute?.('src') || '';
    if (src) return src;
    const srcset = img.getAttribute?.('srcset') || '';
    return srcset.split(',')[0]?.trim().split(/\s+/)[0] || '';
  };

  const normalizeCoverURL = (src, size = '1000x1000') => String(src || '')
    .replace(/\/(?:50x50|80x80|100x100|200x200|300x300|400x400|800x800|1000x1000)(?=[/?]|$)/g, `/${size}`);

  const coverScore = (img) => {
    if (!img || !img.isConnected) return -1;

    const src = coverSrcFromImg(img);
    if (!src) return -1;

    const cls = String(img.className || '');
    const rect = img.getBoundingClientRect?.() || { width: 0, height: 0, top: 0, bottom: 0 };
    const style = getComputedStyle(img);
    const visible = rect.width > 20 && rect.height > 20 && style.display !== 'none' && style.visibility !== 'hidden';

    let score = 0;
    if (visible) score += 120;
    if (src.includes('avatars.yandex.net/get-music-content')) score += 90;
    if (cls.includes('AlbumCover_cover__')) score += 70;
    if (img.closest?.('div[data-test-id="PLAYERBAR_DESKTOP_COVER_CONTAINER"], [class*="PlayerBar"], [class*="playerBar"]')) score += 130;
    if (img.closest?.('[class*="VibePage_root"], [class*="DefaultLayout_rootNewWave"]')) score += 115;
    if (img.closest?.('[data-test-id="FULLSCREEN_PLAYER_MODAL"]')) score += 100;
    if (rect.top > window.innerHeight * 0.45 || rect.bottom > window.innerHeight * 0.62) score += 25;
    if (rect.width <= 280 && rect.height <= 280) score += 10;

    return score;
  };

  let coverNodeCache = null;
  let coverNodeCacheTime = 0;

  const getCoverNode = () => {
    const now = performance.now?.() || Date.now();
    if (
      coverNodeCache &&
      coverNodeCache.isConnected &&
      coverSrcFromImg(coverNodeCache) &&
      now - coverNodeCacheTime < 180
    ) {
      return coverNodeCache;
    }

    const nodes = new Set();
    COVER_IMAGE_SELECTORS.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(img => nodes.add(img));
      } catch {}
    });

    let bestNode = null;
    let bestScore = -1;
    nodes.forEach(img => {
      const score = coverScore(img);
      if (score > bestScore) {
        bestScore = score;
        bestNode = img;
      }
    });
    coverNodeCache = bestScore >= 0 ? bestNode : null;
    coverNodeCacheTime = now;

    return coverNodeCache;
  };

  const coverURL = () => {
    const src = coverSrcFromImg(getCoverNode());
    return src ? normalizeCoverURL(src, '400x400') : null;
  };

  const CANVAS = document.createElement('canvas');
  CANVAS.width = CANVAS.height = 64;
  const CTX = CANVAS.getContext('2d');
  const CACHE = new Map();
  const MAX_CACHE_ENTRIES = 80;

  const normL = o => ({ ...o, l: Math.min(85, Math.max(20, o.l)) });

  function cacheColors(src, result) {
    CACHE.set(src, result);
    if (CACHE.size <= MAX_CACHE_ENTRIES) return;
    CACHE.delete(CACHE.keys().next().value);
  }

  const colorsFromCover = (src) => {
    if (!src) return Promise.resolve(null);
    if (CACHE.has(src)) return Promise.resolve(CACHE.get(src));

    return new Promise((res) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = img.width;
          const h = img.height;
          const scale = 64 / Math.max(w, h);
          CTX.clearRect(0, 0, 64, 64);
          CTX.drawImage(img, 0, 0, w * scale, h * scale);
          const d = CTX.getImageData(0, 0, 64, 64).data;

          const hueMap = new Map();
          let totalS = 0, totalL = 0, count = 0;

          for (let y = 0; y < 64; y++) {
            for (let x = 0; x < 64; x++) {
              const idx = (y * 64 + x) * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];

              if (r + g + b < 30 || r + g + b > 740) continue;

              const hsl = rgb2hsl(r, g, b);
              if (hsl.s < 20) continue;

              const hueKey = Math.round(hsl.h / 10) * 10; // группируем по 10°
              const current = hueMap.get(hueKey) || { count: 0, s: 0, l: 0 };
              current.count++;
              current.s += hsl.s;
              current.l += hsl.l;
              hueMap.set(hueKey, current);

              count++;
            }
          }

          if (count === 0) {
            console.warn('[colorsFromCover] Недостаточно подходящих пикселей');
            res(null);
            return;
          }

          // Найдём доминирующий hue
          let maxCount = -1;
          let dominant = null;
          for (const [hue, data] of hueMap.entries()) {
            if (data.count > maxCount) {
              maxCount = data.count;
              dominant = { h: hue, s: +(data.s / data.count).toFixed(1), l: +(data.l / data.count).toFixed(1) };
            }
          }

          const resultColor = normL(dominant);
          const result = [resultColor, resultColor];
          cacheColors(src, result);
          res(result);
        } catch (e) {
          console.warn('[colorsFromCover] ошибка обработки:', e);
          res(null);
        }
      };
      img.onerror = () => res(null);
      img.src = src;
    });
  };



  const fallbackHSL = () => {
    const root = document.querySelector('[class*="PlayerBarDesktop_root"]');
    if (!root) return [{ h: 0, s: 0, l: 50 }, { h: 0, s: 0, l: 50 }];
    const v = getComputedStyle(root)
      .getPropertyValue('--player-average-color-background');
    const m = v.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
    const hsl = m ? { h: +m[1], s: +m[2], l: +m[3] } : { h: 0, s: 0, l: 50 };
    return [hsl, hsl];
  };

  /*──────────────────────── palette & vars ────────────────*/
  const buildVars = base => {
    const vars = {};
    for (let i = 1; i <= 10; i++) {
      const lHi = base.l + (80 - base.l) * i / 10;
      const lLo = base.l - base.l * i / 10;
      vars[`--color-light-${i}`] = H({ ...base, l: lHi });
      vars[`--color-dark-${i}`] = H({ ...base, l: lLo });
      for (let a = 1; a <= 10; a++) {
        vars[`--color-light-${i}-${a}`] = HA({ ...base, l: lHi }, a / 10);
        vars[`--color-dark-${i}-${a}`] = HA({ ...base, l: lLo }, a / 10);
      }
    }
    vars['--grad-main'] =
      `linear-gradient(120deg,
        hsl(${base.h},${base.s}%,${Math.max(0, base.l - 25)}%) 0%,
        hsl(${base.h},${base.s}%,${Math.min(100, base.l + 25)}%) 100%)`;
    return vars;
  };

  /*──────────────────────── YM_MAP + кастом-CSS ───────────*/
  const YM_MAP = `
    --ym-background-color-primary-enabled-basic:          var(--color-dark-8);
    --ym-surface-color-primary-enabled-list:              var(--color-light-1-4);
    --ym-background-color-primary-enabled-content:        var(--color-dark-6);
    --ym-controls-color-primary-text-enabled_variant:     var(--color-light-10-10);
    --ym-controls-color-primary-text-enabled:             var(--color-light-10-5);
    --ym-controls-color-primary-text-hovered:             var(--color-light-7);
    --ym-background-color-secondary-enabled-blur:         var(--color-light-1);
    --ym-controls-color-secondary-outline-enabled_stroke: var(--color-light-10-10);
    --ym-controls-color-primary-text-disabled:            var(--ym-controls-color-secondary-outline-enabled_stroke);
    --ym-controls-color-secondary-outline-hovered_stroke: var(--color-light-5);
    --ym-controls-color-secondary-on_outline-enabled:     var(--color-light-10-8);
    --ym-logo-color-primary-variant:                      var(--color-light-10);
    --ym-controls-color-primary-outline-enabled:          var(--color-dark-1-10);
    --ym-controls-color-secondary-outline-selected:       var(--color-dark-3);
    --ym-controls-color-secondary-card-enabled:           var(--color-dark-5-7);
    --ym-controls-color-secondary-card-hovered:           var(--color-light-5-5);
    --ym-controls-color-primary-default-disabled:         var(--color-light-4);
    --ym-controls-color-primary-default-enabled:          var(--color-light-10);
    --ym-controls-color-primary-default-hovered:          var(--color-light-8);
    --ym-controls-color-secondary-default-disabled:       var(--color-dark-1);
    --ym-controls-color-secondary-default-enabled:        var(--color-dark-5);
    --ym-controls-color-secondary-default-hovered:        var(--color-dark-3);
    --ym-background-color-primary-enabled-popover:        var(--color-dark-7-9);
    --ym-controls-color-secondary-text-enabled:           var(--color-light-10-10);
    --ym-controls-color-secondary-on_default-hovered:     var(--color-light-10-10);
    --ym-controls-color-secondary-on_default-enabled:     var(--color-light-10-10);
    --id-default-color-dark-surface-elevated-0:           var(--color-dark-6);

    /* отключаем фоновую краску контейнеров, чтобы был виден градиент */
    .DefaultLayout_root__*, .CommonLayout_root__*{
      background:transparent !important;
    }

    /* ваши предыдущие переопределения ↓ */
    .ChangeVolume_root__HDxtA
    {
    max-width:160px;
    }
    
    .DefaultLayout_content__md70Z .MainPage_root__STXqc::-webkit-scrollbar
    {
    width:0;
    }
    
    .MainPage_landing___FGNm
    {
    padding-right:24px;
    }
    
    .SyncLyrics_content__lbkWP:after, .SyncLyrics_content__lbkWP:before
    {
    display:none;
    }
    
    .NavbarDesktop_logoLink__KR0Dk
    {
    margin-top:15px;
    }
    
    canvas
    {
    opacity:.2 !important;
    filter:blur(360px) !important;
    }
    
    .VibeBlock_vibeAnimation__XVEE6:after
    {
    background:transparent !important;
    }
    
    .CollectionPage_collectionColor__M5l1f,
    .ygfy3HHHNs5lMz5mm4ON,
    .yvGpKZBZLwidMfMcVMR3
    {
    color:var(--ym-logo-color-primary-variant);
    }
    
    .kc5CjvU5hT9KEj0iTt3C
    {backdrop-filter:none;
    }
    
    .kc5CjvU5hT9KEj0iTt3C:hover,
    .kc5CjvU5hT9KEj0iTt3C:focus
    {
    backdrop-filter:saturate(180%) blur(15px);
    }
    
    ::placeholder
    {
    color:var(--color-light-4-10) !important;
    }
    
    .PSBpanel
    {
      color:var(--ym-logo-color-primary-variant) !important;
      font-weight:500 !important;
      left:0; right:0 !important;
      display:flex; justify-content:center;
    }
    
    .mdbxU6IWInQTsVjwnapn
    {
    background:var(--color-light-5) !important;
    }
    
    .xZzTMqgg0qtV5vqUIrkK
    {
    background-color:var(--color-dark-3-6) !important;
    }
    
    .FullscreenPlayerDesktop_poster_withSyncLyricsAnimation__bPO0o, .FullscreenPlayerDesktop_important__dGfiL,
    .SyncLyricsCard_root__92qn_
    {
    inset-block-end:35px !important;
    }
  
    .CommonLayout_root__WC_W1
    {
      background:radial-gradient(circle at 70% 70%,
        var(--ym-background-color-secondary-enabled-blur)      0%,
        var(--ym-background-color-primary-enabled-content)    70%,
        var(--ym-background-color-primary-enabled-basic)     100%) !important;
    }

    .Navbar_root__chfAR,
    .EntitySidebar_root__D1fGh,
    .Divider_root__99zZ{
      background:radial-gradient(circle at 70% 70%,
        var(--ym-background-color-secondary-enabled-blur)      0%,
        var(--ym-background-color-primary-enabled-content)    70%,
        var(--ym-background-color-primary-enabled-basic)     100%) !important;
    }

    .MsLY_qiKofQrwKAr98EC:after,
    .PlayQueue_root__ponhw:after,
    .PlayQueue_root__ponhw:before,
    .PinsList_root_hasPins__3LXlo:after,
    .PinsList_root_hasPins__3LXlo:before,
    .NavbarDesktop_scrollableContainer__HLc9D:before,
    .NavbarDesktop_scrollableContainer__HLc9D:after,
    .SearchPage_skeletonStickyHeader__SQqeV.SearchPage_important__z3aCa{
    background:
      linear-gradient(
        ◯turn  /* браузер-фикс от YM */
        var(--fade-background-color,
        var(--ym-background-color-secondary-enabled-blur)) 0,
        hsla(0 0% 5% / .90) 100%);
    }

    .VibeContext_context__Z_82k,
    .VibeSettings_toggleSettingsButton__j6fIU,
    .VibeContext_pinButton__b6SNF{
        backdrop-filter: blur(25px);
        background-color: rgba(0, 0, 0, 0.15);
    }

    .Root{
    background: var(--ym-background-color-primary-enabled-content) !important
    }
`;

  const applyVars = vars => {
    lastAppliedVars = vars;

    let st = document.getElementById('colorize-style');
    if (!st) {
      st = document.createElement('style');
      st.id = 'colorize-style';
      document.head.appendChild(st);
    }
    let css = '.ym-dark-theme{\n';
    Object.entries(vars).forEach(([k, v]) => css += `  ${k}: ${v} !important;\n`);
    css += YM_MAP + '\n}';
    css += buildNewWavePaletteCss(vars);
    st.textContent = css;
    applyInlinePaletteVars(vars);
  };

  const PALETTE_LEAK_TARGETS = [
    'body',
    '.ym-dark-theme',
    '.ym-light-theme',
    '[class*="Content_rootOld_newVibe"]',
    '[class*="Content_rootOld"][class*="newVibe"]',
    '[class*="DefaultLayout_rootNewWave"]',
    '[class*="VibePage_root"]',
    '[class*="VibePage"]',
    '[data-test-id="MAIN_PAGE"]',
    '[class*="VibePlayerBar"]',
    '[class*="PlayerBar"]'
  ].join(',');

  const INLINE_YM_VARS = {
    '--ym-background-color-primary-enabled-basic': 'var(--color-dark-8)',
    '--ym-background-color-primary-enabled-content': 'var(--color-dark-6)',
    '--ym-background-color-primary-enabled-popover': 'var(--color-dark-7-9)',
    '--ym-background-color-primary-enabled-vibe': 'var(--color-dark-6)',
    '--ym-background-color-secondary-enabled-blur': 'var(--color-light-1)',
    '--ym-controls-color-primary-default-enabled': 'var(--color-light-10)',
    '--ym-controls-color-primary-default-hovered': 'var(--color-light-8)',
    '--ym-controls-color-primary-text-enabled': 'var(--color-light-10-5)',
    '--ym-controls-color-primary-text-enabled_variant': 'var(--color-light-10-10)',
    '--ym-controls-color-primary-text-hovered': 'var(--color-light-7)',
    '--ym-controls-color-secondary-default-enabled': 'var(--color-dark-5)',
    '--ym-controls-color-secondary-default-hovered': 'var(--color-dark-3)',
    '--ym-controls-color-secondary-card-enabled': 'var(--color-dark-5-7)',
    '--ym-controls-color-secondary-card-hovered': 'var(--color-light-5-5)',
    '--ym-controls-color-secondary-text-enabled': 'var(--color-light-10-10)',
    '--ym-controls-color-secondary-text-enabled_variant': 'var(--color-light-8)',
    '--ym-controls-color-secondary-on_default-enabled': 'var(--color-light-10-10)',
    '--ym-controls-color-secondary-on_default-hovered': 'var(--color-light-10-10)',
    '--ym-logo-color-primary-variant': 'var(--color-light-10)',
    '--ym-slider-color-primary-enabled': 'var(--color-light-8)',
    '--player-average-color-background': 'var(--color-dark-5)',
    '--average-color-background': 'var(--color-dark-5)',
    '--vibe-gradient-stop-0': 'var(--color-dark-8)',
    '--vibe-gradient-stop-1': 'var(--color-dark-5)',
    '--vibe-gradient-stop-2': 'var(--color-light-1)'
  };

  const NEW_WAVE_PALETTE_SCOPE = [
    'html.colorize-new-wave-page',
    'html.colorize-new-wave-page [class*="Content_rootOld_newVibe"]',
    'html.colorize-new-wave-page [class*="Content_rootOld"][class*="newVibe"]',
    'html.colorize-new-wave-page [class*="DefaultLayout_rootNewWave"]',
    'html.colorize-new-wave-page [class*="VibePage_root"]',
    'html.colorize-new-wave-page [data-test-id="MAIN_PAGE"]'
  ].join(',\n');

  function buildNewWavePaletteCss(vars) {
    let css = `\n${NEW_WAVE_PALETTE_SCOPE}{\n`;
    Object.entries(vars).forEach(([key, value]) => {
      css += `  ${key}: ${value} !important;\n`;
    });
    Object.entries(INLINE_YM_VARS).forEach(([key, value]) => {
      css += `  ${key}: ${value} !important;\n`;
    });
    css += '}\n';
    return css;
  }

  function applyInlinePaletteVars(vars) {
    if (!vars) return;

    cleanupInlinePaletteLeaks(vars);

    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value, 'important');
    });
    Object.entries(INLINE_YM_VARS).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value, 'important');
    });
  }

  function cleanupInlinePaletteLeaks(vars) {
    const keys = [...Object.keys(vars || {}), ...Object.keys(INLINE_YM_VARS)];

    try {
      document.querySelectorAll(PALETTE_LEAK_TARGETS).forEach(node => {
        if (!node?.style || node === document.documentElement) return;
        const inlineStyle = node.getAttribute('style') || '';
        if (
          !inlineStyle.includes('--color-') &&
          !inlineStyle.includes('--ym-') &&
          !inlineStyle.includes('--player-average-color-background') &&
          !inlineStyle.includes('--vibe-gradient-stop-')
        ) {
          return;
        }
        keys.forEach(key => node.style.removeProperty(key));
      });
    } catch {}
  }

  /*───────── overlay with var(--grad-main) ─────────*/
  function ensureGradientOverlay() {
    if (document.getElementById('sc-grad-overlay')) return;

    const css = `
      body.sc-has-grad::before{
        content:'';
        position:fixed; inset:0;
        background:var(--grad-main);
        z-index:-1;
        pointer-events:none;
      }
    `;
    const st = document.createElement('style');
    st.id = 'sc-grad-overlay';
    st.textContent = css;
    document.head.appendChild(st);
    document.body.classList.add('sc-has-grad');
  }
  const cover = document.querySelector('[class*="FullscreenPlayerDesktopPoster_cover"]');
  if (cover) {
    cover.style.width = '600px';
    cover.style.height = '600px';
    cover.style.transition = 'all 0.3s ease';
  }

  /*──────────────────────── effects ───────────────────────*/
  let SETTINGS = {};
  let lastSETTINGS_JSON = '';
  let lastSrc = '', lastHex = '', lastFullVibe = null; let lastBackgroundImage = null; let lastStaticBackground = null;
  let lastAvatarZoom = null;
  let lastBackgroundURL = '';
  let pendingBackgroundURL = '';
  let lastPageURL = location.href;

  async function getHiResCover() {
    const src = coverSrcFromImg(getCoverNode());
    return src ? normalizeCoverURL(src, '1000x1000') : null;
  }

  function cleanupForeignBackgroundLayers(target) {
    document.querySelectorAll('.bg-layer').forEach(layer => {
      if (target && target.contains(layer)) return;
      layer.remove();
    });
  }

  function backgroundReplace(imageURL) {
    const target = getVibeBackgroundTarget();
    cleanupForeignBackgroundLayers(target);
    if (!target || !imageURL) {
      if (!target) lastBackgroundURL = '';
      return;
    }
    if (imageURL === lastBackgroundURL && target.querySelector('.bg-layer')) return;
    if (imageURL === pendingBackgroundURL) return;
    pendingBackgroundURL = imageURL;
    target.style.setProperty('position', 'relative', 'important');
    target.style.setProperty('overflow', 'hidden', 'important');
    target.style.setProperty('isolation', 'isolate', 'important');

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      pendingBackgroundURL = '';
      if (!SETTINGS.enableBackgroundImage || !target.isConnected || target !== getVibeBackgroundTarget()) return;
      lastBackgroundURL = imageURL;

      const wrapper = document.createElement('div');
      wrapper.className = 'bg-layer';
      wrapper.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: inherit;
    `;

      const imageLayer = document.createElement('div');
      imageLayer.className = 'bg-cover';
      imageLayer.style.cssText = `
      position: absolute;
      inset: 0;
      background-image: url("${imageURL}");
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0;
      transition: opacity 1s ease;
      pointer-events: none;
      border-radius: inherit;
    `;

      const staticNow = !!SETTINGS.staticBackground;
      if (staticNow) {
        imageLayer.style.setProperty('animation', 'none', 'important');
        imageLayer.style.setProperty('background-position', 'center', 'important');
        imageLayer.style.setProperty('background-size', 'cover', 'important');
      }

      const gradient = document.createElement('div');
      gradient.className = 'bg-gradient';
      gradient.style.cssText = `
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 70% 70%,
        var(--ym-background-color-secondary-enabled-blur, rgba(0,0,0,0)) 0%,
        var(--ym-background-color-primary-enabled-content, rgba(0,0,0,0.2)) 70%,
        var(--ym-background-color-primary-enabled-basic, rgba(0,0,0,0.3)) 100%);
      opacity: 0.6;
      pointer-events: none;
      z-index: 1;
      border-radius: inherit;
    `;

      const oldLayers = [...target.querySelectorAll('.bg-layer')];
      oldLayers.forEach(layer => {
        layer.style.opacity = '0';
        layer.style.transition = 'opacity 0.6s ease';
        setTimeout(() => layer.remove(), 700);
      });

      wrapper.appendChild(imageLayer);
      wrapper.appendChild(gradient);
      target.insertBefore(wrapper, target.firstChild);

      requestAnimationFrame(() => {
        imageLayer.offsetHeight;
        imageLayer.style.opacity = '1';
      });
    };

    img.onerror = () => {
      if (pendingBackgroundURL === imageURL) pendingBackgroundURL = '';
      console.warn('[backgroundReplace] Ошибка загрузки изображения:', imageURL);
    };
    img.src = imageURL;
  }

  function removeBackgroundImage() {
    const layers = document.querySelectorAll('.bg-layer');
    lastBackgroundURL = null;
    pendingBackgroundURL = '';
    if (!layers.length) return;

    layers.forEach(layer => {
      layer.style.opacity = '0';
      layer.style.transition = 'opacity 0.6s ease';
      setTimeout(() => layer.remove(), 700);
    });

    lastBackgroundURL = null;
    pendingBackgroundURL = '';
    console.log("[removeBackgroundImage] Фоновое изображение удалено.");
  }

  function handleAvatarMouseMove(event) {
    const rect = this.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 9;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 9;
    const translateX = Math.max(-45, Math.min(45, -x * 11));
    const translateY = Math.max(-45, Math.min(45, -y * 11));
    this.style.transform = `scale(1.8) translate(${translateX}px, ${translateY}px)`;
  }

  function handleAvatarMouseLeave() {
    this.style.transform = 'scale(1)';
  }

  function setupAvatarZoomEffect() {
    const avatar = document.querySelector('[class*="PageHeaderCover_coverImage"]');
    if (!avatar || avatar.classList.contains('avatar-zoom-initialized')) return;
    avatar.classList.add('avatar-zoom-initialized');
    avatar.addEventListener('mousemove', handleAvatarMouseMove);
    avatar.addEventListener('mouseleave', handleAvatarMouseLeave);
    console.log("[setupAvatarZoomEffect] Запущен зум аватара.");
  }

  function removeAvatarZoomEffect() {
    const avatar = document.querySelector('[class*="PageHeaderCover_coverImage"]');
    if (avatar && avatar.classList.contains('avatar-zoom-initialized')) {
      avatar.removeEventListener('mousemove', handleAvatarMouseMove);
      avatar.removeEventListener('mouseleave', handleAvatarMouseLeave);
      avatar.classList.remove('avatar-zoom-initialized');
      console.log("[removeAvatarZoomEffect] отключен зум аватара.");
    }
  }

  function FullVibe() {
    const vibe = getOldVibeBlock();
    if (vibe) {
      vibe.style.setProperty("height", "88.35vh", "important");
      console.log("[FullVibe] включено увеличение VIBE до 88.35vh.");
    }
  }

  function RemoveFullVibe() {
    const vibe = getOldVibeBlock();
    if (vibe) {
      vibe.style.setProperty("height", "0", "important");
      console.log("[RemoveFullVibe] отключение VIBE до 0.");
    }
  }

  function syncFullVibe(force = false) {
    const fullVibeNow = !!SETTINGS.FullVibe;
    const oldVibe = getOldVibeBlock();

    if (isNewWavePage()) {
      clearOldVibeSize();
      lastFullVibe = fullVibeNow;
      return;
    }

    const currentHeight = oldVibe?.style.getPropertyValue('height');
    const sizeApplied = fullVibeNow
      ? currentHeight === '88.35vh'
      : currentHeight === '0' || currentHeight === '0px';

    if (fullVibeNow !== lastFullVibe || force || (oldVibe && !sizeApplied)) {
      lastFullVibe = fullVibeNow;
      if (fullVibeNow) FullVibe();
      else RemoveFullVibe();
    }
  }

  let recolorTimer = null;
  let recolorRunning = false;
  let recolorQueued = false;
  let recolorForceQueued = false;

  function scheduleRecolor(force = false, delay = 120) {
    recolorForceQueued = recolorForceQueued || force;
    if (recolorTimer) clearTimeout(recolorTimer);
    recolorTimer = setTimeout(runScheduledRecolor, force ? 0 : delay);
  }

  async function runScheduledRecolor() {
    if (recolorTimer) {
      clearTimeout(recolorTimer);
      recolorTimer = null;
    }

    if (recolorRunning) {
      recolorQueued = true;
      return;
    }

    recolorRunning = true;
    const force = recolorForceQueued;
    recolorForceQueued = false;

    try {
      await recolor(force);
    } catch (e) {
      LOG('recolor error', e);
    } finally {
      recolorRunning = false;
      if (recolorQueued || recolorForceQueued) {
        const nextForce = recolorForceQueued;
        recolorQueued = false;
        scheduleRecolor(nextForce, 0);
      }
    }
  }


  const recolor = async (force = false) => {
    syncWaveLayoutState();
    syncFullVibe(force);

    const src = coverURL();
    const useHex = SETTINGS.useCustomColor;
    const hex = SETTINGS.baseColor || '';

    let base, gradC1, gradC2;
    let paletteChanged = force;

    if (useHex) {
      paletteChanged = force || hex !== lastHex;
      if (paletteChanged) {
      gradC1 = gradC2 = base = normL(parseHEX(hex));
      lastHex = hex;
      console.log("[recolor]  ", 'HEX-режим:', hex, base);
      }
    }
    else {
      paletteChanged = force || src !== lastSrc;
      if (paletteChanged) {
      const pair = await colorsFromCover(src) || fallbackHSL();
      if (!pair) return;
      [gradC1, gradC2] = pair;
      base = {
        h: Math.round((gradC1.h + gradC2.h) / 2),
        s: +((gradC1.s + gradC2.s) / 2).toFixed(1),
        l: +((gradC1.l + gradC2.l) / 2).toFixed(1)
      };
      lastSrc = src;
      console.log("[recolor]  ", 'Cover-режим:', src, gradC1, gradC2, '→ base', base);
      }
    }

    if (paletteChanged) {
      applyVars(buildVars(base));
      ensureGradientOverlay();
    }

    const backgroundImageNow = !!SETTINGS.enableBackgroundImage;
    const image = backgroundImageNow ? await getHiResCover() : null;
    if (backgroundImageNow !== lastBackgroundImage || force) {
      lastBackgroundImage = backgroundImageNow;
      if (!backgroundImageNow) removeBackgroundImage();
    }
    if (backgroundImageNow && image) backgroundReplace(image);


    const staticBackgroundNow = !!SETTINGS.staticBackground;
    if (staticBackgroundNow !== lastStaticBackground || force) {
      lastStaticBackground = staticBackgroundNow;
      document.documentElement.classList.toggle('bg-static-mode', staticBackgroundNow);
    }

    const avatarZoomNow = !!SETTINGS.enableAvatarZoom;
    if (avatarZoomNow !== lastAvatarZoom || force) {
      lastAvatarZoom = avatarZoomNow;
      if (avatarZoomNow) setupAvatarZoomEffect();
      else removeAvatarZoomEffect();
    }
  };

  const handleSettingsChange = () => {
    const newSettings = getSettings();
    const newJSON = JSON.stringify(newSettings);
    if (newJSON === lastSETTINGS_JSON) return;

    SETTINGS = newSettings;
    lastSETTINGS_JSON = newJSON;
    LOG('Настройки изменились -> перекрашиваем');
    scheduleRecolor(true);
  };

  const initSettings = async () => {
    if (!window.pulsesyncApi || typeof window.pulsesyncApi.getSettings !== 'function') {
      setTimeout(initSettings, 1000);
      return;
    }

    let api = null;
    try {
      api = window.pulsesyncApi.getSettings(ADDON_NAME);
    } catch (e) {
      LOG('settings api error', e);
    }
    if (!api || typeof api.onChange !== 'function') {
      setTimeout(initSettings, 1000);
      return;
    }

    SETTINGS = getSettings();
    lastSETTINGS_JSON = JSON.stringify(SETTINGS);
    syncWaveLayoutState();
    checkVibeReturn();
    scheduleRecolor(true, 0);
    await runScheduledRecolor();
    SETTINGS.onChange(handleSettingsChange);
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', initSettings)
    : initSettings();

  const RECOLOR_DOM_SELECTOR = [
    OLD_VIBE_SELECTOR,
    NEW_WAVE_SELECTOR,
    '[data-test-id="MAIN_PAGE"]',
    '[data-test-id="FULLSCREEN_PLAYER_MODAL"]',
    'div[data-test-id="PLAYERBAR_DESKTOP_COVER_CONTAINER"]',
    'img[data-test-id="ENTITY_COVER_IMAGE"]',
    'img[class*="AlbumCover_cover"]',
    '[class*="PlayerBarDesktopWithBackgroundProgressBar_cover"]'
  ].join(',');

  function nodeTouchesRecolorTarget(node) {
    if (!node || node.nodeType !== 1) return false;
    try {
      return node.matches?.(RECOLOR_DOM_SELECTOR) || !!node.querySelector?.(RECOLOR_DOM_SELECTOR);
    } catch {
      return false;
    }
  }

  function mutationTouchesRecolorTarget(mutations) {
    return mutations.some(mutation => {
      if (mutation.type === 'attributes') {
        return nodeTouchesRecolorTarget(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        if (nodeTouchesRecolorTarget(node)) return true;
      }
      for (const node of mutation.removedNodes) {
        if (nodeTouchesRecolorTarget(node)) return true;
      }
      return false;
    });
  }

  new MutationObserver((mutations) => {
    if (!mutationTouchesRecolorTarget(mutations)) return;
    syncWaveLayoutState();
    scheduleRecolor(false);
  }).observe(document.body, {
    attributes: true,
    attributeFilter: ['src', 'srcset'],
    childList: true,
    subtree: true
  }
  );

  function checkVibeReturn() {
    let lastCover = '';
    return setInterval(() => {
      if (!SETTINGS.enableBackgroundImage) return;

      syncWaveLayoutState();
      const vibe = getVibeBackgroundTarget();
      if (!vibe) return;

      const src = coverURL();
      if (!src) return;

      const hasBackground = vibe.style.backgroundImage?.includes('url(') || !!vibe.querySelector('.bg-layer');

      if (!hasBackground || src !== lastCover) {
        console.log('[Colorize 2] Vibe пустой или обложка изменилась → обновляем');
        lastCover = src;
        scheduleRecolor(true);
      }
    }, 2500);
  }

  const monitorPageChangeAndSetBackground = () => {
    const handlePageChange = () => {
      const currentURL = location.href;
      if (currentURL !== lastPageURL) {
        lastPageURL = currentURL;
        console.log('[Colorize 2] Переход на новую страницу:', currentURL);
        syncWaveLayoutState();
        scheduleRecolor(true);
      }
    };

    ['pushState', 'replaceState'].forEach(method => {
      const original = history[method];
      if (typeof original !== 'function' || original.__colorizeWrapped) return;

      const wrapped = function (...args) {
        const result = original.apply(this, args);
        setTimeout(handlePageChange, 0);
        return result;
      };
      wrapped.__colorizeWrapped = true;
      history[method] = wrapped;
    });

    window.addEventListener('popstate', () => setTimeout(handlePageChange, 0));
    window.addEventListener('hashchange', () => setTimeout(handlePageChange, 0));
  };

  monitorPageChangeAndSetBackground();

})
  ();
