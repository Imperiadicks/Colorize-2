# Colorize 2

Тема и runtime находятся в отдельных проектах:

- `src/` — CSS; `addon/` — настройки, изображения и авторская документация. Сохранён ID `5510a44e-9425-465d-8e1a-e929b1da27ec`.
- [Colorize2Core](https://github.com/Imperiadicks/Colorize2Core) — Colorize2Core: динамическая палитра, фон, контраст кнопок и остальные эффекты. ID `31c62ba2-b6f6-4ba7-934e-39146eccfe69`.

Тема зависит от Colorize2Core. Настройки находятся только у темы Colorize 2;
скрипт читает их по прежнему имени через `pulsesyncApi`.

## Разработка

```bash
pnpm install
pnpm build
pnpm dev
```

`pnpm build` собирает только тему в `dist/<id>`. Core собирается отдельно:
`pnpm --dir ../Colorize2Core build`. Продакшен-сборки минифицируются.

`pnpm sync` устанавливает тему с сохранением пользовательских настроек.
`pnpm build:sync` собирает и устанавливает. `pnpm dev` следит за исходниками,
собирает без минификации и устанавливает тему. После установки обновите список
дополнений PulseSync, включите Colorize2Core и выберите тему Colorize 2. Изменения скрипта
могут потребовать перезагрузки Яндекс Музыки.

Каталог установки можно задать через `PULSESYNC_ADDONS_DIR`.

## Структура

`src/` — исходники темы; `addon/` — содержимое пакета; `scripts/` — сборка и установка.
`dist/` и `node_modules/` создаются командами `pnpm install` и `pnpm build`, в исходники не входят.

## Техническая документация

- [CSS и визуальные эффекты](https://github.com/Imperiadicks/Colorize-2/blob/main/addon/docs/CSS_VISUAL.md)

## Репозитории

- [Тема Colorize 2](https://github.com/Imperiadicks/Colorize-2)
- [Скрипт Colorize2Core](https://github.com/Imperiadicks/Colorize2Core)

Для совместной разработки оба репозитория размещаются в одной родительской папке:

```bash
git clone https://github.com/Imperiadicks/Colorize-2.git
git clone https://github.com/Imperiadicks/Colorize2Core.git
```
