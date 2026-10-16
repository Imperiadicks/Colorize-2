# CSS Colorize 2

## Исходные файлы

| Файл | Назначение |
| --- | --- |
| `src/main.ts` | Подключение CSS к сборке темы |
| `src/styles.css` | Фоны, раскладка, границы, режимы эффектов |
| `src/pulsecolor-controls.css` | Токены кнопок и SVG, состояния взаимодействия, переходные слои |

Палитра поступает из Colorize2Core через CSS-переменные `--color-*` и токены `--ym-*`.
Статические правила темы используют эти значения для оформления интерфейса.

## Фон интерфейса

`CommonLayout` и `WithTopBanner` используют радиальные градиенты. Слой body
`sc-has-grad::before` отображает `--grad-main` позади содержимого.

```css
.CommonLayout_root__WC_W1 {
    background: radial-gradient(
        circle at 70% 70%,
        var(--ym-background-color-secondary-enabled-blur) 0%,
        var(--ym-background-color-primary-enabled-content) 70%,
        var(--ym-background-color-primary-enabled-basic) 100%
    ) !important;

    box-shadow: inset 0 0 40px 10px rgba(0, 0, 0, 0.4) !important;
    border-radius: 12px;
}
```

## Фоновая обложка и движение

Core создаёт `.bg-layer` с изображением `.bg-cover` и затемняющим `.bg-gradient`.
`backgroundMovement` изменяет масштаб и положение обложки. Класс `bg-static-mode`
останавливает анимацию. Прозрачность слоёв используется при замене изображения.

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
}
```

## Раскладка Vibe и navbar

`html.colorize-new-wave-page` включает размеры и позиционирование новой волны.
`VibePage_root` получает изолированный контекст наложения, ограничение overflow
и скругление. Контент размещается выше фоновых слоёв.

В обычной раскладке navbar занимает первую строку grid, растягивается по высоте
и имеет нулевые вертикальные отступы. Для новой волны заданы отдельная высота
и поправки при высоте окна до 750 px. Правила находятся в `pulsecolor-controls.css`.

## Границы

Контейнеры navbar, контента и старого плеера используют общий радиус и цвет
`--color-light-1`. Класс `colorize-borderless` снимает border и box-shadow.

## Кнопки и SVG

Токены `--ym-controls-color-*` связывают состояния enabled, hovered, pressed,
focused и disabled с текущей палитрой. `pulsecolor-controls.css` определяет
цвет SVG и клавиатурный focus-visible. Селекторы фона Vibe ограничены
`button` и `[role="button"]`; вложенный элемент иконки Play не получает фон.

## Автозатемнение

Core рассчитывает яркость фона и устанавливает класс `colorize-bright-vibe-controls`.
CSS задаёт тёмный полупрозрачный фон только целевым контролам.

```css
html.colorize-bright-vibe-controls [class*='VibePlayerBar_button__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_playButton__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_withYellowPlayButton__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_skipButton__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_playButton_playing__'],
html.colorize-bright-vibe-controls :is(button, [role='button']).colorize-vibe-control-contrast {
    background: color-mix(in srgb, var(--color-dark-10) 78%, transparent) !important;
}
```

## Иконки колеса

Фильтр `--colorize-wheel-icon-filter` применяется к изображениям действий
`WHEEL_SETTING_ITEM` и `WHEEL_RESHUFFLE_ITEM`. Остальные обложки сохраняют цвет.
Акцентный заголовок WheelItem использует `--ym-controls-color-secondary-text-enabled_variant`.
Подбор фильтра выполняет `Colorize2Core/src/wheel-icon-tint.ts`.

## Старый плеер

`[data-test-id="PLAYERBAR_DESKTOP"]` переопределяет фоновые переменные плеера
через `--color-dark-5`. Это исключает задержку отдельного встроенного цвета
относительно палитры интерфейса. Внутренние контейнеры плеера имеют прозрачный фон.

## Переходы палитры

`.colorize-palette-background` содержит прежний градиент во время перехода.
Управление opacity, очистка и промежуточный цвет находятся в
`Colorize2Core/src/palette-transition.ts`. Слой не перехватывает события указателя.
`prefers-reduced-motion` отключает анимацию.

## Дополнительные элементы

`styles.css` также определяет оформление заголовков страниц альбома, плейлиста
и артиста, элементов LikesAndHistory, кнопок полноэкранного плеера Sonata,
прокрутки, градиентных масок и анимации аватара.

## Справочник CSS-правил

Перечислены все правила двух исходных таблиц стилей, включая media queries,
анимации и объявления переменных. Фрагменты приведены целиком в порядке каскада.
Правила `styles.css` загружаются перед `pulsecolor-controls.css`.

### `src/styles.css`

#### Правило 1

Объявляет признак включённой темы для управления жизненным циклом Colorize2Core.

```css
:root {
    --colorize-theme-active: 1;
}
```

#### Правило 2

Задаёт цвет или изображение фона. Определяет позиционирование, порядок наложения или обработку указателя.

```css
body.sc-has-grad::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    background: var(--grad-main);
    pointer-events: none;
}
```

#### Правило 3

Определяет состояние фокуса элементов управления. Определяет состояние наведения указателя. Определяет оформление недоступных элементов управления. Задаёт цвет или изображение фона.

```css
.SonataFullscreenControlsDesktop_sonataPlayButton__QXEEp:not(:disabled):focus-visible, .SonataFullscreenControlsDesktop_sonataPlayButton__QXEEp:not(:disabled):hover
{
    background-color: var(--ym-controls-color-secondary-card-hovered)
}
```

#### Правило 4

Управляет изменением состояния, анимацией, трансформацией или прозрачностью. Управляет обрезкой содержимого и прокруткой.

```css
[class*='MainPage_vibe'] {
    transition: height 1.5s ease;
    overflow: hidden;
}
```

#### Правило 5

Объявляет параметры оформления для указанной области селектора.

```css
html.colorize-new-wave-page {
    --colorize-wave-radius: 12px;
}
```

#### Правило 6

Задаёт цвет текста либо SVG.

```css
.VibeResetButton_context__hsTlv
{
    color: var(--accent-color, var(--ym-controls-color-secondary-text-enabled_variant));
}
```

#### Правило 7

Определяет рамку, скругление или тень. Регулирует внешние или внутренние отступы. Управляет обрезкой содержимого и прокруткой.

```css
html.colorize-new-wave-page [class*='Content_main'] {
    padding: 0 !important;
    overflow: hidden !important;
    border-radius: var(--colorize-wave-radius) !important;
}
```

#### Правило 8

Определяет размеры элемента. Управляет обрезкой содержимого и прокруткой.

```css
html.colorize-new-wave-page [class*='CommonLayout_root'] {
    min-height: 0 !important;
    overflow: hidden !important;
}
```

#### Правило 9

Определяет рамку, скругление или тень. Определяет размеры элемента. Регулирует внешние или внутренние отступы. Управляет расположением элемента в раскладке.

```css
html.colorize-new-wave-page [class*='CommonLayout_root'] > aside,
html.colorize-new-wave-page [class*='CommonLayout_root'] > [class*='Content_root'][class*='newVibe'] {
    align-self: stretch !important;
    box-sizing: border-box !important;
    height: calc(100vh - 1vh) !important;
    height: calc(100dvh - 4vh) !important;
    min-height: 0 !important;
    max-height: calc(100vh - 1vh) !important;
    max-height: calc(100dvh - 4vh) !important;
    margin-block-start: 0 !important;
    margin-block-end: 1vh !important;
    border-radius: 13px;
}
```

#### Правило 10

Определяет размеры элемента.

```css
html.colorize-new-wave-page [class*='CommonLayout_root'] > aside {
    height: calc(100vh - 1vh - 10px) !important;
    height: calc(100dvh - 4vh - 10px) !important;
    max-height: calc(100vh - 1vh - 10px) !important;
    max-height: calc(100dvh - 4vh - 10px) !important;
}
```

#### Правило 11

Ограничивает действие вложенных правил условием media query. Определяет размеры элемента.

```css
@media (max-height: 750px) {
    html.colorize-new-wave-page [class*='CommonLayout_root'] > aside,
    html.colorize-new-wave-page [class*='CommonLayout_root'] > [class*='Content_root'][class*='newVibe'] {
        height: calc(100dvh - 5.5vh) !important;
    }

    html.colorize-new-wave-page [class*='CommonLayout_root'] > aside {
        height: calc(100dvh - 5.5vh - 10px) !important;
        max-height: calc(100dvh - 5.5vh - 10px) !important;
    }
}
```

#### Правило 12

Определяет рамку, скругление или тень. Управляет обрезкой содержимого и прокруткой.

```css
html.colorize-new-wave-page [class*='Content_root'][class*='newVibe'] {
    overflow: hidden !important;
    border-radius: var(--colorize-wave-radius) !important;
}
```

#### Правило 13

Определяет рамку, скругление или тень. Определяет размеры элемента. Регулирует внешние или внутренние отступы. Управляет обрезкой содержимого и прокруткой.

```css
html.colorize-new-wave-page [data-test-id='MAIN_PAGE'],
html.colorize-new-wave-page [class*='DefaultLayout_rootNewWave'] {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    height: 100% !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    border-radius: var(--colorize-wave-radius) !important;
}
```

#### Правило 14

Определяет рамку, скругление или тень. Определяет размеры элемента. Регулирует внешние или внутренние отступы. Определяет позиционирование, порядок наложения или обработку указателя. Управляет изменением состояния, анимацией, трансформацией или прозрачностью. Управляет обрезкой содержимого и прокруткой.

```css
html.colorize-new-wave-page [class*='VibePage_root'] {
    position: relative !important;
    isolation: isolate !important;
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    height: 100% !important;
    min-height: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    border-radius: var(--colorize-wave-radius) !important;
    transform: none !important;
}
```

#### Правило 15

Определяет рамку, скругление или тень. Управляет обрезкой содержимого и прокруткой.

```css
html.colorize-new-wave-page .bg-layer,
html.colorize-new-wave-page .bg-cover,
html.colorize-new-wave-page .bg-gradient {
    border-radius: inherit !important;
    overflow: hidden !important;
}
```

#### Правило 16

Определяет рамку, скругление или тень. Определяет позиционирование, порядок наложения или обработку указателя.

```css
.bg-layer,
.bg-cover,
.bg-gradient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
}
```

#### Правило 17

Определяет позиционирование, порядок наложения или обработку указателя. Управляет изменением состояния, анимацией, трансформацией или прозрачностью. Управляет обрезкой содержимого и прокруткой.

```css
.bg-layer {
    z-index: 0;
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.6s ease;
}
```

#### Правило 18

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
.bg-layer-removing {
    opacity: 0;
}
```

#### Правило 19

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
.bg-cover {
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    opacity: 0;
    transition: opacity 1s ease;
}
```

#### Правило 20

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
.bg-cover-visible {
    opacity: 1;
}
```

#### Правило 21

Задаёт цвет или изображение фона. Определяет позиционирование, порядок наложения или обработку указателя. Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
.bg-gradient {
    z-index: 1;
    background: radial-gradient(
        circle at 70% 70%,
        var(--ym-background-color-secondary-enabled-blur, rgba(0, 0, 0, 0)) 0%,
        var(--ym-background-color-primary-enabled-content, rgba(0, 0, 0, 0.2)) 70%,
        var(--ym-background-color-primary-enabled-basic, rgba(0, 0, 0, 0.3)) 100%
    );
    opacity: 0.6;
}
```

#### Правило 22

Определяет позиционирование, порядок наложения или обработку указателя.

```css
html.colorize-new-wave-page .bg-layer {
    z-index: 0 !important;
}
```

#### Правило 23

Определяет позиционирование, порядок наложения или обработку указателя.

```css
html.colorize-new-wave-page [class*='VibePage_root'] > :not(.bg-layer),
html.colorize-new-wave-page [class*='DefaultLayout_rootNewWave'] > :not(.bg-layer) {
    position: relative !important;
    z-index: 2 !important;
}
```

#### Правило 24

Определяет этапы анимации положения и масштаба фонового изображения.

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
}
```

#### Правило 25

Регулирует внешние или внутренние отступы. Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
[class*='bg-cover'] {
    animation: backgroundMovement 15s infinite cubic-bezier(0.455, 0.03, 0.515, 0.955) !important;
    margin: 0 !important;
}
```

#### Правило 26

Управляет обрезкой содержимого и прокруткой.

```css
.avatar-zoom {
    cursor: zoom-in;
    overflow: hidden;
    transform-origin: center;
}
```

#### Правило 27

Определяет состояние фокуса элементов управления. Определяет состояние наведения указателя. Применяет визуальный фильтр.

```css
.kc5CjvU5hT9KEj0iTt3C:hover,
.kc5CjvU5hT9KEj0iTt3C:focus {
    backdrop-filter: none;
}
```

#### Правило 28

Определяет оформление недоступных элементов управления. Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
.PlayButton_root__nYKdN:not(:disabled) {
    transition: all 0.2s ease-in-out;
}
```

#### Правило 29

Задаёт цвет или изображение фона.

```css
.PageHeaderPlaylist_root__yJBii,
.CommonAlbumPage_averageColorBackground__hs1_3,
.PlaylistPage_averageColorBackground__3wEkw,
.ArtistPage_averageColorBackground__wXTSY {
    background: linear-gradient(
        var(--ym-controls-color-secondary-default-enabled, var(--ym-background-color-secondary-enabled-blur)) 0,
        transparent 100%
    );
}
```

#### Правило 30

Задаёт цвет или изображение фона.

```css
.PlayerBarDesktopWithBackgroundProgressBar_player__ASKKs,
.Content_rootOld__g85_m,
.Content_main__8_wIa,
.PlayerBarDesktopWithBackgroundProgressBar_root__bpmwN.PlayerBarDesktopWithBackgroundProgressBar_important__HzXrK,
.LikesAndHistory_historyIconContainer__KPPbS,
.LikesAndHistoryItem_root__oI1gk {
    background: none;
    background-color: transparent !important;
}
```

#### Правило 31

Определяет рамку, скругление или тень. Регулирует внешние или внутренние отступы.

```css
.DefaultLayout_navbar_application_linux__ejlGn,
.DefaultLayout_navbar_application_windows__3hDQ_,
.Content_main__8_wIa,
.PlayerBarDesktopWithBackgroundProgressBar_root__bpmwN.PlayerBarDesktopWithBackgroundProgressBar_important__HzXrK {
    border: 1px solid var(--color-light-1) !important;
    box-shadow: 0 0 0 1px var(--color-light-1) inset;
    margin-block-start: 0;
    border-radius: var(--ym-layout-border-radius);
    margin-block-end: 10px;
}
```

#### Правило 32

Отключает рамки и внутренние тени контейнеров в режиме без границ. Определяет рамку, скругление или тень.

```css
html.colorize-borderless [class*='DefaultLayout_navbar_application_linux__'],
html.colorize-borderless [class*='DefaultLayout_navbar_application_windows__'],
html.colorize-borderless [class*='Content_main__'],
html.colorize-borderless [class*='PlayerBarDesktopWithBackgroundProgressBar_root__'][class*='PlayerBarDesktopWithBackgroundProgressBar_important__'] {
    border: none !important;
    box-shadow: none !important;
}
```

#### Правило 33

Задаёт цвет или изображение фона. Определяет рамку, скругление или тень.

```css
.CommonLayout_root__WC_W1 {
    background: radial-gradient(
        circle at 70% 70%,
        var(--ym-background-color-secondary-enabled-blur) 0%,
        var(--ym-background-color-primary-enabled-content) 70%,
        var(--ym-background-color-primary-enabled-basic) 100%
    ) !important;

    box-shadow: inset 0 0 40px 10px rgba(0, 0, 0, 0.4) !important;
    border-radius: 12px;
}
```

#### Правило 34

Объявляет параметры оформления для указанной области селектора.

```css
.PlayerBarDesktopWithBackgroundProgressBar_player__ASKKs {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}
```

#### Правило 35

Задаёт цвет или изображение фона. Определяет рамку, скругление или тень.

```css
.WithTopBanner_root__P__x3 {
    background: radial-gradient(
        circle at 65% 65%,
        var(--ym-background-color-secondary-enabled-blur) 0%,
        var(--ym-background-color-primary-enabled-content) 60%,
        var(--ym-background-color-primary-enabled-basic) 100%
    ) !important;
    box-shadow: inset 0 10px 30px rgba(0, 0, 0, 0.6) !important;
}
```

#### Правило 36

Управляет обрезкой содержимого и прокруткой.

```css
.By12CU9obvaH0jYtauNw {
    scrollbar-width: none;
    -ms-overflow-style: none;
}
```

#### Правило 37

Управляет расположением элемента в раскладке.

```css
.By12CU9obvaH0jYtauNw::-webkit-scrollbar {
    display: none;
}
```

#### Правило 38

Определяет позиционирование, порядок наложения или обработку указателя.

```css
.VibeBlock_controls__BpDFL {
    z-index: 2;
}
```

#### Правило 39

Задаёт цвет или изображение фона.

```css
.SonataFullscreenControlsDesktop_sonataPlayButton__QXEEp {
    background-color: var(--ym-controls-color-secondary-card-enabled);
}
```

#### Правило 40

Задаёт цвет или изображение фона. Регулирует внешние или внутренние отступы.

```css
.VibePlayerControls_withYellowPlayButton__vnoer,
.VibePlayerControls_skipButton__z57B_ {
    background-color: hsl(0, 0%, 100%, 0.08) !important;
    margin-inline: 0.15rem;
}
```

#### Правило 41

Применяет тёмный полупрозрачный фон к контролам Vibe при активном флаге контраста. Задаёт цвет или изображение фона.

```css
html.colorize-bright-vibe-controls [class*='VibePlayerBar_button__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_playButton__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_withYellowPlayButton__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_skipButton__'],
html.colorize-bright-vibe-controls [class*='VibePlayerControls_playButton_playing__'],
html.colorize-bright-vibe-controls :is(button, [role='button']).colorize-vibe-control-contrast {
    background: color-mix(in srgb, var(--color-dark-10) 78%, transparent) !important;
}
```

#### Правило 42

Задаёт цвет или изображение фона.

```css
.rWukOKAJh5Ga7JuIp62L {
    background: var(--ym-controls-color-secondary-default-enabled);
}
```

#### Правило 43

Определяет состояние наведения указателя. Задаёт цвет или изображение фона.

```css
.rWukOKAJh5Ga7JuIp62L:hover,
.LikesAndHistory_historyIconContainer__KPPbS:hover,
.LikesAndHistoryItem_root__oI1gk:hover {
    background: var(--ym-controls-color-secondary-default-hovered) !important;
}
```

#### Правило 44

Задаёт цвет текста либо SVG.

```css
.JjlbHZ4FaP9EAcR_1DxF:active {
    color: var(--ym-controls-color-secondary-on_default-enabled) !important;
}
```

#### Правило 45

Определяет состояние наведения указателя. Задаёт цвет текста либо SVG.

```css
.JjlbHZ4FaP9EAcR_1DxF:hover {
    color: var(--ym-controls-color-primary-default-hovered) !important;
}
```

#### Правило 46

Объявляет параметры оформления для указанной области селектора.

```css
.PlaylistFilters_filter_selected__y3GuB {
    border-color: var(--ym-controls-color-secondary-on_default-enabled) !important;
}
```

#### Правило 47

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
.bg-static-mode [class*='bg-cover'] {
    animation: none !important;
    background-position: center !important;
    background-size: cover !important;
}
```

#### Правило 48

Задаёт цвет или изображение фона. Применяет визуальный фильтр.

```css
.TrackModal_root__QrFg6,
.PulseSync_castPopover,
.s7_MO4NdsYs7nPQALD8W {
    background-color: color-mix(in srgb, var(--ym-background-color-secondary-enabled-blur) 65%, transparent);
    backdrop-filter: blur(28px);
}
```

#### Правило 49

Задаёт цвет или изображение фона.

```css
.SHvrm0VRiLVwGqJJjNO8:before {
    background: var(--ym-controls-color-secondary-text-enabled) !important;
}
```

#### Правило 50

Объявляет параметры оформления для указанной области селектора.

```css
.customButton.bordered {
    border-color: var(--ym-controls-color-secondary-text-enabled) !important;
}
```

#### Правило 51

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
[class*='VibeAnimation_enter_active__'],
[class*='VibeAnimation_enter_done__'],
[class*='VibeAnimation_exit__'] {
    opacity: 0 !important;
}
```

#### Правило 52

Задаёт цвет или изображение фона.

```css
.MsLY_qiKofQrwKAr98EC:after
{
    background: linear-gradient(1turn,  var(--ym-background-color-secondary-enabled-blur, var(--ym-background-color-primary-enabled-content)) 0, hsla(0, 0%, 5%, 0) 100%)
}
```

#### Правило 53

Задаёт цвет или изображение фона. Определяет позиционирование, порядок наложения или обработку указателя. Применяет визуальный фильтр.

```css
[class*='StickyHeader_container__'][class*='SearchPage_skeletonStickyHeader__'][class*='SearchPage_important__'] {
    z-index: 1;
    inset-block-start: 4rem;
    background: linear-gradient(180deg, var(--ym-background-color-primary-enabled-content), transparent 50%);
    backdrop-filter: blur(0.5rem) brightness(100%) saturate(140%);
}
```

#### Правило 54

Регулирует внешние или внутренние отступы.

```css
.Navbar_root__chF4R
{
    margin-block-end: 2vh !important;
}
```

#### Правило 55

Задаёт цвет текста либо SVG.

```css
.SonataFullscreenControlsDesktop_sonataButton__69FFc,
.iJVAJMgccD4vj4E4o068,
.WsKeF73pWotx9W1tWdYY,
.QYIUcw5hsJgmlwLrB5fw,
.SonataFullscreenControlsDesktop_playPauseButtonIcon__IkUNX,
.vqAVPWFJlhAOleK_SLk4,
.wy8tgXoSb23KtiD3EFWg,
.Meta_title__GGBnH,
.NewRelease_artistCaption__1F8A9,
.NewReleaseCard_title__N5soS {
    color: var(--ym-controls-color-secondary-on_default-enabled) !important;
}
```

#### Правило 56

Определяет состояние фокуса элементов управления. Задаёт цвет или изображение фона. Задаёт цвет текста либо SVG.

```css
.cover-download-button,
.cover-download-button:focus {
    background-color: var(--ym-controls-color-secondary-card-enabled);
    color: var(--ym-controls-color-secondary-text-enabled) !important;
}
```

#### Правило 57

Определяет оформление недоступных элементов управления. Задаёт цвет текста либо SVG.

```css
:is(button, [role='button']):is(:disabled, [disabled], [aria-disabled='true']) {
    color: var(--ym-controls-color-secondary-text-disabled) !important;
}
```

#### Правило 58

Определяет состояние наведения указателя. Задаёт цвет текста либо SVG.

```css
.ChangeVolume_icon__5Zv2a:hover {
    color: var(--ym-controls-color-primary-default-hovered) !important;
}
```

#### Правило 59

Задаёт цвет текста либо SVG.

```css
.cover-download-button svg {
    fill: var(--ym-controls-color-secondary-text-enabled);
}
```

#### Правило 60

Определяет оформление недоступных элементов управления. Задаёт цвет текста либо SVG.

```css
:is(button, [role='button']):is(:disabled, [disabled], [aria-disabled='true']) :is(svg, use, path) {
    color: var(--ym-controls-color-secondary-default-enabled) !important;
    fill: currentColor !important;
}
```

#### Правило 61

Задаёт цвет текста либо SVG.

```css
.BaseSonataControlsDesktop_playButtonIcon__TlFqv, .VibePlayerControls_withYellowPlayButton__vnoer .VibePlayerControls_playButtonIcon__OXCWN{
    color: var(--ym-controls-color-secondary-text-enabled) !important;
}
```

#### Правило 62

Задаёт цвет или изображение фона.

```css
.FullscreenPlayerDesktop_closeButton__MQ64s
{
    background-color: var(--color-dark-3-6) !important
}
```

#### Правило 63

Задаёт цвет или изображение фона.

```css
.nHWc2sto1C6Gm0Dpw_l0
{
    background-color: var(--color-dark-3-6) !important
}
```

#### Правило 64

Объявляет параметры оформления для указанной области селектора.

```css
.QYIUcw5hsJgmlwLrB5fw {
    --ym-logo-text-color: var(--ym-logo-color-primary-variant) !important;
}
```

#### Правило 65

Задаёт цвет текста либо SVG.

```css
.PulseSync_castPopoverItemTitle {
    color: var(--ym-controls-color-secondary-on_default-enabled) !important;
}
```

#### Правило 66

Задаёт цвет или изображение фона.

```css
.VibeWidget_root__Chpsm {
    background: linear-gradient(180deg, var(--ym-background-color-primary-enabled-content) 0, var(--ym-controls-color-secondary-text-disabled) 80%);
}
```

#### Правило 67

Объявляет параметры оформления для указанной области селектора.

```css
[class*='bg-cover'] {
    will-change: auto;
}
```

#### Правило 68

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
.VibeWidgetAnimation_root__7fpeP {
    opacity: 0;
}
```

### `src/pulsecolor-controls.css`

#### Правило 1

Связывает токены интерфейса Яндекс Музыки с производными палитры Colorize 2.

```css
.ym-dark-theme.ym-dark-theme {
    --ym-controls-color-primary-default-disabled: var(--color-dark-6) !important;
    --ym-controls-color-primary-default-enabled: var(--color-light-9) !important;
    --ym-controls-color-primary-default-hovered: var(--color-light-8) !important;
    --ym-controls-color-primary-default-pressed: var(--color-light-10) !important;
    --ym-controls-color-primary-default-focused_stroke: var(--color-light-6-4) !important;
    --ym-controls-color-primary-on_default-disabled: var(--color-dark-3-8) !important;
    --ym-controls-color-primary-on_default-enabled: var(--color-dark-10) !important;
    --ym-controls-color-primary-outline-disabled: var(--color-dark-7) !important;
    --ym-controls-color-primary-outline-enabled: var(--color-dark-6-10) !important;
    --ym-controls-color-primary-outline-hovered: var(--color-dark-5) !important;
    --ym-controls-color-primary-outline-hovered_stroke: var(--color-light-7) !important;
    --ym-controls-color-primary-outline-selected_stroke: var(--color-light-8) !important;
    --ym-controls-color-primary-outline-pressed: var(--color-dark-4) !important;
    --ym-controls-color-primary-outline-focused_stroke: var(--color-light-6-4) !important;
    --ym-controls-color-primary-on_outline-disabled: var(--color-light-4-6) !important;
    --ym-controls-color-primary-on_outline-enabled: var(--color-light-10) !important;
    --ym-controls-color-primary-text-disabled: var(--color-light-4-5) !important;
    --ym-controls-color-primary-text-enabled: var(--color-light-10-6) !important;
    --ym-controls-color-primary-text-enabled_variant: var(--color-light-9) !important;
    --ym-controls-color-primary-text-hovered: var(--color-light-8) !important;
    --ym-controls-color-primary-text-hovered_variant: var(--color-light-9) !important;
    --ym-controls-color-primary-text-vibe: linear-gradient(180deg, var(--color-light-10-9) 8.63%, var(--color-light-7-7) 77.58%) !important;
    --ym-controls-color-primary-text-vibe_icon: var(--color-light-8-7) !important;
    --ym-controls-color-secondary-default-disabled: var(--color-light-10-1) !important;
    --ym-controls-color-secondary-default-enabled: var(--color-light-10-1) !important;
    --ym-controls-color-secondary-default-hovered: var(--color-light-10-2) !important;
    --ym-controls-color-secondary-default-pressed: var(--color-light-10-3) !important;
    --ym-controls-color-secondary-default-focused: var(--color-dark-10-5) !important;
    --ym-controls-color-secondary-default-focused_stroke: var(--color-light-10-4) !important;
    --ym-controls-color-secondary-on_default-disabled: var(--color-light-6-3) !important;
    --ym-controls-color-secondary-on_default-enabled: var(--color-light-9) !important;
    --ym-controls-color-secondary-on_default-enabled_variant: var(--color-light-10-5) !important;
    --ym-controls-color-secondary-on_default-hovered: var(--color-light-8) !important;
    --ym-controls-color-secondary-outline-disabled_stroke: var(--color-dark-7) !important;
    --ym-controls-color-secondary-outline-enabled_stroke: var(--color-light-8-3) !important;
    --ym-controls-color-secondary-outline-hovered_stroke: var(--color-light-6-5) !important;
    --ym-controls-color-secondary-outline-selected: var(--color-dark-7) !important;
    --ym-controls-color-secondary-outline-selected_stroke: var(--color-light-9) !important;
    --ym-controls-color-secondary-outline-pressed: var(--color-dark-5) !important;
    --ym-controls-color-secondary-outline-focused_stroke: var(--color-dark-5) !important;
    --ym-controls-color-secondary-on_outline-disabled: var(--color-light-4-5) !important;
    --ym-controls-color-secondary-on_outline-enabled: var(--color-light-9) !important;
    --ym-controls-color-secondary-on_outline-enabled_variant: var(--color-light-5-6) !important;
    --ym-controls-color-secondary-text-disabled: var(--color-light-10-1) !important;
    --ym-controls-color-secondary-text-enabled: var(--color-light-8-5) !important;
    --ym-controls-color-secondary-text-enabled_variant: var(--color-light-10) !important;
    --ym-controls-color-secondary-text-hovered: var(--color-light-9) !important;
    --ym-controls-color-secondary-text-selected: var(--color-light-9) !important;
    --ym-controls-color-secondary-card-disabled: var(--color-light-10-3) !important;
    --ym-controls-color-secondary-card-enabled: var(--color-dark-8-9) !important;
    --ym-controls-color-secondary-card-hovered: var(--color-dark-6-9) !important;
    --ym-controls-color-plus-default-disabled: var(--color-light-10-1) !important;
    --ym-controls-color-plus-default-enabled: linear-gradient(90deg, var(--color-light-6), var(--color-light-8) 30%, var(--color-light-7) 75%, var(--color-light-5)) !important;
    --ym-controls-color-plus-default-hovered: linear-gradient(90deg, var(--color-light-6-9), var(--color-light-8-9) 30%, var(--color-light-7-9) 75%, var(--color-light-5-9)) !important;
    --ym-controls-color-plus-default-pressed: var(--color-light-10-3) !important;
    --ym-controls-color-plus-default-focused_stroke: var(--color-light-10-5) !important;
    --ym-controls-color-plus-on_default-disabled: var(--color-light-4-6) !important;
    --ym-controls-color-plus-on_default-enabled: var(--color-light-8-9) !important;
    --ym-controls-color-accent-default-enabled: var(--color-light-7) !important;
    --ym-controls-color-accent-default-hovered: var(--color-light-6) !important;
    --ym-controls-color-accent-default-pressed: var(--color-light-10-8) !important;
    --ym-controls-color-accent-default-focused_stroke: var(--color-light-6-3) !important;
    --ym-controls-color-accent-on_default-enabled: var(--color-dark-10) !important;
}
```

#### Правило 2

Объявляет параметры оформления для указанной области селектора.

```css
.ym-light-theme.ym-light-theme {
    --ym-controls-color-primary-default-disabled: var(--color-light-4) !important;
    --ym-controls-color-primary-default-enabled: var(--color-dark-8) !important;
    --ym-controls-color-primary-default-hovered: var(--color-dark-7) !important;
    --ym-controls-color-primary-default-pressed: var(--color-dark-9) !important;
    --ym-controls-color-primary-default-focused_stroke: var(--color-dark-6-3) !important;
    --ym-controls-color-primary-on_default-disabled: var(--color-dark-4-6) !important;
    --ym-controls-color-primary-on_default-enabled: var(--color-light-10) !important;
    --ym-controls-color-primary-outline-disabled: var(--color-light-4) !important;
    --ym-controls-color-primary-outline-enabled: var(--color-light-7) !important;
    --ym-controls-color-primary-outline-hovered: var(--color-light-5) !important;
    --ym-controls-color-primary-outline-hovered_stroke: var(--color-dark-7) !important;
    --ym-controls-color-primary-outline-selected_stroke: var(--color-dark-8) !important;
    --ym-controls-color-primary-outline-pressed: var(--color-light-10) !important;
    --ym-controls-color-primary-outline-focused_stroke: var(--color-dark-6-3) !important;
    --ym-controls-color-primary-on_outline-disabled: var(--color-dark-4-5) !important;
    --ym-controls-color-primary-on_outline-enabled: var(--color-dark-9) !important;
    --ym-controls-color-primary-text-disabled: var(--color-dark-4-5) !important;
    --ym-controls-color-primary-text-enabled: var(--color-dark-7-8) !important;
    --ym-controls-color-primary-text-enabled_variant: var(--color-dark-9) !important;
    --ym-controls-color-primary-text-hovered: var(--color-dark-8) !important;
    --ym-controls-color-primary-text-hovered_variant: var(--color-light-8) !important;
    --ym-controls-color-primary-text-vibe: linear-gradient(167.52deg, var(--color-dark-10-9) 27.43%, var(--color-dark-8-9) 50.08%, var(--color-dark-6-9) 95.09%) !important;
    --ym-controls-color-primary-text-vibe_icon: var(--color-dark-10-9) !important;
    --ym-controls-color-secondary-default-disabled: var(--color-dark-1-1) !important;
    --ym-controls-color-secondary-default-enabled: var(--color-dark-2-1) !important;
    --ym-controls-color-secondary-default-hovered: var(--color-dark-3-2) !important;
    --ym-controls-color-secondary-default-pressed: var(--color-light-8-6) !important;
    --ym-controls-color-secondary-default-focused: var(--color-dark-5-5) !important;
    --ym-controls-color-secondary-default-focused_stroke: var(--color-dark-3-3) !important;
    --ym-controls-color-secondary-on_default-disabled: var(--color-dark-4-4) !important;
    --ym-controls-color-secondary-on_default-enabled: var(--color-dark-10-9) !important;
    --ym-controls-color-secondary-on_default-enabled_variant: var(--color-light-8-7) !important;
    --ym-controls-color-secondary-on_default-hovered: var(--color-light-8) !important;
    --ym-controls-color-secondary-outline-disabled_stroke: var(--color-dark-2-2) !important;
    --ym-controls-color-secondary-outline-enabled_stroke: var(--color-dark-4-4) !important;
    --ym-controls-color-secondary-outline-hovered_stroke: var(--color-dark-6-5) !important;
    --ym-controls-color-secondary-outline-selected: var(--color-light-6) !important;
    --ym-controls-color-secondary-outline-selected_stroke: var(--color-dark-10) !important;
    --ym-controls-color-secondary-outline-pressed: var(--color-dark-2-2) !important;
    --ym-controls-color-secondary-outline-focused_stroke: var(--color-dark-2-2) !important;
    --ym-controls-color-secondary-on_outline-disabled: var(--color-dark-4-4) !important;
    --ym-controls-color-secondary-on_outline-enabled: var(--color-dark-9) !important;
    --ym-controls-color-secondary-on_outline-enabled_variant: var(--color-dark-6-7) !important;
    --ym-controls-color-secondary-text-disabled: var(--color-light-6-4) !important;
    --ym-controls-color-secondary-text-enabled: var(--color-light-8-5) !important;
    --ym-controls-color-secondary-text-enabled_variant: var(--color-light-6) !important;
    --ym-controls-color-secondary-text-hovered: var(--color-light-7) !important;
    --ym-controls-color-secondary-text-selected: var(--color-light-7) !important;
    --ym-controls-color-secondary-card-disabled: var(--color-light-7-3) !important;
    --ym-controls-color-secondary-card-enabled: var(--color-dark-9-9) !important;
    --ym-controls-color-secondary-card-hovered: var(--color-dark-8-9) !important;
    --ym-controls-color-plus-default-disabled: var(--color-light-6-3) !important;
    --ym-controls-color-plus-default-enabled: linear-gradient(90deg, var(--color-dark-6), var(--color-dark-8) 30%, var(--color-dark-7) 75%, var(--color-dark-5)) !important;
    --ym-controls-color-plus-default-hovered: linear-gradient(90deg, var(--color-dark-6-9), var(--color-dark-8-9) 30%, var(--color-dark-7-9) 75%, var(--color-dark-5-9)) !important;
    --ym-controls-color-plus-default-pressed: var(--color-light-8) !important;
    --ym-controls-color-plus-default-focused_stroke: var(--color-dark-6-4) !important;
    --ym-controls-color-plus-on_default-disabled: var(--color-dark-4-6) !important;
    --ym-controls-color-plus-on_default-enabled: var(--color-light-8-9) !important;
    --ym-controls-color-accent-default-enabled: var(--color-dark-7) !important;
    --ym-controls-color-accent-default-hovered: var(--color-dark-6) !important;
    --ym-controls-color-accent-default-pressed: var(--color-light-8) !important;
    --ym-controls-color-accent-default-focused_stroke: var(--color-dark-6-3) !important;
    --ym-controls-color-accent-on_default-enabled: var(--color-light-10) !important;
}
```

#### Правило 3

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']) {
    transition: color 220ms ease, background-color 220ms ease,
        border-color 220ms ease, outline-color 220ms ease,
        scale 220ms cubic-bezier(.22, 1, .36, 1);
}
```

#### Правило 4

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']) :is(svg, use, path) {
    transition: color 220ms ease, fill 220ms ease, stroke 220ms ease;
}
```

#### Правило 5

Определяет оформление недоступных элементов управления. Задаёт цвет текста либо SVG.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):not(:disabled):not([disabled]):not([aria-disabled='true']) :is(svg, use, path) {
    color: var(--ym-controls-color-secondary-text-enabled) !important;
}
```

#### Правило 6

Определяет оформление недоступных элементов управления. Задаёт цвет текста либо SVG.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):not(:disabled):not([disabled]):not([aria-disabled='true']) svg:not([fill='none']):not([stroke]) {
    fill: currentColor !important;
}
```

#### Правило 7

Определяет состояние фокуса элементов управления. Определяет состояние наведения указателя. Определяет оформление недоступных элементов управления. Задаёт цвет текста либо SVG.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):is(:hover, :focus-visible):not(:disabled):not([disabled]):not([aria-disabled='true']) :is(svg, use, path) {
    color: var(--ym-controls-color-primary-text-hovered) !important;
}
```

#### Правило 8

Определяет оформление недоступных элементов управления. Задаёт цвет текста либо SVG.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):active:not(:disabled):not([disabled]):not([aria-disabled='true']) :is(svg, use, path) {
    color: var(--ym-controls-color-primary-default-pressed) !important;
}
```

#### Правило 9

Определяет состояние фокуса элементов управления. Определяет оформление недоступных элементов управления.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):focus-visible:not(:disabled):not([disabled]):not([aria-disabled='true']) {
    outline: 2px solid var(--ym-controls-color-primary-default-focused_stroke) !important;
    outline-offset: 3px;
}
```

#### Правило 10

Определяет оформление недоступных элементов управления. Задаёт цвет текста либо SVG.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):is(:disabled, [disabled], [aria-disabled='true']),
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):is(:disabled, [disabled], [aria-disabled='true']) :is(svg, use, path) {
    color: var(--ym-controls-color-secondary-text-disabled) !important;
}
```

#### Правило 11

Задаёт цвет или изображение фона.

```css
:is(button, [role='button']):is([class*='VibePlayerControls_withYellowPlayButton'], [class*='VibePlayerControls_playButton__'], [class*='VibePlayerControls_skipButton']) {
    background-color: #ffffff14 !important;
}
```

#### Правило 12

Задаёт цвет или изображение фона.

```css
:is([class*='SonataFullscreenControlsDesktop_sonataPlayButton'], .cover-download-button) {
    background-color: var(--ym-controls-color-secondary-card-enabled);
}
```

#### Правило 13

Определяет состояние фокуса элементов управления. Определяет состояние наведения указателя. Определяет оформление недоступных элементов управления. Задаёт цвет или изображение фона.

```css
:is([class*='SonataFullscreenControlsDesktop_sonataPlayButton'], .cover-download-button):is(:hover, :focus-visible):not(:disabled) {
    background-color: var(--ym-controls-color-secondary-card-hovered);
}
```

#### Правило 14

Задаёт цвет или изображение фона.

```css
.rWukOKAJh5Ga7JuIp62L {
    background: var(--ym-controls-color-secondary-default-enabled);
}
```

#### Правило 15

Определяет состояние фокуса элементов управления. Определяет состояние наведения указателя. Задаёт цвет или изображение фона.

```css
:is(.rWukOKAJh5Ga7JuIp62L, [class*='LikesAndHistory_historyIconContainer'], [class*='LikesAndHistoryItem_root']):is(:hover, :focus-visible) {
    background: var(--ym-controls-color-secondary-default-hovered) !important;
}
```

#### Правило 16

Определяет состояние фокуса элементов управления. Определяет состояние наведения указателя. Задаёт цвет текста либо SVG.

```css
.JjlbHZ4FaP9EAcR_1DxF:is(:hover, :focus-visible),
[class*='ChangeVolume_icon']:is(:hover, :focus-visible) {
    color: var(--ym-controls-color-primary-default-hovered) !important;
}
```

#### Правило 17

Задаёт цвет текста либо SVG.

```css
.JjlbHZ4FaP9EAcR_1DxF:active {
    color: var(--ym-controls-color-secondary-on_default-enabled) !important;
}
```

#### Правило 18

Объявляет параметры оформления для указанной области селектора.

```css
[class*='PlaylistFilters_filter_selected'],
.customButton.bordered {
    border-color: var(--ym-controls-color-secondary-text-enabled) !important;
}
```

#### Правило 19

Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
:is([class*='VibePlayerControls_withYellowPlayButton'], [class*='VibePlayerControls_playButton__'],
    [class*='VibePlayerControls_skipButton'], [class*='VibePlayerBar_button'],
    [class*='AlbumCover_root'], [class*='AlbumCover_coverContainer']) {
    transition: scale 220ms cubic-bezier(.22, 1, .36, 1), color 220ms ease, background-color 220ms ease;
}
```

#### Правило 20

Ограничивает действие вложенных правил условием media query. Определяет состояние наведения указателя.

```css
@media (hover: hover) and (prefers-reduced-motion: no-preference) {

    :is([class*='VibePlayerControls_withYellowPlayButton'], [class*='VibePlayerControls_playButton__'],
        [class*='VibePlayerControls_skipButton'], [class*='VibePlayerBar_button'],
        [class*='AlbumCover_root'], [class*='AlbumCover_coverContainer']):hover:not(:disabled):not([disabled]):not([aria-disabled='true']) {
        scale: 1.04;
    }

    [class*='AlbumCover_root']:hover [class*='AlbumCover_coverContainer'] {
        scale: 1;
    }
}
```

#### Правило 21

Ограничивает действие вложенных правил условием media query.

```css
@media (prefers-reduced-motion: no-preference) {
    :is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):active:not(:disabled):not([disabled]):not([aria-disabled='true']) {
        scale: .97;
    }
}
```

#### Правило 22

Ограничивает действие вложенных правил условием media query. Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
@media (prefers-reduced-motion: reduce) {

    :is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button'], svg, use, path),
    :is([class*='AlbumCover_root'], [class*='AlbumCover_coverContainer']) {
        transition: none !important;
        scale: 1 !important;
    }
}
```

#### Правило 23

Размещает переходный слой градиента и содержимое в соответствующих слоях наложения. Определяет позиционирование, порядок наложения или обработку указателя.

```css
[data-colorize-palette-fade] {
    isolation: isolate;
}
```

#### Правило 24

Размещает переходный слой градиента и содержимое в соответствующих слоях наложения. Определяет рамку, скругление или тень. Определяет позиционирование, порядок наложения или обработку указателя.

```css
.colorize-palette-background {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    pointer-events: none;
    contain: strict;
}
```

#### Правило 25

Объявляет параметры оформления для указанной области селектора.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']) {
    transition-duration: 920ms, 920ms, 920ms, 220ms, 220ms;
}
```

#### Правило 26

Определяет состояние фокуса элементов управления. Определяет состояние наведения указателя.

```css
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']):is(:hover, :focus-visible, :active),
:is(.ym-dark-theme, .ym-light-theme) :is(button, [role='button']) :is(svg, use, path) {
    transition-duration: 220ms;
}
```

#### Правило 27

Ограничивает действие вложенных правил условием media query. Управляет расположением элемента в раскладке.

```css
@media (prefers-reduced-motion: reduce) {
    .colorize-palette-background {
        display: none !important;
    }
}
```

#### Правило 28

Задаёт цвет текста либо SVG.

```css
.WheelItem_title_accentColor__QcDTs {
    color: var(--ym-controls-color-secondary-text-enabled_variant) !important;
}
```

#### Правило 29

Ограничивает перекраску специальными действиями колеса настройки и перемешивания. Управляет изменением состояния, анимацией, трансформацией или прозрачностью. Применяет визуальный фильтр.

```css
:is([data-test-id='WHEEL_SETTING_ITEM'], [data-test-id='WHEEL_RESHUFFLE_ITEM']) img[class*='WheelItem_cover'] {
    filter: var(--colorize-wheel-icon-filter, none) !important;
    transition: filter 920ms cubic-bezier(.22, 1, .36, 1);
}
```

#### Правило 30

Ограничивает действие вложенных правил условием media query. Управляет изменением состояния, анимацией, трансформацией или прозрачностью.

```css
@media (prefers-reduced-motion: reduce) {
    :is([data-test-id='WHEEL_SETTING_ITEM'], [data-test-id='WHEEL_RESHUFFLE_ITEM']) img[class*='WheelItem_cover'] {
        transition: none !important;
    }
}
```

#### Правило 31

Объявляет параметры оформления для указанной области селектора.

```css
[data-test-id='PLAYERBAR_DESKTOP'] {
    --player-average-color-background: var(--color-dark-5) !important;
    --average-color-background: var(--color-dark-5) !important;
}
```

#### Правило 32

Определяет размеры элемента. Регулирует внешние или внутренние отступы. Управляет расположением элемента в раскладке.

```css
[class*='CommonLayout_root']>aside[data-test-id='NAVBAR'] {
    grid-row: 1 !important;
    align-self: stretch !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin-block-start: 0 !important;
    margin-block-end: 10px !important;
    box-sizing: border-box;
}
```

#### Правило 33

Регулирует внешние или внутренние отступы. Управляет расположением элемента в раскладке.

```css
html.colorize-new-wave-page [class*='CommonLayout_root']>aside[data-test-id='NAVBAR'] {
    grid-row: auto !important;

    margin-block-end: 1vh !important;
}
```

#### Правило 34

Ограничивает действие вложенных правил условием media query. Определяет размеры элемента.

```css
@media (max-height: 750px) {
    html.colorize-new-wave-page [class*='CommonLayout_root']>aside[data-test-id='NAVBAR'] {
        height: calc(100dvh - 5.5vh) !important;
        max-height: calc(100dvh - 5.5vh) !important;
    }
}
```

## Проверки

Команды из Colorize2Core: `pnpm test:ui`, `pnpm test:contrast`, `pnpm test:lifecycle`.
Проверки используют CSS Colorize-2; сценарии реального приложения проверяются отдельно.
