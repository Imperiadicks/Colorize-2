import path from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function createAddonConfig(part, config, mode) {
    const packageDir = path.join(rootDir, part)
    const outDir = path.join(rootDir, 'dist', config.directoryName)
    if (config.type !== 'theme') throw new Error('This project builds only the Colorize 2 theme')
    return {
        resolve: { alias: { '@': path.join(packageDir, 'src') } },
        build: {
            outDir,
            emptyOutDir: true,
            minify: mode === 'development' ? false : 'esbuild',
            target: 'chrome140',
            sourcemap: false,
            cssCodeSplit: false,
            lib: {
                entry: path.join(packageDir, 'src/main.ts'),
                formats: ['iife'],
                name: 'ColorizeTheme',
                fileName: () => 'script.js',
                cssFileName: 'script',
            },
        },
        plugins: [{
            name: 'package-colorize-addon',
            async closeBundle() {
                await fs.cp(path.join(packageDir, 'addon'), outDir, { recursive: true })
                await fs.unlink(path.join(outDir, 'script.js'))
                const { directoryName, ...metadata } = config
                metadata.css = 'script.css'
                await fs.writeFile(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 4) + '\n')
            },
        }],
    }
}
