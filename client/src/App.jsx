import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import Login from './pages/Login.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:9002'
const PROJECT_HOST = import.meta.env.VITE_PROJECT_BASE_DOMAIN || 'localhost:8000'
const PROJECT_PROTOCOL = import.meta.env.VITE_PROJECT_PROTOCOL || 'http'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('vercel-clone-auth') === 'true')
  const [theme, setTheme] = useState(() => localStorage.getItem('vercel-clone-theme') || 'dark')
  const [gitURL, setGitURL] = useState('')
  const [deploymentName, setDeploymentName] = useState('')
  const [slug, setSlug] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [logs, setLogs] = useState([])
  const [displayLogs, setDisplayLogs] = useState([])
  const [stage, setStage] = useState('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isDark = theme === 'dark'
  const logRef = useRef()
  const previewSlug = deploymentName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63)
    .replace(/^-|-$/g, '')

  const previewUrl = previewSlug ? `${PROJECT_PROTOCOL}://${previewSlug}.${PROJECT_HOST}/` : ''

  const page = isDark ? 'bg-[#090909] text-white' : 'bg-[#f6f7f4] text-[#111111]'
  const panel = isDark ? 'border-white/10 bg-[#11120f]' : 'border-black/10 bg-white'
  const input = isDark
    ? 'border-white/10 bg-black text-white placeholder:text-gray-600 focus:border-emerald-300'
    : 'border-black/10 bg-[#f3f4ef] text-black placeholder:text-gray-500 focus:border-emerald-600'
  const muted = isDark ? 'text-gray-400' : 'text-gray-600'

  const handleLogin = () => {
    localStorage.setItem('vercel-clone-auth', 'true')
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('vercel-clone-auth')
    setIsLoggedIn(false)
  }

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    localStorage.setItem('vercel-clone-theme', nextTheme)
    setTheme(nextTheme)
  }

  const deploy = async () => {
    setLogs([])
    setDisplayLogs([])
    setError('')
    setLoading(true)
    setStage('Initializing')

    try {
      const res = await fetch(`${API_URL}/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitURL, slug: previewSlug || undefined })
      })

      const data = await res.json()
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error || 'Deploy failed')
      }

      const projectSlug = data.data.projectSlug
      setSlug(projectSlug)
      setProjectUrl(data.data.url || `${PROJECT_PROTOCOL}://${projectSlug}.${PROJECT_HOST}/`)

      const socket = io(SOCKET_URL)

      socket.on('connect', () => {
        socket.emit('subscribe', `logs:${projectSlug}`)
      })

      socket.on('message', (msg) => {
        setLogs(prev => [...prev, msg])
      })
    } catch (err) {
      setError(err.message)
      setStage('Failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (logs.length === 0) return

    let i = displayLogs.length

    const interval = setInterval(() => {
      if (i < logs.length) {
        setDisplayLogs(prev => [...prev, logs[i]])
        i++
      } else {
        clearInterval(interval)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [logs])

  useEffect(() => {
    if (logs.some(l => l.includes('install'))) setStage('Installing Dependencies')
    if (logs.some(l => l.includes('building'))) setStage('Building Project')
    if (logs.some(l => l.includes('uploading'))) setStage('Uploading to S3')
    if (logs.some(l => l.includes('Done'))) setStage('Deployed')
  }, [logs])

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [displayLogs])

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <main className={`min-h-screen px-5 py-6 transition-colors ${page}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className={`rounded-lg border p-5 shadow-xl ${panel}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-500">Deployment Console</p>
              <h1 className="mt-1 text-4xl font-black">Vercel Clone+</h1>
              <p className={`mt-2 text-sm ${muted}`}>Build static projects and serve them from your wildcard domain.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleTheme}
                className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${isDark ? 'border-white/15 hover:border-emerald-300' : 'border-black/15 hover:border-emerald-600'}`}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={handleLogout}
                className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${isDark ? 'border-white/15 hover:border-rose-300' : 'border-black/15 hover:border-rose-500'}`}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className={`rounded-lg border p-5 shadow-xl ${panel}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-3xl font-black">Deploy a repository</h2>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>
                  Paste a GitHub repo, choose a deployment name, and start the build.
                </p>
              </div>
              <p className="w-fit rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-500">
                {stage === 'idle' ? 'Ready' : stage}
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              <input
                className={`w-full rounded-lg border px-4 py-4 outline-none transition ${input}`}
                placeholder="https://github.com/user/project"
                value={gitURL}
                onChange={(e) => setGitURL(e.target.value)}
              />

              <input
                className={`w-full rounded-lg border px-4 py-4 outline-none transition ${input}`}
                placeholder="Deployment name, for example my-portfolio"
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
              />

              <div className={`grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center ${isDark ? 'border-white/10 bg-black/60' : 'border-black/10 bg-[#f3f4ef]'}`}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.16em] ${muted}`}>Live URL</p>
                  <p className="mt-2 break-all text-sm font-bold text-emerald-500">
                    {previewUrl || 'Your live URL preview appears here.'}
                  </p>
                </div>
                <button
                  onClick={deploy}
                  disabled={loading}
                  className="rounded-lg bg-emerald-500 px-6 py-3 font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Deploying...' : 'Deploy'}
                </button>
              </div>

              {error && (
                <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  {error}
                </p>
              )}
            </div>
          </div>

          <aside className={`overflow-hidden rounded-lg border shadow-xl ${panel}`}>
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
              alt="Deployment dashboard on a laptop"
              className="h-72 w-full object-cover"
            />
            <div className="p-5">
              <p className="text-sm font-bold text-amber-500">Live preview</p>
              {slug ? (
                <>
                  <h2 className="mt-3 text-3xl font-black">{slug}</h2>
                  <p className={`mt-3 break-all text-sm ${muted}`}>{projectUrl}</p>
                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-bold text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
                  >
                    Open live site
                  </a>
                </>
              ) : (
                <p className={`mt-3 text-sm leading-6 ${muted}`}>
                  Your finished deployment link will appear here after the build starts.
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className={`rounded-lg border p-4 shadow-inner ${isDark ? 'border-green-400/20 bg-black' : 'border-emerald-700/20 bg-[#111111]'}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-green-300">Build logs</p>
            <p className="text-sm text-gray-500">{displayLogs.length} lines</p>
          </div>
          <div ref={logRef} className="h-[390px] overflow-auto font-mono text-sm">
            {displayLogs.length === 0 && (
              <p className="text-gray-600">Waiting for logs...</p>
            )}
            {displayLogs.map((log, i) => (
              <div key={`${log}-${i}`} className="text-green-400">
                {log}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
