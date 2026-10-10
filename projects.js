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
    blurb: 'An interactive dashboard for comparing eight GPS stop-detection algorithms, built for an NSF-funded mobility research lab at Penn.',
    cover: 'assets/projects/nomad-stop-detection-dashboard/cover.png',
    media: [
      { type: 'video',
        src: 'assets/projects/nomad-stop-detection-dashboard/demo.mp4',
        poster: 'assets/projects/nomad-stop-detection-dashboard/demo-poster.jpg' },
    ],
    tags: ['Next.js 16', 'React 19', 'Python', 'GeoPandas', 'Mobility Science'],
    links: { live: null, repo: 'https://github.com/Watts-Lab/nomad-stop-detection-dashboard' },
    body: `
      <p>NOMAD is an NSF-funded, open-source Python library from Penn's Watts Lab for turning raw
      GPS pings into data that researchers can use for mobility science. One of the first steps in
      that pipeline is stop detection, which decides which clusters of pings count as a person
      actually stopping somewhere. Everything after that depends on it, and there are eight
      different algorithms for it that often disagree with each other. Changing a single parameter
      can change your results. The dashboard lets researchers see those differences for
      themselves.</p>

      <p>The biggest constraint was that GeoPandas and the NOMAD library can't run in a browser, so
      nothing in the dashboard is computed live. Instead, a Python pipeline generates synthetic city
      trajectories with an agent-based model. Because the trajectories are synthetic, we know the
      <em>ground truth</em> (where each agent actually stopped). The pipeline then sweeps parameters
      across different scenarios, runs all eight detectors on each one, and saves the results to a
      compact Parquet and JSON cache. The web app just reads from that cache, which keeps it fast.
      Having the ground truth is what makes the tool useful for teaching, since you can see exactly
      where an algorithm got something wrong.</p>

      <p>I own the visualization and interaction layer, and I have the largest share of commits in
      the dashboard's history. The main piece is a ~2,200-line ECharts compare panel that animates a
      trajectory over time against the ground-truth path. It has side-by-side and stacked modes so
      you can watch two algorithms diverge on the same input. Around that, I built the zoomable
      timeline and ping selection, hover cues that show the core points inside the density-based
      detectors, and an aggregated metrics view where every plotted point is clickable. If you click
      an outlier in a parameter sweep, it takes you straight to that scenario in the demo. I also
      wrote the guided product tour, rebuilt the cache generation scripts, and added OSM street
      routing so the synthetic trajectories follow real roads.</p>

      <p>Working on the dashboard also led me to make changes in the
      <a href="https://github.com/Watts-Lab/nomad" target="_blank" rel="noopener">NOMAD library</a>
      itself, where I have eleven commits. Most of them simplify what the stop-detection functions
      return. I collapsed the cluster module, made the core and anchor point outputs consistent
      across the sequential and density-based methods, and removed a config parameter that wasn't
      needed anymore. Since the dashboard used these functions directly, I ran into the awkward
      parts of the API pretty quickly.</p>
    `,
  },
  {
    slug: 'casetester',
    title: 'CaseTester',
    context: 'Personal',
    year: 2026,
    featured: true,
    accent: 'var(--jade)',
    blurb: 'A voice-first AI case interviewer for students recruiting for consulting, built so the model can only bring up numbers it was actually given.',
    cover: 'assets/projects/casetester/cover.svg',
    media: [],
    tags: ['Claude Opus', 'Next.js', 'Drizzle', 'Supabase RLS', 'Vitest'],
    links: { live: null, repo: null },
    body: `
      <p>CaseTester is an AI interviewer for undergrads recruiting for management consulting. It runs
      a McKinsey-style, interviewer-led case: it talks, listens, gives out data only when the
      candidate asks for it, pushes back on weak reasoning, and writes a rubric-scored feedback
      report at the end. Getting an LLM to roleplay an interviewer is easy. The hard part is making
      the feedback good enough that a candidate would pick it over just using ChatGPT for free, so
      the rubric is the most important part of the project.</p>

      <p>The tricky thing about a case interview is that it depends on information the candidate
      isn't supposed to have yet. If you give an LLM the full case, it will leak numbers too early.
      Worse, it will make up numbers that sound believable, so candidates end up practicing math on
      fake data. To prevent this, the interviewer model never sees any values that haven't been
      revealed yet. The only way it can bring up a number is by calling a reveal tool, and the
      orchestrator checks each call against a data ledger. After every turn, a deterministic audit
      also scans the model's output for any number outside the revealed set. I wrote that check in
      code instead of using a second model call, because we already know which numbers are allowed
      and there's no reason to ask an LLM. The same pass also makes sure the interviewer acts like a
      real one (turns short enough to say out loud, no markdown, one task at a time).</p>

      <p>Scoring takes two passes over an eight-dimension rubric. First, a judge model scores the
      transcript. Then a claim verifier goes back through the critical sections one claim at a time
      and drops any claim the transcript contradicts. I added the second pass because of a problem I
      couldn't catch any other way. A deterministic audit can check that a quote actually appears in
      the transcript, but a claim about something the candidate didn't do (like "the candidate never
      considered hedging") has no quote to check. Those are exactly the kinds of confident
      criticisms that sound authoritative even when they're wrong. Both the interviewer and the
      scoring run on Opus, because in pilot runs a smaller model kept missing math errors as they
      happened.</p>

      <p>I followed one main rule while building it: the full text version had to work before I
      wrote any voice code. The interviewer talks to the candidate through an abstract channel
      interface, and no voice library is allowed in the dependency graph of the orchestrator, agent,
      or scoring layers. I enforced that with a lint rule, since a rule that only exists in a design
      doc is easy to break when you're trying to ship something. That way voice can be added later
      as a layer on top. <strong>Still in progress:</strong> the text version works end to end
      (session, turn loop, scoring, and PDF report) with 293 tests across 33 files. The voice layer
      is planned but not built yet.</p>
    `,
  },
  {
    slug: 'druzy',
    title: 'Druzy',
    context: 'Personal',
    year: 2026,
    featured: true,
    accent: 'var(--jade)',
    blurb: 'A habit and metrics tracker where you can create custom trackers with AI and get analytics on anything you track.',
    cover: 'assets/projects/druzy/cover.png',
    media: [
      { type: 'video',
        src: 'assets/projects/druzy/demo.mp4',
        poster: 'assets/projects/druzy/demo-poster.jpg' },
    ],
    tags: ['React', 'Generative UI', 'AI', 'Supabase'],
    links: { live: 'https://druzy-xi.vercel.app/', repo: null },
    body: `
      <p>Druzy is a self-hostable tracker for logging and visualizing whatever parts of your life you
      want to keep track of (sleep, mood, workouts, gratitude, etc). The main idea is that you
      describe a tracker in plain language and an AI assistant turns it into a structured module you
      can chart. I built it for myself and a few friends, so it only has tens of users. That let me
      focus on keeping it simple and clear without worrying about scale.</p>

      <p>The design decision I care about most is that the AI suggests changes and you approve them.
      The assistant has four tools: propose a tracker schema, propose a formula tracker whose daily
      value is calculated from trackers you already have, render a live chart from your real data,
      and compute a statistic like a trend, correlation, or streak. None of these tools write to the
      database. Each one returns a proposal that shows up as a card you can confirm or discard. The
      tool outputs and the database types share the same Zod schemas, so if the model returns
      something malformed, it gets caught right away before anything is written. I didn't want an
      assistant that could change your data without asking you first.</p>

      <p>Journal transcription made me think harder about privacy. Reading handwriting requires a
      vision model, and the easy way to build it would be to send photos of your journal to a cloud
      API. But journal pages are probably the last thing you'd want to send to someone else's server.
      So transcription runs on a local Ollama model, and the request goes straight from the browser
      to localhost without passing through the Next.js server. Even though the app is deployed on
      Vercel, the images and the transcribed text never leave your computer. Food photo calorie
      estimation does use a cloud vision model, but I was much more comfortable with that tradeoff
      for pictures of food.</p>

      <p>For the visual design, each tracker is a geode that opens up as you log. How open it is
      depends on how consistent you've been over a recent window, and there are five stages from
      Dormant to Bloomed. Druzy is the biggest project here, at around 17,000 lines over 123 commits,
      with row-level security on every table that holds user data. It's also the project I actually
      use myself.</p>
    `,
  },
  {
    slug: 'centered',
    title: 'Centered',
    context: 'Personal',
    year: 2026,
    featured: true,
    accent: 'var(--jade)',
    blurb: 'An iOS trainer that scores sight reading and pitch centering together, using a YIN pitch detector I wrote by hand that runs on live mic input.',
    cover: 'assets/projects/centered/cover.svg',
    media: [],
    tags: ['Swift', 'SwiftUI', 'AVAudioEngine', 'vDSP', 'DSP'],
    links: { live: null, repo: null },
    body: `
      <p>Centered is an iOS app for practicing sight reading and intonation at the same time on a
      wind instrument. A note shows up on a staff, you play it on your actual instrument, and the app
      uses the microphone to score two things: whether you played the right note, and how well
      centered it was in cents. I based the format on Zetamac (the mental math game). Each run has a
      limit, you get one score at the end, and you can restart instantly. There's no XP or
      unlockables, just a score to beat.</p>

      <p>Existing sight-reading apps that use the microphone mostly just check whether you played the
      right note. None of them really score intonation, and most are built for piano first with
      transposing instruments added later, even though wind players are the ones who need this kind
      of practice the most. In Centered, intonation is scored from the start, and transposing
      instruments were handled correctly from the first line of code. The feature I haven't seen
      anywhere else is the per-note intonation profile. Over many sessions, it builds a map of which
      written notes you tend to play sharp or flat on your specific instrument. Every wind player
      knows their instrument has a few problem notes, but almost nobody has actual numbers on their
      own tendencies.</p>

      <p>Writing the DSP myself was one of the main reasons I wanted to build this, so the pitch
      detector is my own YIN implementation built on Apple's Accelerate framework. Real-time audio
      comes with a strict rule: no memory allocation and no locks on the audio render thread. To get
      pitch data out of the audio callback, I used a lock-free ring buffer with a single producer and
      a single consumer. Since there's exactly one thread on each side, simple acquire/release
      atomics are enough. Those atomics come from a small C11 shim, because I wanted to keep
      supporting iOS 17, and Swift's Synchronization module requires iOS 18. Before writing any
      Swift, I tested the whole pitch detection pipeline offline in Python on recorded samples, so I
      knew the algorithm worked before putting it in the app.</p>

      <p><strong>Still in progress.</strong> The offline DSP testing, the audio prototype, instrument
      setup with staff rendering in SwiftUI's Canvas, and single-note mode are all done and tested.
      Runs are limited by lives instead of a timer. Each note gives you a window to start playing it,
      and if you miss the window, you lose a life. Stats are next, and phrase and master modes
      haven't been built yet.</p>
    `,
  },
  {
    slug: 'mandate-intelligence-pipeline',
    title: 'Mandate Intelligence Pipeline',
    context: 'Freelance',
    year: 2026,
    featured: true,
    accent: 'var(--brass)',
    blurb: 'A five-stage pipeline for a capital markets firm that scrapes investor and startup websites, structures what it finds, and ranks matches.',
    cover: 'assets/projects/mandate-intelligence-pipeline/cover.svg',
    media: [],
    tags: ['Llama 3.3 70B', 'Groq', 'BeautifulSoup', 'pandas'],
    links: { live: null, repo: null },
    body: `
      <p>I built this as a technical assessment for a capital markets firm. It's a five-stage
      pipeline: scrape, extract, classify, qualify, and match. It takes messy public web pages for
      investors and startups, pulls structured data out of them, sorts each one into buy-side or
      sell-side, filters out anything that doesn't qualify, and ends with a ranked list of buy-side
      matches for every qualified sell-side mandate.</p>

      <p>Most of the important decisions were in the extraction stage. Each page gets fetched, and I
      strip out the nav, footer, scripts, and styles, collapse the whitespace, and cap the length of
      the text. That leaves enough to answer the question while keeping it cheap to run on every
      page. The text then goes to Llama 3.3 70B (hosted on Groq) with a fixed JSON schema: entity
      type, sector, geography, funding signal, stage, ticket size, a confidence score, and a snippet
      of evidence. I only used the model to parse pages into that schema. Classification,
      qualification, and ranking are all regular code working on the structured fields. That way
      every decision can be inspected, and any hallucinations are limited to one stage whose output
      gets checked against the schema.</p>

      <p>There were two other choices I'd stand behind. First, some sites just can't be scraped, like
      JavaScript-heavy single-page apps or sites with real bot protection. There isn't a reliable
      general fix for that, so I scraped a larger set of sites and dropped the ones that failed.
      Every request is wrapped, so if one fails, it just gets flagged with an error and the rest of
      the run keeps going. Second, each stage caches its output to disk, so rerunning the notebook
      skips any API call that already has a saved result. That made iterating almost free, which
      meant I could actually spend time tuning the prompt instead of settling for the first version
      that worked.</p>
    `,
  },
  {
    slug: 'parking-spot-detection',
    title: 'Parking-Spot Detection',
    context: 'Research · UDelaware CAR Lab',
    year: 2024,
    featured: true,
    accent: 'var(--blue)',
    blurb: 'Finds open parking spots by detecting cars with YOLOv8n and measuring the gaps between them, so it never needs to see a painted line.',
    cover: 'assets/projects/parking-spot-detection/cover.jpg',
    media: [
      { type: 'video',
        src: 'assets/projects/parking-spot-detection/demo.mp4',
        poster: 'assets/projects/parking-spot-detection/demo-poster.jpg' },
    ],
    tags: ['YOLOv8n', 'PyTorch', 'OpenCV', 'Roboflow'],
    links: { live: null, repo: null },
    body: `
      <p>I built this during the month I spent at the University of Delaware's Connected and
      Autonomous Research (CAR) Lab. I got the position after cold emailing a bunch of professors,
      and since I came in with no autonomous vehicle experience, I audited AV classes while working
      on it. The goal was to find open parking spots from a photo or video of a lot, so an
      autonomous vehicle could park without relying on painted lines.</p>

      <p>My first plan was to detect the parking lines themselves. But line detection turned out to
      be really unreliable. Lines vary in size, shape, and color, a lot of them are faded or haven't
      been repainted in years, and there wasn't much data to train on. So I flipped the problem
      around. Instead of detecting the spots, I detected the cars and worked out where the spots were
      from the gaps between them. That meant I could train on the many car datasets that already
      existed, and the same model would work on lots it had never seen.</p>

      <p>The algorithm itself is pretty simple. I sort the detected cars left to right, take the
      average car width, and mark any gap wider than that average as an open spot. A camera
      multiplier adjusts the threshold for viewing angle, since a lot photographed from the side
      makes the gaps look smaller.</p>

      <p>The biggest problem I ran into was background traffic. The detector also picked up cars in
      the next lot over or on the road behind it. Since those cars were small in the frame, they
      dragged the average width down until almost every gap looked like an open spot. To fix this, I
      added a size filter that throws out any box much smaller than the average before measuring
      anything. I made that threshold a command-line flag (along with detection confidence and the
      camera multiplier) because the right values really depend on where the camera is.</p>

      <p>For the detector, I fine-tuned YOLOv8n for 100 epochs at 640px on a single-class car dataset
      from Roboflow. I went with the smallest model in the YOLOv8 family because all it had to do was
      find cars reliably. Videos run through the same pipeline frame by frame and get stitched back
      into an MP4. The main limitation is that the method assumes a roughly side-on view of a single
      row of cars. An overhead shot of a multi-row lot breaks the left-to-right ordering, so that
      case would need a different approach.</p>
    `,
  },
];
