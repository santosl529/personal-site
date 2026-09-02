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
    blurb: 'An interactive dashboard for comparing eight GPS stop-detection algorithms, built for an NSF-funded mobility-science lab at Penn.',
    cover: 'assets/projects/nomad-stop-detection-dashboard/cover.png',
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

      <p>I own the visualization and interaction layer, and the largest share of the dashboard's
      commit history. The core of it is a ~2,200-line ECharts compare panel that
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
    body: `
      <p>CaseTester is an AI interviewer for undergraduates recruiting into management consulting.
      It runs a McKinsey-style interviewer-led case: it talks, listens, releases data only when
      asked, pushes back on weak reasoning, and produces a rubric-scored feedback report at the
      end. The bar it has to clear is not "an LLM can roleplay an interviewer" — it obviously can.
      The bar is feedback good enough that a candidate would choose it over free ChatGPT. The
      rubric is the product.</p>

      <p>The hard problem is that a case interview is defined by information the candidate is not
      allowed to have yet. An LLM handed the full case will leak numbers early, and worse, will
      invent numbers that sound plausible — which quietly teaches candidates to do arithmetic on
      fiction. So the interviewer model never receives un-revealed values at all. It can surface a
      figure only by calling a gated reveal tool that the orchestrator validates against a data
      ledger, and after every turn a deterministic audit re-scans the model's output for any number
      outside the revealed set. That check runs in code, not in a second model call, because ground
      truth exists and there is no reason to ask an LLM to confirm it. The same pass enforces
      interviewer conduct — spoken-length turns, no markdown, one task at a time.</p>

      <p>Scoring is two passes over an eight-dimension rubric. A judge scores the transcript; a
      claim-verifier then re-checks the critical sections one claim at a time and drops the ones the
      transcript contradicts. That second pass exists for a specific failure I could not catch any
      other way: a deterministic evidence audit can verify a quote, but an omission claim — "the
      candidate never considered hedging" — contains no quote to check, and is exactly the kind of
      confident, unfalsifiable criticism that makes feedback feel authoritative while being wrong.
      Turn and scoring models both run Opus after pilot runs showed a smaller model missing live
      math errors; that was an evaluation result, not a preference.</p>

      <p>One structural rule governed the build: the entire text case ships before any voice code
      exists. The interviewer talks to the candidate through an abstract channel interface, and no
      voice library may appear in the dependency graph of the orchestrator, agent, or scoring
      layers — enforced as a lint error rather than a good intention, because architectural rules
      that live only in a document lose to deadlines. Voice is a wrapper, not a foundation.
      <strong>Still in progress:</strong> the text product runs end to end — session, turn loop,
      scoring, PDF report — behind 293 tests across 33 files. The voice layer is deliberately
      deferred, waiting behind its interface.</p>
    `,
  },
  {
    slug: 'druzy',
    title: 'Druzy',
    context: 'Personal',
    year: 2026,
    featured: true,
    accent: 'var(--jade)',
    blurb: 'A habit and metrics tracker where you can generate custom trackers with AI and get analytics on anything you track.',
    cover: 'assets/projects/druzy/cover.png',
    media: [],
    tags: ['React', 'Generative UI', 'AI', 'Supabase'],
    links: { live: 'https://druzy-xi.vercel.app/', repo: null },
    body: `
      <p>Druzy is a self-hostable tracker for logging and visualizing arbitrary parts of your life
      — sleep, mood, workouts, gratitude, whatever you decide matters. The defining idea is that you
      describe a tracker in plain language and an assistant turns it into a structured, chartable
      module. It is built for me and a handful of friends: tens of users, not thousands, which is a
      licence to optimize for clarity instead of scale.</p>

      <p>The AI layer is proposal-shaped rather than chat-shaped, and that is the design decision I
      care about most. The assistant has four tools — propose a tracker schema, propose a formula
      tracker whose daily value is computed from trackers you already keep, render a live chart from
      your real rows, and compute a statistic like a trend, correlation, or streak. None of them
      write to the database. Each returns a proposal that renders as a card you confirm or discard,
      with Zod schemas shared between the tool output and the DB-facing types, so a malformed model
      response fails at the boundary instead of halfway through a migration. An assistant that can
      silently restructure your data is a worse product than one that has to ask.</p>

      <p>Journal transcription forced a sharper privacy decision. Reading handwriting needs a vision
      model, so the obvious build sends photos of your journal to a cloud API — which is exactly the
      data you would least want to send. Instead it runs against a local Ollama model, and the
      request goes straight from the browser to localhost, never through the Next.js server, so the
      images and the transcribed text cannot leave the machine even though the app is deployed on
      Vercel. That is a structural guarantee rather than a promise in a privacy policy. Food-photo
      calorie estimation does use a cloud vision model — a different bargain for a different kind of
      picture, made deliberately rather than by default.</p>

      <p>The visual identity carries a real mechanic: each tracker is a geode that opens as you log,
      with openness derived from consistency over a trailing window and five discrete stages from
      Dormant to Bloomed. It is the largest thing here — around 17,000 lines over 123 commits, with
      row-level security on every user-owned table — and it is the one I actually use.</p>
    `,
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
    body: `
      <p>Centered is an iOS app that trains sight reading and intonation at the same time on a wind
      instrument. A note appears on a staff, you play it on your actual horn, and the app scores two
      things through the microphone: whether you played the right note, and how well centered it was
      in cents. The interaction model is lifted from Zetamac — a bounded run, one integer score,
      instant restart, no XP, no unlockables. The score exists to be beaten.</p>

      <p>The wedge is that existing microphone-based sight-reading trainers treat pitch as binary:
      right note or wrong note. None of them take intonation seriously, and most are built
      piano-first with transposing instruments bolted on afterward, which is backwards for the
      people most likely to need the drill. Centered inverts both — intonation is a scored dimension
      from the start, and correct handling of transposing instruments is assumed from the first line
      of code. The feature I have not found anywhere else is the per-note intonation profile:
      accumulated across sessions, it becomes a map of which written pitches you personally play
      sharp or flat on your specific instrument. Every wind player knows their horn has problem
      notes; almost none of them know their own tendencies quantitatively.</p>

      <p>The DSP is the point of the project, not an obstacle to route around, so the pitch detector
      is a hand-written YIN implementation on top of Accelerate rather than a library call. Real-time
      audio sets the hard constraint: no allocation and no locks on the render thread. The hand-off
      out of the audio callback is therefore a lock-free single-producer/single-consumer ring buffer
      — exactly one thread on each side is what makes plain acquire/release atomics sufficient. Those
      atomics come from a small C11 shim, because holding the deployment floor at iOS 17 rules out
      Swift's Synchronization module, which needs iOS 18. Before any Swift existed I validated the
      whole pitch pipeline offline in Python against recorded samples, so the app was never the place
      where I found out the algorithm was wrong.</p>

      <p><strong>Still in progress.</strong> Offline DSP validation, the audio spike, instrument
      configuration with staff rendering in SwiftUI's Canvas, and single-note mode are done and
      tested. Runs are bounded by lives rather than a clock — each note gives you a window to begin
      a qualifying hold, and missing it costs one. Stats are next; phrase and master modes are not
      built yet.</p>
    `,
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
    body: `
      <p>A technical assessment for a capital-markets firm, built as a five-stage pipeline: scrape,
      extract, classify, qualify, match. It ingests messy public web pages for investors and
      startups, structures them, sorts each entity into buy-side or sell-side, applies qualification
      filters, and ends with ranked buy-side matches for every qualified sell-side mandate.</p>

      <p>The extraction stage is where the judgment sits. Pages are fetched and stripped of nav,
      footer, script, and style before whitespace is collapsed and the text is capped — enough to
      answer the question, cheap enough to run across the whole set. That text goes to a
      Groq-hosted Llama 3.3 70B behind a fixed JSON schema: entity type, sector, geography, funding
      signal, stage, ticket size, a confidence score, and an evidence snippet. The deliberate choice
      is that the model is used as a robust parser and never as the scorer. Classification,
      qualification, and match ranking are ordinary code operating on structured fields, which keeps
      every decision inspectable and keeps hallucination confined to a stage whose output is
      schema-checked.</p>

      <p>Two things I would defend in review. Some sites simply cannot be scraped — JavaScript-heavy
      single-page apps and real bot protection — and there is no reliable general fix, so the honest
      answer is to scrape a wider set and drop the failures, with every request wrapped so a failure
      produces an error flag instead of killing the run. And each stage caches its output to disk,
      so re-running the notebook skips any API call whose result already exists. That made iteration
      nearly free, which is the difference between tuning the prompt properly and settling for the
      first thing that parsed.</p>
    `,
  },
  {
    slug: 'parking-spot-detection',
    title: 'Parking-Spot Detection',
    context: 'Research · UDelaware CAR Lab',
    year: 2024,
    featured: true,
    accent: 'var(--tomato)',
    blurb: 'A parking-slot finder that was never trained on parking slots — it detects cars with YOLOv8n and infers the open spaces from the gaps between them.',
    cover: 'assets/projects/parking-spot-detection/cover.jpg',
    media: [],
    tags: ['YOLOv8n', 'PyTorch', 'OpenCV', 'Roboflow'],
    links: { live: null, repo: null },
    body: `
      <p>A tool that finds the open slots in a parking lot from a photo or a video of it, built at
      the University of Delaware's CAR Lab. The part I like is what it does <em>not</em> do: it was
      never trained on parking spaces. The model is a single-class detector that only knows how to
      find cars. Every empty slot in the output is inferred geometrically from where the cars are
      not.</p>

      <p>The inference is deliberately simple. Sort the detected boxes left to right, take the mean
      car width, and treat any gap between two consecutive cars wider than that mean as an open
      slot, drawn as a line between the neighbours it sits between. A camera multiplier scales the
      threshold to account for viewing angle, since a lot photographed obliquely compresses the gaps.
      Doing it this way sidesteps the expensive part of the obvious approach — nobody has to hand-
      label parking bays, and the same model works on a lot it has never seen, because the thing it
      recognizes is cars rather than one particular painted layout.</p>

      <p>The failure mode that shaped the code is background traffic. A detector pointed at a lot
      also finds the cars in the next lot over and on the road behind it, and those are small in
      frame — small enough to drag the mean width down until every genuine gap clears the threshold
      and the whole image fills with phantom slots. The fix is a size filter that discards any box
      whose area falls below a fraction of the mean box area before any measuring happens. That
      threshold is a CLI flag rather than a constant, along with detection confidence and the camera
      multiplier, because the right values genuinely depend on where the camera is standing.</p>

      <p>The detector is a YOLOv8n fine-tuned for 100 epochs at 640px on a single-class car dataset
      from Roboflow — the smallest model in the family, chosen because the geometry does the real
      work and the detector only has to be reliable, not clever. The video path runs the same
      pipeline per frame and reassembles the annotated frames into an MP4. Worth stating plainly:
      the geometry assumes a roughly side-on view of a single row of cars. An overhead shot of a
      multi-row lot breaks the left-to-right ordering the whole method rests on, and would need a
      different approach rather than a tuned constant.</p>
    `,
  },
];
