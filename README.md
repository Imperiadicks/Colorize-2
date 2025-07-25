# Colorize 2 — динамическая тема для Яндекс Музыки

Этот скрипт изменяет оформление интерфейса Яндекс Музыки в зависимости от обложки текущего трека. Цвета, градиенты и фон подстраиваются под изображение, создавая визуальное соответствие композиции.

## Объяснения для тех, кто хочет настроить приложение под себя

Когда вы переключаете трек, приложение автоматически обновляет оформление. Оно анализирует изображение обложки и на основе его цветов меняет палитру интерфейса — фон, градиенты и акценты. Это создаёт визуальное соответствие между музыкальной композицией и внешним видом приложения.

---

## Базовая логика приложения: подготовка и преобразование цвета

### 1. Преобразование цвета из RGB в HSL

```js
const rgb2hsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d   = max - min;
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

  return {
    h: Math.round(h * 360),
    s: +(s * 100).toFixed(1),
    l: +(l * 100).toFixed(1)
  };
};
```

Эта функция преобразует цвет из формата RGB в формат HSL, который удобнее использовать при стилизации. Она применяется автоматически при анализе обложки трека.

#### Как работает:

- RGB-значения нормализуются (делятся на 255)
- Вычисляется максимальное и минимальное значение цвета, а затем разница между ними (контраст)
- На основе разницы определяется оттенок (`h`), насыщенность (`s`) и светлота (`l`)
- Результат округляется до удобного для использования формата

#### Как можно изменить:

---

1. **Изменить яркость интерфейса через модификацию `l`:**

```js
l = Math.min(1, Math.max(0, l * 1.1)); // сделать цвета светлее на 10%
```

---

2. **Заменить `Math.round` на другой способ округления:**

```js
h: Math.floor(h * 360), // сделать более "грубое" округление
```

---

3. **Отключить насыщенность у слишком серых цветов:**

```js
if (s < 0.05) s = 0; // убрать насыщенность у почти серых цветов
```

---

4. **Принудительно установить фиксированную светлоту:**

```js
l = 0.6; // использовать одну и ту же яркость независимо от исходного цвета
```

---

5. **Ограничить диапазон насыщенности:**

```js
s = Math.min(0.8, Math.max(0.2, s)); // принудительная коррекция насыщенности
```
---

### 2. Формирование цвета для CSS

```js
const H = o => `hsl(${o.h},${o.s}%,${o.l}%)`;
const HA = (o, a) => `hsla(${o.h},${o.s}%,${o.l}%,${a})`;
```

Эти функции преобразуют объект с компонентами цвета (оттенок, насыщенность и светлота) в строку формата `hsl(...)` или `hsla(...)`, которая затем используется в стилях. Они применяются в построении переменных CSS и градиентов.

#### Как работают:

- Принимают объект `o` с полями `h`, `s`, `l` (Hue, Saturation, Lightness)
- `H()` возвращает строку вида: `hsl(210, 100%, 50%)`
- `HA()` добавляет параметр прозрачности (`alpha`), возвращая строку вида: `hsla(210, 100%, 50%, 0.5)`

#### Как можно изменить:

---

1. **Округлить значения до целых:**

```js
const H = o => `hsl(${Math.round(o.h)},${Math.round(o.s)}%,${Math.round(o.l)}%)`;
```

---

2. **Ограничить значение компонентов:**

```js
const H = o => `hsl(${Math.min(360, o.h)},${Math.min(100, o.s)}%,${Math.min(100, o.l)}%)`;
```

---

3. **Изменить порядок или формат вывода (например, для логов):**

```js
const H = o => `H:${o.h}° S:${o.s}% L:${o.l}%`;
```

---

4. **Добавить фиксированную прозрачность:**

```js
const HA = o => `hsla(${o.h},${o.s}%,${o.l}%,0.8)`; // постоянная прозрачность
```

---

5. **Автоматически уменьшить насыщенность:**

```js
const H = o => `hsl(${o.h},${(o.s * 0.9).toFixed(1)}%,${o.l}%)`; // мягче цвета
```
---

### 3. Обработка пользовательского цвета (HEX)

```js
const parseHEX = hex => {
  if (typeof hex !== 'string') return { h: 0, s: 0, l: 50 };

  // Поддержка формата 0xFFFFFF
  if (hex.startsWith('0x')) hex = hex.slice(2);

  // Поддержка CSS-формата rgb(255, 255, 255)
  if (hex.startsWith('rgb')) {
    const m = hex.match(/rgb\s*\((\d+),\s*(\d+),\s*(\d+)\)/i);
    if (m) return rgb2hsl(+m[1], +m[2], +m[3]);
    return { h: 0, s: 0, l: 50 };
  }

  // Стандартная обработка HEX
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return { h: 0, s: 0, l: 50 };

  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) {
    console.warn('[parseHEX] Невалидный HEX-цвет:', hex);
    return { h: 0, s: 0, l: 50 };
  }

  const r = (n >> 16) & 255,
        g = (n >> 8) & 255,
        b = n & 255;

  return rgb2hsl(r, g, b);
};
```

Эта функция используется, когда пользователь вручную указывает цвет в формате HEX (например, `#ff9900`), `0xff9900` или `rgb(255, 153, 0)`. Она распознаёт формат, преобразует строку в RGB, а затем в HSL — формат, с которым работает интерфейс приложения.

#### Как работает:

- Удаляет `#` или `0x` из строки
- Поддерживает сокращённую форму (`#fc0` → `#ffcc00`)
- Поддерживает `rgb(...)` синтаксис
- Проверяет валидность входных данных
- Преобразует HEX в десятичное число и выделяет каналы R, G, B
- Использует `rgb2hsl()` для итогового результата

#### Как можно изменить:

---

1. **Ограничить ввод только полными HEX-кодами (6 символов):**

```js
if (hex.length !== 6) return { h: 0, s: 0, l: 50 };
```

---

2. **Добавить поддержку формата `0xffcc00`:**

```js
if (hex.startsWith('0x')) hex = hex.slice(2);
```

---

3. **Добавить поддержку `rgb(r, g, b)` как альтернативный формат:**

```js
if (hex.startsWith('rgb')) {
  const m = hex.match(/rgb\s*\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (m) return rgb2hsl(+m[1], +m[2], +m[3]);
}
```

---

4. **Заменить `rgb2hsl()` на свою реализацию:**

Если вы хотите, чтобы светлота всегда была фиксированной (например, `l = 60`), можно заменить:

```js
return {
  h: Math.round((r / 255) * 360),
  s: 100,
  l: 60
};
```
---

### 4. Контроль яркости цвета

```js
/**
 * Ограничивает значение яркости (Lightness) в диапазоне от 20 до 85.
 * Это необходимо для того, чтобы цвета не были слишком тусклыми или яркими.
 *
 * @param {Object} o - Объект с цветом в формате HSL ({ h, s, l })
 * @returns {Object} Новый объект HSL с нормализованным значением l
 */
const normL = o => {
  return {
    ...o,
    l: Math.min(85, Math.max(20, o.l))
  };
};
```

Эта функция отвечает за контроль светлоты цвета (параметр `l` в HSL). Её задача — предотвратить слишком тёмные или чрезмерно яркие цвета, которые могут мешать восприятию интерфейса. Она автоматически применяется после извлечения цвета из обложки.

#### Как работает:

- Получает объект `o` с полями `h`, `s`, `l`
- Ограничивает значение `l` (Lightness) в пределах от 20 до 85
- Возвращает новый объект с теми же `h` и `s`, но откорректированным `l`

#### Как можно изменить:

---

1. **Сделать тему светлее, увеличив нижнюю границу:**

```js
const normL = o => ({ ...o, l: Math.min(85, Math.max(35, o.l)) });
```

---

2. **Сделать тему более контрастной (расширить диапазон):**

```js
const normL = o => ({ ...o, l: Math.min(95, Math.max(10, o.l)) });
```

---

3. **Применить сдвиг светлоты (например, на +10%):**

```js
const normL = o => ({ ...o, l: Math.min(100, o.l + 10) });
```

---

4. **Зафиксировать светлоту независимо от исходного цвета:**

```js
const normL = o => ({ ...o, l: 60 }); // всегда одинаково светлый стиль
```

---


## Основные управляющие функции

### 1. `getSettings()`

Функция `getSettings()` используется для получения пользовательских настроек, которые могут включать параметры темы, эффектов и других визуальных элементов.

```js
const getSettings = async () => {
  try {
    const r = await fetch(`http://localhost:2007/get_handle?name=Colorize 2`);
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
    console.warn('[getSettings] Ошибка загрузки настроек:', e);
    return {};
  }
};
```

#### Как работает:

- Выполняет HTTP-запрос к `http://localhost:2007/get_handle`, где `Colorize 2` — это имя текущего профиля настроек.
- Получает JSON-ответ с разделами (`sections`) и параметрами.
- Собирает значения `bool` и `input` в объект `s`, сгруппированный по заголовкам.
- Возвращает итоговый объект с настройками.
- В случае ошибки возвращает `{}` без прерывания выполнения.


---

### Как можно изменить:

---

#### 1. Изменить источник настроек

Если настройки нужно получать с другого скрипта/темы:

```js
const r = await fetch('http://localhost:2007/get_handle?name=Проверка').then(r => r.json()).catch(() => null);
```

---
## 2. `buildVars(base)`

Создаёт набор CSS-переменных на основе одного цвета (HSL). Используется для генерации палитры светлых и тёмных оттенков.

```js
const buildVars = base => {
  const vars = {};
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  // Светлая палитра (увеличиваем яркость)
  for (let i = 1; i <= 5; i++) {
    const l = clamp(base.l + i * 5, 0, 100);
    vars[`--color-light-${i}`] = `hsl(${base.h}, ${base.s}%, ${l}%)`;
  }

  // Тёмная палитра (уменьшаем яркость)
  for (let i = 1; i <= 5; i++) {
    const l = clamp(base.l - i * 5, 0, 100);
    vars[`--color-dark-${i}`] = `hsl(${base.h}, ${base.s}%, ${l}%)`;
  }

  // Основной градиент для фона
  vars["--grad-main"] = `linear-gradient(to bottom, hsl(${base.h}, ${base.s}%, ${clamp(base.l + 10, 0, 100)}%) 0%, hsl(${base.h}, ${base.s}%, ${clamp(base.l - 10, 0, 100)}%) 100%)`;

  return vars;
};
```

### Как работает:
- Использует базовый цвет (например, полученный из обложки трека) в формате HSL.
- Генерирует диапазон оттенков: светлые (`--color-light-1` ... `--color-light-5`) и тёмные (`--color-dark-1` ... `--color-dark-5`).
- Создаёт градиент `--grad-main`, комбинируя изменённые версии базового цвета.
- Все значения добавляются как CSS-переменные, которые можно использовать в стилях.

### Как можно изменить:

---

1. **Увеличить количество оттенков:**
   ```js
   for (let i = 1; i <= 10; i++) { ... }
   ```
   Это добавит больше градаций светлых и тёмных тонов.

---

2. **Изменить шаг изменения яркости:**
   ```js
   const light = { ...base, l: base.l + i * 3 }; // вместо 5
   const dark  = { ...base, l: base.l - i * 3 }; // вместо 5
   ```
   Это делает переход между оттенками более плавным или резким.

---

3. **Заменить линейный градиент на радиальный:**
   ```js
   '--grad-main': `radial-gradient(circle at center, ${H(l1)}, ${H(l2)})`,
   ```
   Визуально оформление будет выглядеть иначе — градиент будет исходить из центра.

---

4. **Добавить дополнительные переменные:**
   Например, яркий акцент:
   ```js
   '--accent-strong': H({ ...base, l: 50, s: 100 })
   ```
---

## 3. `applyVars(vars)`

Функция отвечает за применение сгенерированных CSS-переменных к странице. Она вставляет или обновляет `<style>` с `id="spotcol-colorize-style"`, в котором содержатся переменные для оформления.

```js
const applyVars = vars => {
  let style = document.getElementById('spotcol-colorize-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'spotcol-colorize-style';
    document.head.appendChild(style);
  }

  style.textContent = `:root {
' + Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join('
') + '
}'`;
};
```

### Как работает:
- Проверяет наличие тега `<style>` с нужным `id`.
- Если его нет — создаёт и добавляет в `<head>`.
- Преобразует объект `vars` в CSS-переменные.
- Вставляет в CSS-блок `:root`, чтобы переменные были доступны по всей странице.

### Как можно изменить:

---

1. **Изменить ID или селектор (например, если у вас конфликт с другими стилями):**
```js
style.id = 'my-theme-vars';
```

---

2. **Применять переменные не к `:root`, а к другому блоку:**
```js
style.textContent = `.AppContainer {
' + ... + '
}`;
```

---

3. **Добавить проверку на существующее содержимое, чтобы не дублировать:**
```js
if (style.textContent === newContent) return;
```
---


## 4. `recolor(force)`

Ключевая функция. Обновляет оформление интерфейса: цвета, переменные, фон, градиенты и визуальные эффекты.  
Вызывается каждый раз при смене трека, а также вручную — при изменении настроек или загрузке скрипта.

```js
const recolor = async (force = false) => {
  const settings = await getSettings();
  const cover = await getCoverURL(); // Получение URL текущей обложки

  // Если цвет задан вручную
  if (settings.customColor) {
    const base = parseHEX(settings.customColor);
    const vars = buildVars(base);
    applyVars(vars);
    return;
  }

  // Получение изображения обложки
  const img = await loadImage(cover);
  const base = getVibrantColor(img); // Получение доминантного цвета
  const vars = buildVars(base);
  applyVars(vars);

  // Применение эффектов (если включены)
  if (settings.vibe) insertVibe(img);
  if (settings.zoom) insertZoom(img);
};
```

### Как работает:
- Загружает пользовательские настройки
- Определяет источник цвета: вручную или по обложке
- Вызывает генерацию переменных (`buildVars`) и применение (`applyVars`)
- В зависимости от настроек включает визуальные эффекты

### Как можно изменить:

---
1. **Изменить метод получения обложки:**  
   Например, если структура DOM другая или требуется предварительная обработка:
   ```js
   const cover = document.querySelector('.custom-cover')?.src;
   ```
---
2. **Изменить способ выбора цвета:**  
   Вместо `getVibrantColor`, можно использовать другой алгоритм (например, медиану, среднее):
   ```js
   const base = getAverageColor(img);
   ```
---
3. **Добавить отладку:**  
   Чтобы видеть, как меняются цвета:
   ```js
   console.log('Цвет из обложки:', base);
   ```
---
4. **Изменить включаемые эффекты:**  
   Например, отключить зум:
   ```js
   if (settings.vibe) insertVibe(img);
   // if (settings.zoom) insertZoom(img); — комментируем то что хотим отключить, чтоб не срабатывала, после можно раскомментировать
   ```


## 1. `backgroundReplace`

```js
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
      background-image: url("\${imageURL}");
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
```

### Как работает:

- Ищет контейнер с классом, содержащим `MainPage_vibe`
- Загружает изображение и ждёт `onload`
- Удаляет предыдущий слой с фоном, создаёт новые: `.bg-layer`, `.bg-cover`, `.bg-gradient`
- Добавляет плавную анимацию замены фона

### Как изменить:

---

1. **Изменить точки градиента в `bg-gradient`**  
   Позволяет управлять направлением и формой градиента.  
   Например, заменить `circle at 70% 70%` на:

   ```js
   background: radial-gradient(ellipse at center, ...);
   ```

   Это даст более мягкий и центрированный эффект.

---

2. **Изменить длительность анимации появления фона**  
   Управляет плавностью появления нового изображения.

   ```js
   imageLayer.style.transition = 'opacity 2s ease-in-out';
   ```

   Увеличение времени сделает смену более медленной и заметной.

---

3. **Изменить прозрачность градиента**  
   Контролирует, насколько сильно затемняется фон.

   ```js
   gradient.style.opacity = '0.4';
   ```

   Чем меньше значение — тем ярче изображение под градиентом.

---

4. **Увеличить масштаб фона (эффект зума)**  
   Добавляет визуальный эффект приближения картинки.

   ```js
   imageLayer.style.transform = 'scale(1.1)';
   imageLayer.style.transition += ', transform 1s ease';
   ```

   Полезно, если хотите усилить фокус на фоне.

---

5. **Добавить задержку перед заменой**  
   Может понадобиться, если есть анимации перехода между треками.

   ```js
   setTimeout(() => {
     requestAnimationFrame(() => {
       imageLayer.offsetHeight;
       imageLayer.style.opacity = '1';
     });
   }, 100);
   ```

   Позволяет отложить начало появления фона на 100 мс.
---
### 2. `setupAvatarZoomEffect`

```js
function setupAvatarZoomEffect() {
  const avatar = document.querySelector('[class*="PageHeaderCover_coverImage"]');
  if (!avatar || avatar.classList.contains('avatar-zoom-initialized')) return;
  avatar.classList.add('avatar-zoom-initialized');
  avatar.addEventListener('mousemove', handleAvatarMouseMove);
  avatar.addEventListener('mouseleave', handleAvatarMouseLeave);
  console.log("[setupAvatarZoomEffect] Запущен зум аватара.");
}
```

#### Что делает:
- Находит элемент с обложкой пользователя (аватаром), например `.PageHeaderCover_coverImage`.
- Защищается от повторной инициализации через класс `avatar-zoom-initialized`.
- `mousemove` — изменяет положение/масштаб аватара в зависимости от курсора.
- `mouseleave` — сбрасывает трансформацию.

#### Как можно изменить:

---

1. **Изменить масштаб увеличения:**
```js
avatar.style.transform = `scale(1.2)`;
```

---

2. **Отключить зум при маленьком размере экрана:**
```js
if (window.innerWidth < 768) return;
```
---
### 3. `FullVibe()`

```js
function FullVibe() {
  const vibe = document.querySelector('[class*="MainPage_vibe"]');
  if (vibe) vibe.style.setProperty("height", "88.35vh", "important");
  console.log("[FullVibe] включёно увеличение VIBE до 88.35vh.");
}
```

#### Что делает:
- Ищет элемент VIBE-блока на странице (`[class*="MainPage_vibe"]`).
- Устанавливает высоту блока `88.35vh`, принудительно через `!important`.

#### Как можно изменить:

---

1. **Изменить высоту блока:**  
   Если нужно адаптировать под другое разрешение:
   ```js
   vibe.style.setProperty("height", "75vh", "important");
   ```

---

## Стили: `style.css`

# CSS: Объяснение всех селекторов

```css
@keyframes backgroundMovement {
0% {
    background-position: 20% 20%;
    background-size: 110%;
}
25% {
background-position: 80% 20%;
    background-size: 115%;
}
50% {
background-position: 80% 80%;
    background-size: 120%;
}
75% {
background-position: 20% 80%;
    background-size: 115%;
}
100% {
background-position: 20% 20%;
    background-size: 110%;
}
```
**Пояснение:** Двигает изображение по VIBE_ANIMATION по заданному в процентах траеткории, так же присуствует зум

---

```css
}
[class*="bg-cover"] {
animation: backgroundMovement 15s infinite
    cubic-bezier(0.455, 0.03, 0.515, 0.955) !important;
  margin-bottom:10px;
}
```
**Пояснение:** настраивает время движения изображения по VIBE_ANIMATION'.

---

```css
.avatar-zoom {
cursor: zoom-in;
  overflow: hidden;
  transform-origin: center;
}
```
**Пояснение:** добавляет эффект зума на аватара.

---

```css
.kc5CjvU5hT9KEj0iTt3C:hover, 
.kc5CjvU5hT9KEj0iTt3C:focus {
backdrop-filter: none;
}
```
**Пояснение:** убирается фон.

---

```css
.PlayButton_root__nYKdN:not(:disabled), 
.PlayButton_root__nYKdN:not(:disabled) {
transition: all 0.2s ease-in-out;
}
```
**Пояснение:** Добавляет плавные переходы при изменении стиля.

---

```css
.PageHeaderPlaylist_root__yJBii{
   background: linear-gradient(var(--ym-controls-color-secondary-default-enabled, var(--ym-background-color-secondary-enabled-blur)) 0, transparent 100%)
}
 .PlaylistPage_averageColorBackground__3wEkw, .ArtistPage_averageColorBackground__wXTSY
{
  background: linear-gradient(var(--ym-controls-color-secondary-default-enabled, var(--ym-background-color-secondary-enabled-blur)) 0, transparent 100%)
} 
```
**Пояснение:** добавляет градиент шапке и скроллу к странице **альбома** и **артиста**.

---

```css
.PlayerBarDesktopWithBackgroundProgressBar_player__ASKKs,
.Content_rootOld__g85_m,
.Content_main__8_wIa, .PlayerBarDesktopWithBackgroundProgressBar_root__bpmwN.PlayerBarDesktopWithBackgroundProgressBar_important__HzXrK {
background: none;
  background-color: transparent !important;
}
```
**Пояснение:** убирает фон (нужно это для того, чтоб привести единному виду).

---

```css
.Content_main__8_wIa, .PlayerBarDesktopWithBackgroundProgressBar_root__bpmwN.PlayerBarDesktopWithBackgroundProgressBar_important__HzXrK {
border:1px solid var(--color-light-1) !important;
box-shadow:0 0 0 1px var(--color-light-1) inset; /* чтобы выделялась и на прозрачном */
}
```
**Пояснение:** Добавляет градиент и тени для плеера, main.

---

```css
.CommonLayout_root__WC_W1 {
background: radial-gradient(circle at 70% 70%,
    var(--ym-background-color-secondary-enabled-blur) 0%,
    var(--ym-background-color-primary-enabled-content) 70%,
    var(--ym-background-color-primary-enabled-basic) 100%) !important;

  box-shadow: inset 0 0 40px 10px rgba(0, 0, 0, 0.4) !important;
  border-radius: 12px;
}
```
**Пояснение:** это один из селекторов, который добавляет кругообразный градиент на всю Яндекс Музыку.

---

```css
.PlayerBarDesktopWithBackgroundProgressBar_player__ASKKs {
border-top: 1px solid rgba(255, 255, 255, 0.05);
}
```
**Пояснение:** Добавляет градиент для плеера.

---

```css
.WithTopBanner_root__P__x3 {
background: radial-gradient(circle at 65% 65%,
    var(--ym-background-color-secondary-enabled-blur) 0%,
    var(--ym-background-color-primary-enabled-content) 60%,
    var(--ym-background-color-primary-enabled-basic) 100%) !important;
}
```
**Пояснение:** это один из селекторов, который добавляет кругообразный градиент на всю Яндекс Музыку.

---

```css
.WithTopBanner_root__P__x3 {
box-shadow: inset 0 10px 30px rgba(0, 0, 0, 0.6) !important;
}
```
**Пояснение:** Добавляет мягкие тени для main.

---

```css
.By12CU9obvaH0jYtauNw {
scrollbar-width: none;
  -ms-overflow-style: none;
}
```
**Пояснение:** Скрывает полосу прокрутки.

---

```css
.By12CU9obvaH0jYtauNw::-webkit-scrollbar {
display: none;
}
```
**Пояснение:** Скрывает полосу прокрутки для того, чтоб изображение гармонично встало в MAIN.

---
