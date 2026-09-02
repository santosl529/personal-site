// Project data. Add a project by pushing one object here — the card grid,
// the "everything else" list, and the modal all render from this array.
//
// media: video demos live at assets/projects/<slug>/demo.mp4 with a poster
// at assets/projects/<slug>/demo-poster.jpg. Example shape (commented out
// below) — uncomment and point at real files when a project has a clip.
//
// body: TODO stub only. Real writeup prose goes here by hand, as an HTML
// string (plain <p> tags are fine — it's rendered via innerHTML).

export const PROJECTS = [
  {
    slug: 'nomad-stop-detection-dashboard',
    title: 'NOMAD Stop Detection Dashboard',
    context: 'Research · Penn Watts Lab',
    year: 2026,
    featured: true,
    accent: 'var(--blue)',
    blurb: 'An interactive dashboard for comparing six GPS stop-detection algorithms, built for an NSF-funded mobility-science lab at Penn.',
    cover: 'assets/projects/nomad-stop-detection-dashboard/cover.svg',
    media: [],
    tags: ['Next.js 16', 'React 19', 'Python', 'GeoPandas', 'Mobility Science'],
    links: { live: null, repo: 'https://github.com/Watts-Lab/nomad-stop-detection-dashboard' },
    body: `
      <p>NOMAD is the NSF-funded mobility-research infrastructure built at Penn's Watts Lab: an
      open-source Python library for turning raw GPS pings into usable mobility science. Stop
      detection sits at the base of that pipeline — the step that decides which cluster of pings
      counts as a person actually stopping somewhere. Every downstream finding rests on it, and
      there are eight competing algorithms that quietly disagree with each other. Change one
      parameter and your conclusions move. This dashboard exists so researchers can see that
      happen instead of taking it on faith.</p>

      <p>The design constraint that shaped everything: GeoPandas and the NOMAD library cannot run
      in a browser. So nothing is computed live. A Python pipeline generates synthetic city
      trajectories with an agent-based model — which means the <em>ground truth is known</em> —
      then sweeps parameters across scenarios, runs all eight detectors against each one, and
      writes the results to a compact Parquet and JSON cache. The web app is a fast static reader
      over that cache. Knowing ground truth is what makes the tool teachable rather than merely
      illustrative: you can show where an algorithm is wrong, not just what it returned.</p>

      <p>I own the visualization and interaction layer — 66 of the repository's 168 commits, more
      than anyone else on the project. The core of it is a ~2,200-line ECharts compare panel that
      animates a trajectory forward in time against the ground-truth path, with side-by-side and
      stacked comparison modes for watching two algorithms diverge on identical input. Around it I
      built the zoomable timeline and ping selection, hover cues that expose the core points inside
      the density-based detectors, and an aggregated-metrics view whose plotted points are
      clickable — pick an outlier in a parameter sweep and it drops you into that exact scenario in
      the demo. I also wrote the guided product tour, rebuilt the cache-generation scripts, and
      added OSM street routing so the synthetic traces follow real roads.</p>

      <p>Working in the dashboard pushed changes back upstream. I have eleven commits in the
      <a href="https://github.com/Watts-Lab/nomad" target="_blank" rel="noopener">NOMAD library</a>
      itself, mostly simplifying what the stop-detection functions hand back — collapsing the
      cluster module, unifying the core and anchor point outputs across sequential and
      density-based methods, and cutting a config parameter that had stopped earning its place.
      Building the consumer is a good way to find out that an API is awkward.</p>
    `,
  },
  {
    slug: 'casetester',
    title: 'CaseTester',
    context: 'Personal',
    year: 2026,
    featured: true,
    accent: 'var(--tomato)',
    blurb: 'A voice-first AI case interviewer for consulting recruits, architected so the model can never surface a number it was not handed.',
    cover: 'assets/projects/casetester/cover.svg',
    media: [],
    tags: ['Claude Opus', 'Next.js', 'Drizzle', 'Supabase RLS', 'Vitest'],
    links: { live: null, repo: null },
    body: '<!-- TODO: Lorenzo — write the CaseTester case study. -->',
  },
  {
    slug: 'druzy',
    title: 'Druzy',
    context: 'Personal',
    year: 2026,
    featured: true,
    accent: 'var(--jade)',
    blurb: 'A habit and metrics tracker where you can generate custom trackers with AI and get analytics on anything you track.',
    cover: 'assets/projects/druzy/cover.svg',
    media: [],
    tags: ['React', 'Generative UI', 'AI', 'Supabase'],
    links: { live: 'https://druzy-xi.vercel.app/', repo: null },
    body: '<!-- TODO: Lorenzo — write the Druzy case study. -->',
  },
  {
    slug: 'centered',
    title: 'Centered',
    context: 'Personal',
    year: 2026,
    featured: true,
    accent: 'var(--brass)',
    blurb: 'An iOS trainer that scores sight reading and pitch centering together, running a hand-written YIN pitch detector on live mic input.',
    cover: 'assets/projects/centered/cover.svg',
    media: [],
    tags: ['Swift', 'SwiftUI', 'AVAudioEngine', 'vDSP', 'DSP'],
    links: { live: null, repo: null },
    body: '<!-- TODO: Lorenzo — write the Centered case study. -->',
  },
  {
    slug: 'mandate-intelligence-pipeline',
    title: 'Mandate Intelligence Pipeline',
    context: 'Freelance',
    year: 2026,
    featured: true,
    accent: 'var(--brass)',
    blurb: 'A five-stage mandate-intelligence pipeline for a capital markets firm: scrape, structure, and rank documents into usable signal.',
    cover: 'assets/projects/mandate-intelligence-pipeline/cover.svg',
    media: [],
    tags: ['Llama 3.3 70B', 'Groq', 'BeautifulSoup', 'pandas'],
    links: { live: null, repo: null },
    body: '<!-- TODO: Lorenzo — write the Mandate Intelligence Pipeline case study. -->',
  },
  {
    slug: 'parking-spot-detection',
    title: 'Parking-Spot Detection',
    context: 'Research · UDelaware CAR Lab',
    year: 2023,
    featured: true,
    accent: 'var(--tomato)',
    blurb: 'Real-time computer vision for parking occupancy — trained and deployed a lightweight YOLOv8n model on live camera feeds.',
    cover: 'assets/projects/parking-spot-detection/cover.svg',
    media: [],
    tags: ['YOLOv8n', 'PyTorch', 'OpenCV'],
    links: { live: null, repo: null },
    body: '<!-- TODO: Lorenzo — write the Parking-Spot Detection case study. -->',
  },
  {
    slug: 'sat-forge',
    title: 'SAT Forge',
    context: 'Personal',
    year: 2026,
    featured: false,
    accent: 'var(--blue)',
    blurb: 'An SAT-prep platform built around spaced-repetition solo practice, with 1v1 real-time matches coming soon.',
    cover: 'assets/projects/sat-forge/cover.svg',
    media: [
      // { type: 'video', src: 'assets/projects/sat-forge/demo.mp4', poster: 'assets/projects/sat-forge/demo-poster.jpg' },
    ],
    tags: ['Next.js 15', 'Supabase', 'Drizzle', 'Tailwind v4', 'KaTeX'],
    links: { live: 'https://sat-forge-livid.vercel.app/practice', repo: null },
    body: '<!-- TODO: Lorenzo — write the SAT Forge case study. -->',
  },
];
