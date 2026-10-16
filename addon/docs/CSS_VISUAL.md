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

## Проверки

Из корня Colorize2Core: `pnpm test:ui` и `pnpm test:contrast`.
Тесты читают CSS соседнего проекта Colorize-2 и проверяют фон, состояния кнопок,
переходы, reduced motion и контраст. Проверка в Яндекс Музыке выполняется отдельно.
