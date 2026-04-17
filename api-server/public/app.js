const deployForm = document.getElementById('deployForm')
const repoUrlInput = document.getElementById('repoUrl')
const deployBtn = document.getElementById('deployBtn')
const slugEl = document.getElementById('projectSlug')
const statusEl = document.getElementById('projectStatus')
const deployUrlEl = document.getElementById('deployUrl')
const logsEl = document.getElementById('logs')
const clearLogsBtn = document.getElementById('clearLogsBtn')

let socket = null
let activeChannel = null

function setStatus(text, cls) {
  statusEl.textContent = text
  statusEl.classList.remove('status-ok', 'status-fail', 'status-run')
  if (cls) statusEl.classList.add(cls)
}

function appendLog(line) {
  const clean = String(line || '').replace(/\u001b\[[0-9;]*m/g, '').replace(/\u001b\[2K\r?/g, '')
  logsEl.textContent += (logsEl.textContent.endsWith('\n') || logsEl.textContent.length === 0 ? '' : '\n') + clean
  logsEl.scrollTop = logsEl.scrollHeight
}

function setDeployUrl(url) {
  if (!url || url === '-') {
    deployUrlEl.textContent = '-'
    deployUrlEl.removeAttribute('href')
    return
  }
  deployUrlEl.textContent = url
  deployUrlEl.href = url
}

async function loadPreviousLogs(slug) {
  try {
    const res = await fetch(`/logs/${encodeURIComponent(slug)}`)
    const data = await res.json()
    const lines = Array.isArray(data.logs) ? data.logs : []
    if (lines.length > 0) {
      logsEl.textContent = ''
      lines.forEach(appendLog)
    }
  } catch (err) {
    appendLog(`error: failed to fetch previous logs (${err.message})`)
  }
}

function connectSocket(channel) {
  if (!socket) {
    socket = io(`http://${window.location.hostname}:9002`, {
      transports: ['websocket', 'polling']
    })

    socket.on('connect_error', (err) => {
      appendLog(`error: socket connect failed (${err.message})`)
      setStatus('Socket Error', 'status-fail')
    })

    socket.on('message', (msg) => {
      appendLog(msg)
      if (String(msg).toLowerCase().includes('done')) {
        setStatus('Completed', 'status-ok')
      }
      if (String(msg).toLowerCase().includes('error')) {
        setStatus('Failed', 'status-fail')
      }
    })
  }

  activeChannel = channel
  socket.emit('subscribe', channel)
}

clearLogsBtn.addEventListener('click', () => {
  logsEl.textContent = 'Logs cleared.'
})

deployForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const gitURL = repoUrlInput.value.trim()
  if (!gitURL) return

  deployBtn.disabled = true
  deployBtn.textContent = 'Deploying...'
  logsEl.textContent = 'Queueing build...'
  setStatus('Queued', 'status-run')

  try {
    const response = await fetch('/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gitURL })
    })

    const payload = await response.json()
    if (!response.ok || payload.status !== 'queued') {
      throw new Error(payload.error || 'Deploy failed')
    }

    const { projectSlug, url } = payload.data
    slugEl.textContent = projectSlug
    setDeployUrl(url)
    setStatus('Running', 'status-run')

    const channel = `logs:${projectSlug}`
    connectSocket(channel)
    await loadPreviousLogs(projectSlug)
    appendLog(`Subscribed to ${channel}`)
  } catch (err) {
    setStatus('Failed', 'status-fail')
    appendLog(`error: ${err.message}`)
  } finally {
    deployBtn.disabled = false
    deployBtn.textContent = 'Deploy'
  }
})

setDeployUrl('-')
