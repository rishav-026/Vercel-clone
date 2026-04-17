import { useEffect, useState } from 'react'

const loginImage =
  'https://i.pinimg.com/736x/3f/24/76/3f2476ff11282686fe89431201a3ae7e.jpg'

const dashboardImage =
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80'

const featureCards = [
  {
    title: 'Deploy from GitHub',
    body: 'Paste a repo URL, choose a name, and start a production build.'
  },
  {
    title: 'Live project links',
    body: 'Every successful build gets a clean URL on your wildcard domain.'
  },
  {
    title: 'Build logs included',
    body: 'Watch the deployment move through install, build, upload, and done.'
  }
]

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }

    setError('')
    onLogin()
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <section className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[380px] overflow-hidden lg:min-h-screen">
          <img
            src={loginImage}
            alt="Abstract digital lights"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute left-6 right-6 top-6 flex items-center justify-between md:left-10 md:right-10">
            <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-black/40 px-4 py-3 backdrop-blur">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400 font-black text-black">
                R
              </div>
              <div>
                <p className="text-sm font-black">Rishav Deploy</p>
                <p className="text-xs text-gray-300">Vercel clone dashboard</p>
              </div>
            </div>
            <p className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100 backdrop-blur">
              Online
            </p>
          </div>
          <div className="absolute bottom-8 left-6 right-6 max-w-xl md:left-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-200">
              Deploy platform
            </p>
            <h1 className="mt-4 text-5xl font-black leading-none md:text-6xl">
              Your private deploy room.
            </h1>
            <p className="mt-5 text-base leading-7 text-gray-200">
              Build static projects, upload them to S3, and open them on clean live URLs.
            </p>
          </div>
        </div>

        <div className="flex min-h-screen items-start justify-center px-5 pb-10 pt-20 lg:pt-28">
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="w-full max-w-md rounded-lg border border-white/10 bg-[#11120f] p-7 shadow-2xl"
          >
            <p className="text-sm font-black text-emerald-300">Welcome back</p>
            <h2 className="mt-3 text-4xl font-black">Login</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Enter your details to open the deployment console.
            </p>

            <label className="mt-7 grid gap-2 text-sm font-bold text-gray-300">
              Email
              <input
                type="email"
                name="rishav_deploy_email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@rishavdeploy.dev"
                className="rounded-lg border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-300"
              />
            </label>

            <label className="mt-5 grid gap-2 text-sm font-bold text-gray-300">
              Password
              <input
                type="password"
                name="rishav_deploy_password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="rounded-lg border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-300"
              />
            </label>

            {error && (
              <p className="mt-4 rounded-lg border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-7 w-full rounded-lg bg-emerald-500 px-4 py-4 font-black text-white transition hover:bg-emerald-400"
            >
              Login
            </button>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-bold text-amber-200">Demo login</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Any filled email and password opens the project for now.
              </p>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <img
            src={dashboardImage}
            alt="Team reviewing a deployment dashboard"
            className="h-80 w-full rounded-lg object-cover shadow-2xl"
          />
          <div>
            <p className="text-sm font-black text-emerald-300">About the project</p>
            <h2 className="mt-2 text-4xl font-black">A focused deployment dashboard</h2>
            <p className="mt-4 text-base leading-7 text-gray-400">
              This project accepts GitHub repositories, builds them in the cloud, uploads static output to S3, and serves each deployment from a live wildcard URL.
            </p>
            <p className="mt-4 text-base leading-7 text-gray-400">
              It is built to feel simple: enter a repo, pick a name, watch logs, and open the finished site.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => (
            <article key={card.title} className="rounded-lg border border-white/10 bg-[#11120f] p-6 shadow-xl">
              <h3 className="text-xl font-black">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-[#11120f] p-5">
            <h3 className="text-xl font-black">For your projects</h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Use it to deploy portfolios, demos, experiments, and static React apps.
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-[#11120f] p-5">
            <h3 className="text-xl font-black">For other users</h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Give users the dashboard link and let them deploy with their own project name.
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-[#11120f] p-5">
            <h3 className="text-xl font-black">Next upgrade</h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Add real authentication, user projects, rate limits, and deployment history.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default Login
