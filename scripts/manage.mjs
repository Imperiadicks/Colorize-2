import path from 'node:path'
import os from 'node:os'
import { promises as fs } from 'node:fs'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const parts = ['.']
const command = process.argv[2]
let stopped = false
let child

async function configFor(part) {
    const url = pathToFileURL(path.join(root, part, 'addon.config.mjs'))
    url.searchParams.set('revision', String(Date.now()))
    const { default: config } = await import(url.href)
    if (!config.directoryName || !/^[a-zA-Z0-9_-]+$/.test(config.directoryName)) {
        throw new Error(`Invalid directoryName: ${config.directoryName}`)
    }
    return config
}

async function build(development = false) {
    for (const part of parts) {
        if (stopped) return
        const args = [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--config', `${part}/vite.config.ts`]
        if (development) args.push('--mode', 'development')
        await new Promise((resolve, reject) => {
            child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' })
            child.once('error', reject)
            child.once('exit', code => {
                child = undefined
                code === 0 ? resolve() : reject(new Error(`Build ${part} failed (${code})`))
            })
        })
    }
}

function addonsDirectory() {
    const appData = process.platform === 'win32'
        ? process.env.APPDATA || path.join(os.homedir(), 'AppData/Roaming')
        : process.platform === 'darwin'
          ? path.join(os.homedir(), 'Library/Application Support')
          : process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
    return path.resolve(process.env.PULSESYNC_ADDONS_DIR || path.join(appData, 'PulseSync/addons'))
}

async function readOptional(file) {
    try { return await fs.readFile(file) }
    catch (error) { if (error.code === 'ENOENT') return null; throw error }
}

async function sync() {
    const targetRoot = addonsDirectory()
    const packages = []

    for (const part of parts) {
        const config = await configFor(part)
        const source = path.join(root, 'dist', config.directoryName)
        const metadata = JSON.parse(await fs.readFile(path.join(source, 'metadata.json'), 'utf8'))
        if (metadata.id !== config.id || metadata.type !== config.type) throw new Error(`Invalid build: ${part}`)
        for (const file of [metadata.script, metadata.css].filter(Boolean)) {
            const resolved = path.resolve(source, file)
            if (path.dirname(resolved) !== source) throw new Error(`Invalid build file: ${file}`)
            await fs.access(resolved)
        }
        packages.push({ config, source })
    }
    await fs.mkdir(targetRoot, { recursive: true })
    for (const { config, source } of packages) {
        const target = path.join(targetRoot, config.directoryName)
        const previous = await readOptional(path.join(target, 'metadata.json'))
        if (previous && JSON.parse(previous).id !== config.id) throw new Error(`Different addon at ${target}`)
        const staging = await fs.mkdtemp(path.join(targetRoot, `.colorize-stage-${config.directoryName}-`))
        let backup
        try {
            await fs.cp(source, staging, { recursive: true })
            const settings = await readOptional(path.join(target, 'pulsesync.settings.json'))
            if (settings) await fs.writeFile(path.join(staging, 'pulsesync.settings.json'), settings)
            try {
                await fs.access(target)
                const backupRoot = path.join(targetRoot, '.colorize-backups')
                await fs.mkdir(backupRoot, { recursive: true })
                backup = path.join(backupRoot, `${config.directoryName}-${Date.now()}`)
                await fs.rename(target, backup)
            } catch (error) { if (error.code !== 'ENOENT') throw error }
            try { await fs.rename(staging, target) }
            catch (error) { if (backup) await fs.rename(backup, target); throw error }
            console.log(`Installed ${config.name}: ${target}`)
        } finally {
            await fs.rm(staging, { recursive: true, force: true })
        }
    }
}

async function signature() {
    const hash = createHash('sha256')
    async function visit(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        entries.sort((a, b) => a.name.localeCompare(b.name))
        for (const entry of entries) {
            if (['node_modules', 'dist', '.idea', '.git', '.backups'].includes(entry.name)) continue
            const file = path.join(dir, entry.name)
            hash.update(file)
            if (entry.isDirectory()) await visit(file)
            else hash.update(await fs.readFile(file))
        }
    }
    for (const part of [...parts, 'scripts']) await visit(path.join(root, part))
    return hash.digest('hex')
}

async function dev() {
    console.log('Watching Colorize-2. Ctrl+C — выход.')
    let previous = ''
    while (!stopped) {
        try {
            const current = await signature()
            if (current !== previous) {
                await build(true)
                if (!stopped && await signature() === current) {
                    await sync()
                    previous = current
                }
            }
        } catch (error) {
            if (!stopped) console.error(error.message)
        }
        if (!stopped) await new Promise(resolve => setTimeout(resolve, 1000))
    }
}

process.on('SIGINT', () => { stopped = true; child?.kill('SIGINT') })
process.on('SIGTERM', () => { stopped = true; child?.kill('SIGTERM') })

try {
    if (command === 'build') await build()
    else if (command === 'sync') await sync()
    else if (command === 'build-sync') { await build(); await sync() }
    else if (command === 'dev') await dev()
    else throw new Error(`Unknown command: ${command}`)
} catch (error) {
    if (!stopped) { console.error(error); process.exitCode = 1 }
}
