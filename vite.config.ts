import { defineConfig } from 'vite'
import addonConfig from './addon.config.mjs'
import { createAddonConfig } from './scripts/vite-addon.mjs'

export default defineConfig(({ mode }) => createAddonConfig('.', addonConfig, mode))
