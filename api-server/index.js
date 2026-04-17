require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const express = require('express')
const { generateSlug } = require('random-word-slugs')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')
const { Server } = require('socket.io')
const Redis = require('ioredis')

const app = express()
const PORT = Number(process.env.PORT || 9000)
const SOCKET_PORT = Number(process.env.SOCKET_PORT || 9002)
if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required')
}
const REDIS_URL = process.env.REDIS_URL
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const CLUSTER = process.env.ECS_CLUSTER_ARN || 'arn:aws:ecs:eu-north-1:991346768548:cluster/builder-clusters'
const TASK_DEFINITION = process.env.ECS_TASK_DEFINITION || 'arn:aws:ecs:eu-north-1:991346768548:task-definition/builder-task'
const BUILDER_CONTAINER_NAME = process.env.BUILDER_CONTAINER_NAME || 'builder-image'
const PROJECT_PROTOCOL = process.env.PROJECT_PROTOCOL || 'http'
const PROJECT_BASE_DOMAIN = process.env.PROJECT_BASE_DOMAIN || 'localhost:8000'

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY

function normalizeProjectSlug(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 63)
        .replace(/^-|-$/g, '')
}

const subscriber = new Redis(REDIS_URL)
subscriber.on('error', (error) => {
    console.error('Redis error:', error.message)
})
const logsStore = {}

const io = new Server({ cors: '*' })

io.on('connection', socket => {
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message', `Joined ${channel}`)
    })
})
console.log("Starting socket server...")
io.listen(SOCKET_PORT, () => console.log(`Socket Server ${SOCKET_PORT}`))

const ecsClientConfig = { region: AWS_REGION }
if (accessKeyId && secretAccessKey) {
    ecsClientConfig.credentials = { accessKeyId, secretAccessKey }
}
const ecsClient = new ECSClient(ecsClientConfig)

if (!CLUSTER || !TASK_DEFINITION) {
    throw new Error('Missing ECS configuration. Set ECS_CLUSTER_ARN and ECS_TASK_DEFINITION')
}

app.use(express.json())
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }
    next()
})



app.post('/project', async (req, res) => {
    try {
        const { gitURL, slug } = req.body
        if (!gitURL || typeof gitURL !== 'string') {
            return res.status(400).json({ status: 'error', error: 'gitURL is required' })
        }

        const requestedSlug = normalizeProjectSlug(slug)
        if (slug && !requestedSlug) {
            return res.status(400).json({
                status: 'error',
                error: 'Deployment name must contain at least one letter or number'
            })
        }

        const projectSlug = requestedSlug || generateSlug()
        const command = new RunTaskCommand({
            cluster: CLUSTER,
            taskDefinition: TASK_DEFINITION,
            launchType: 'FARGATE',
            count: 1,
            networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: 'ENABLED',
                    subnets: [
                        'subnet-03cd0b050dffd5fd6',
                        'subnet-053154ce1d0960ae9',
                        'subnet-0cac4eaaa696e6d66'
                    ],
                    securityGroups: ['sg-03bc729f77d43f0e3']
                }
            },
            overrides: {
                containerOverrides: [
                    {
                        name: BUILDER_CONTAINER_NAME,
                        environment: [
                            { name: 'GIT_REPOSITORY__URL', value: gitURL },
                            { name: 'PROJECT_ID', value: projectSlug }
                        ]
                    }
                ]
            }
        })

        const result = await ecsClient.send(command)
        const taskArn = result.tasks && result.tasks[0] ? result.tasks[0].taskArn : null

        return res.json({
            status: 'queued',
            data: {
                projectSlug,
                taskArn,
                url: `${PROJECT_PROTOCOL}://${projectSlug}.${PROJECT_BASE_DOMAIN}`
            }
        })
    } catch (error) {
        console.error('RunTask failed:', error)
        return res.status(500).json({
            status: 'error',
            error: error.message || 'Failed to queue build task'
        })
    }
})


app.get('/logs/:id', (req, res) => {
    const channel = `logs:${req.params.id}`
    res.json({ logs: logsStore[channel] || [] })
})


async function initRedisSubscribe() {
    console.log('Subscribed to logs....')
    await subscriber.psubscribe('logs:*')

    subscriber.on('pmessage', (pattern, channel, message) => {
    if (!logsStore[channel]) logsStore[channel] = []
    logsStore[channel].push(message)

    io.to(channel).emit('message', message)
})
}

initRedisSubscribe().catch((error) => {
    console.error('Redis subscribe failed:', error.message)
})

app.listen(PORT, () => console.log(`API Server Running.. ${PORT}`))
