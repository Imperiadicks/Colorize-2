import type { UserConfig } from 'vite'
export function createAddonConfig(part: string, config: { type: string; directoryName: string; [key: string]: unknown }, mode: string): UserConfig
