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
    slug: 'sat-forge',
    title: 'SAT Forge',
    context: 'Personal',
    year: 2026,
    featured: true,
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
  {
    slug: 'druzy',
    title: 'Druzy',
    context: 'Personal',
    year: 2025,
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
    slug: 'mandate-intelligence-pipeline',
    title: 'Mandate Intelligence Pipeline',
    context: 'Freelance',
    year: 2025,
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
];
