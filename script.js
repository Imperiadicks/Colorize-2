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
  const HANDLE = 'Colorize 2';

  const getSettings = async () => {
    try {
      const r = await fetch(`http://localhost:2007/get_handle?name=${HANDLE}`);
      const j = await r.json();
      const s = {};
      j?.data?.sections?.forEach(sec => {
        s[sec.title] = {};
        sec.items.forEach(it => {
          if ('bool' in it) s[sec.title][it.id] = it.bool;
          if ('input' in it) s[sec.title][it.id] = it.input;
        });
      });
      return s;
    } catch (e) {
      LOG('settings error', e);
      return {};
    }
  };

  /*──────────────────────── cover helpers ───────────────────*/
  const coverURL = () => {
    const imgMini = document.querySelector(
      'div[data-test-id="PLAYERBAR_DESKTOP_COVER_CONTAINER"] img'
    );
    if (imgMini?.src) return imgMini.src;

    const imgFull = document.querySelector(
      '[data-test-id="FULLSCREEN_PLAYER_MODAL"] img[data-test-id="ENTITY_COVER_IMAGE"]'
    );
    if (imgFull?.src) return imgFull.src;

    const any = document.querySelector('img[data-test-id="ENTITY_COVER_IMAGE"]');
    return any?.src || null;
  };

  const CANVAS = document.createElement('canvas');
  CANVAS.width = CANVAS.height = 64;
  const CTX = CANVAS.getContext('2d');
  const CACHE = new Map();

  const normL = o => ({ ...o, l: Math.min(85, Math.max(20, o.l)) });

  const colorsFromCover = (src) => {
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
          CACHE.set(src, result);
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
    .ChangeVolume_root__HDxtA{ max-width:160px; }
    .DefaultLayout_content__md70Z .MainPage_root__STXqc::-webkit-scrollbar{ width:0; }
    .MainPage_landing___FGNm{ padding-right:24px; }
    .SyncLyrics_content__lbkWP:after, .SyncLyrics_content__lbkWP:before{ display:none; }
    .FullscreenPlayerDesktopContent_syncLyrics__6dTfH{
      margin-block-end:0; height:calc(100vh);
    }
    .NavbarDesktop_logoLink__KR0Dk{ margin-top:15px; }
    canvas{ opacity:.2 !important; filter:blur(360px) !important; }
    .VibeBlock_vibeAnimation__XVEE6:after{ background:transparent !important; }
    .CollectionPage_collectionColor__M5l1f,
    .ygfy3HHHNs5lMz5mm4ON,
    .yvGpKZBZLwidMfMcVMR3{ color:var(--ym-logo-color-primary-variant); }
    .kc5CjvU5hT9KEj0iTt3C{ backdrop-filter:none; }
    .kc5CjvU5hT9KEj0iTt3C:hover,
    .kc5CjvU5hT9KEj0iTt3C:focus{ backdrop-filter:saturate(180%) blur(15px); }
    ::placeholder{ color:var(--color-light-4-10) !important; }
    .PSBpanel{
      color:var(--ym-logo-color-primary-variant) !important;
      font-weight:500 !important;
      left:0; right:0 !important;
      display:flex; justify-content:center;
    }
    .mdbxU6IWInQTsVjwnapn{ background:var(--color-light-5) !important; }
    .xZzTMqgg0qtV5vqUIrkK{ background-color:var(--color-dark-3-6) !important; }
    .FullscreenPlayerDesktop_poster_withSyncLyricsAnimation__bPO0o.FullscreenPlayerDesktop_important__dGfiL,
    .SyncLyricsCard_root__92qn_{ inset-block-end:35px !important; }
  
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
    let st = document.getElementById('colorize-style');
    if (!st) {
      st = document.createElement('style');
      st.id = 'colorize-style';
      document.head.appendChild(st);
    }
    let css = '.ym-dark-theme{\n';
    Object.entries(vars).forEach(([k, v]) => css += `  ${k}: ${v} !important;\n`);
    css += YM_MAP + '\n}';
    st.textContent = css;
  };

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
  let lastSrc = '', lastHex = '', lastFullVibe = null; let lastBackgroundImage = null;
  let lastAvatarZoom = null;
  let lastBackgroundURL = '';
  let lastPageURL = location.href;

  async function getHiResCover() {
    const img = document.querySelector('[class*="PlayerBarDesktopWithBackgroundProgressBar_cover"] img');
    if (img && img.src.includes('/100x100')) {
      return img.src.replace('/100x100', '/1000x1000');
    }
    return null;
  }

  function backgroundReplace(imageURL) {
    const target = document.querySelector('[class*="MainPage_vibe"]');
    if (!target || !imageURL || imageURL === lastBackgroundURL) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageURL;

    img.onload = () => {
      lastBackgroundURL = imageURL;

      const wrapper = document.createElement('div');
      wrapper.className = 'bg-layer';
      wrapper.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
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
    `;

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
    `;

      const oldLayers = [...target.querySelectorAll('.bg-layer')];
      oldLayers.forEach(layer => {
        layer.style.opacity = '0';
        layer.style.transition = 'opacity 0.6s ease';
        setTimeout(() => layer.remove(), 700);
      });

      wrapper.appendChild(imageLayer);
      wrapper.appendChild(gradient);
      target.appendChild(wrapper);

      requestAnimationFrame(() => {
        imageLayer.offsetHeight;
        imageLayer.style.opacity = '1';
      });
    };

    img.onerror = () => {
      console.warn('[backgroundReplace] Ошибка загрузки изображения:', imageURL);
    };
  }

  function removeBackgroundImage() {
    const layers = document.querySelectorAll('.bg-layer');
    if (!layers.length) return;

    layers.forEach(layer => {
      layer.style.opacity = '0';
      layer.style.transition = 'opacity 0.6s ease';
      setTimeout(() => layer.remove(), 700);
    });

    lastBackgroundURL = null;
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
    const vibe = document.querySelector('[class*="MainPage_vibe"]');
    if (vibe) {
      vibe.style.setProperty("height", "88.35vh", "important");
      console.log("[FullVibe] включено увеличение VIBE до 88.35vh.");
    }
  }

  function RemoveFullVibe() {
    const vibe = document.querySelector('[class*="MainPage_vibe"]');
    if (vibe) {
      vibe.style.setProperty("height", "0", "important");
      console.log("[RemoveFullVibe] отключение VIBE до 0.");
    }
  }


  const recolor = async (force = false) => {
    const src = coverURL();
    const useHex = SETTINGS['Тема']?.useCustomColor;
    const hex = SETTINGS['Тема']?.baseColor || '';

    let base, gradC1, gradC2;

    if (useHex) {
      if (!force && hex === lastHex) return;
      gradC1 = gradC2 = base = normL(parseHEX(hex));
      lastHex = hex;
      console.log("[recolor]  ", 'HEX-режим:', hex, base);
    }
    else {
      if (!force && src === lastSrc) return;
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

    applyVars(buildVars(base));
    ensureGradientOverlay();

    const image = await getHiResCover();

    const backgroundImageNow = !!SETTINGS?.['Эффекты']?.enableBackgroundImage;
    if (backgroundImageNow !== lastBackgroundImage || force) {
      lastBackgroundImage = backgroundImageNow;
      if (backgroundImageNow) backgroundReplace(image);
      else removeBackgroundImage();
    }

    const avatarZoomNow = !!SETTINGS?.['Эффекты']?.enableAvatarZoom;
    if (avatarZoomNow !== lastAvatarZoom || force) {
      lastAvatarZoom = avatarZoomNow;
      if (avatarZoomNow) setupAvatarZoomEffect();
      else removeAvatarZoomEffect();
    }
    const fullVibeNow = !!SETTINGS?.['Эффекты']?.FullVibe;
    if (fullVibeNow !== lastFullVibe || force) {
      lastFullVibe = fullVibeNow;
      if (fullVibeNow) FullVibe();
      else RemoveFullVibe();
    }
  };

  const init = async () => {
    SETTINGS = await getSettings();
    lastSETTINGS_JSON = JSON.stringify(SETTINGS);
    checkVibeReturn();
    await recolor(true);
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

  new MutationObserver(() => recolor()).observe(document.body, {
    childList: true,
    subtree: true
  }
  );

  setInterval(async () => {
    const newSettings = await getSettings();
    const newJSON = JSON.stringify(newSettings);
    if (newJSON !== lastSETTINGS_JSON) {
      SETTINGS = newSettings;
      lastSETTINGS_JSON = newJSON;
      console.log('[Colorize 2] Настройки изменились → перекрашиваем');
      await recolor(true);
    }
  }, 500);

  function checkVibeReturn() {
    let lastCover = '';
    return setInterval(async () => {
      const vibe = document.querySelector('[class*="MainPage_vibe"]');
      if (!vibe) return;

      const src = coverURL();
      const hasBackground = vibe.style.backgroundImage?.includes('url(');

      if (!hasBackground || src !== lastCover) {
        console.log('[Colorize 2] Vibe пустой или обложка изменилась → обновляем');
        lastCover = src;
        await recolor(true);
      }
    }, 1500);
  }

  const monitorPageChangeAndSetBackground = () => {
    const checkPage = () => {
      const currentURL = location.href;
      if (currentURL !== lastPageURL) {
        lastPageURL = currentURL;
        console.log('[Colorize 2] Переход на новую страницу:', currentURL);
        tryInjectBackground();
      }
    };
    setInterval(checkPage, 300);
  };

  async function tryInjectBackground() {
    const image = await getHiResCover();
    if (!image) {
      console.warn('[Colorize 2] Нет обложки для фона');
      return;
    }

    console.log('[Colorize 2] Принудительный запуск backgroundReplace:', image);
    lastBackgroundURL = '';
    backgroundReplace(image);
  }

  monitorPageChangeAndSetBackground();

})
  ();