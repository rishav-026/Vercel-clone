require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const Redis = require('ioredis')
const mime = require('mime-types')

const accessKeyId = process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY
const region = process.env.AWS_REGION || 'eu-north-1'
const PROJECT_ID = process.env.PROJECT_ID
const REDIS_URL = process.env.REDIS_URL

if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS credentials')
}

if (!PROJECT_ID) {
    throw new Error('Missing PROJECT_ID')
}

let publisher = null
let redisAvailable = false

if (REDIS_URL) {
    publisher = new Redis(REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false
    })

    publisher.on('error', (err) => {
        console.error('Redis error:', err.message)
    })

    publisher.connect()
        .then(() => {
            redisAvailable = true
            console.log('Redis connected')
        })
        .catch((err) => {
            redisAvailable = false
            console.error('Redis connect failed:', err.message)
        })
}

function publishLog(log) {
    const line = String(log)
    console.log(line)

    if (!publisher || !redisAvailable) return

    publisher.publish(`logs:${PROJECT_ID}`, line).catch(() => {})
}

const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey }
})

function readPackageJson(projectPath) {
    const pkgPath = path.join(projectPath, 'package.json')
    if (!fs.existsSync(pkgPath)) return null

    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
}

function detectProject(projectPath) {
    const pkg = readPackageJson(projectPath)
    const hasRootIndex = fs.existsSync(path.join(projectPath, 'index.html'))
    const hasPublicIndex = fs.existsSync(path.join(projectPath, 'public', 'index.html'))
    const hasStaticAssetsDir = fs.existsSync(path.join(projectPath, 'assets'))
    const rootHtmlFiles = fs.existsSync(projectPath)
        ? fs.readdirSync(projectPath).filter((name) => name.toLowerCase().endsWith('.html'))
        : []
    const publicDir = path.join(projectPath, 'public')
    const publicHtmlFiles = fs.existsSync(publicDir)
        ? fs.readdirSync(publicDir).filter((name) => name.toLowerCase().endsWith('.html'))
        : []
    const staticLayoutHelp = 'For plain HTML/CSS/JS repos, add index.html at repo root/public or keep exactly one HTML file in root/public so it can be auto-mapped.'

    if (!pkg) {
        if (hasRootIndex) {
            return {
                type: 'static',
                outputDir: '.',
                buildCommand: null
            }
        }

        if (hasPublicIndex) {
            return {
                type: 'static-public',
                outputDir: 'public',
                buildCommand: null
            }
        }

        if (!hasRootIndex && rootHtmlFiles.length === 1) {
            return {
                type: 'static-single-html',
                outputDir: '.',
                buildCommand: null,
                entryFile: rootHtmlFiles[0]
            }
        }

        if (!hasPublicIndex && publicHtmlFiles.length === 1) {
            return {
                type: 'static-public-single-html',
                outputDir: 'public',
                buildCommand: null,
                entryFile: publicHtmlFiles[0]
            }
        }

        // Basic fallback for plain static repos that keep files in root but use non-standard names.
        if (hasStaticAssetsDir) {
            return {
                type: 'static',
                outputDir: '.',
                buildCommand: null
            }
        }

        throw new Error(`Could not detect project type. ${staticLayoutHelp} Otherwise include a package.json with a build script.`)
    }

    const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
    }
    const hasBuildScript = Boolean(pkg.scripts && pkg.scripts.build)

    if (deps.vite && hasBuildScript) {
        return {
            type: 'vite',
            outputDir: 'dist',
            buildCommand: 'npm install && npm run build'
        }
    }

    if (deps['react-scripts'] && hasBuildScript) {
        return {
            type: 'cra',
            outputDir: 'build',
            buildCommand: 'npm install && npm run build'
        }
    }

    if (deps.next && hasBuildScript) {
        return {
            type: 'next-static',
            outputDir: 'out',
            buildCommand: 'npm install && npm run build'
        }
    }

    if (hasBuildScript) {
        return {
            type: 'node-build',
            outputDir: 'dist',
            buildCommand: 'npm install && npm run build'
        }
    }

    if (hasRootIndex) {
        return {
            type: 'static',
            outputDir: '.',
            buildCommand: null
        }
    }

    if (hasPublicIndex) {
        return {
            type: 'static-public',
            outputDir: 'public',
            buildCommand: null
        }
    }

    if (!hasRootIndex && rootHtmlFiles.length === 1) {
        return {
            type: 'static-single-html',
            outputDir: '.',
            buildCommand: null,
            entryFile: rootHtmlFiles[0]
        }
    }

    if (!hasPublicIndex && publicHtmlFiles.length === 1) {
        return {
            type: 'static-public-single-html',
            outputDir: 'public',
            buildCommand: null,
            entryFile: publicHtmlFiles[0]
        }
    }

    throw new Error(`package.json found, but no build script or static entry file was found. ${staticLayoutHelp}`)
}

function ensureEntryIndexFile(projectPath, project) {
    if (!project || !project.entryFile || project.entryFile.toLowerCase() === 'index.html') {
        return
    }

    const outputPath = path.resolve(projectPath, project.outputDir)
    const sourcePath = path.join(outputPath, project.entryFile)
    const indexPath = path.join(outputPath, 'index.html')

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Detected HTML entry file not found: ${project.entryFile}`)
    }

    if (fs.existsSync(indexPath)) {
        return
    }

    fs.copyFileSync(sourcePath, indexPath)
    publishLog(`Mapped ${project.entryFile} -> index.html`)
}

function runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        const child = exec(command, { cwd })

        child.stdout.on('data', (data) => {
            publishLog(data.toString())
        })

        child.stderr.on('data', (data) => {
            publishLog(data.toString())
        })

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with exit code ${code}`))
                return
            }

            resolve()
        })
    })
}

function shouldUpload(file) {
    const normalized = file.replace(/\\/g, '/')
    const parts = normalized.split('/')
    const ignoredDirs = new Set(['.git', 'node_modules', '.vercel'])
    const ignoredFiles = new Set([
        '.env',
        '.env.local',
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml'
    ])

    if (parts.some((part) => ignoredDirs.has(part))) return false
    if (ignoredFiles.has(parts[parts.length - 1])) return false

    return true
}

async function uploadOutput(outputPath) {
    const files = fs.readdirSync(outputPath, { recursive: true })

    for (const file of files) {
        if (!shouldUpload(file)) continue

        const filePath = path.join(outputPath, file)
        if (fs.lstatSync(filePath).isDirectory()) continue

        publishLog(`Uploading ${file}`)

        const command = new PutObjectCommand({
            Bucket: 'vercel-clone-myproject',
            Key: `__outputs/${PROJECT_ID}/${file}`,
            Body: fs.createReadStream(filePath),
            ContentType: mime.lookup(filePath) || 'application/octet-stream'
        })

        await s3Client.send(command)
        publishLog(`Uploaded ${file}`)
    }
}

async function init() {
    try {
        publishLog('Build Started...')

        const projectPath = path.join(__dirname, 'output')
        const project = detectProject(projectPath)

        publishLog(`Detected project: ${project.type}`)

        if (project.buildCommand) {
            publishLog(`Running: ${project.buildCommand}`)
            await runCommand(project.buildCommand, projectPath)
        } else {
            publishLog('Static project detected. Skipping build.')
        }

        ensureEntryIndexFile(projectPath, project)

        publishLog('Build Complete')

        const outputPath = path.resolve(projectPath, project.outputDir)

        if (!fs.existsSync(outputPath)) {
            throw new Error(`Output folder not found: ${project.outputDir}`)
        }

        publishLog(`Uploading from: ${project.outputDir}`)
        await uploadOutput(outputPath)
        publishLog('Deployment Done')
    } catch (err) {
        publishLog(`error: ${err.message}`)
        process.exitCode = 1
    } finally {
        if (publisher) {
            await publisher.quit().catch(() => {})
        }
    }
}

init()
