# Endless — generative ambient engine

An endless music player where nothing is pre-recorded. Every sound is synthesised
live in the browser with the Web Audio API, so the output never loops and never
repeats. Ships zero audio files.

**Live app:** `public/index.html` — one self-contained file, no build step, no
dependencies. Open it directly in a browser and it works.

## What's in the sound

| Layer | How it's made |
|---|---|
| Pad | 4 voices × 3 detuned oscillators, each through its own low-pass with a slow LFO sweep. Voices *glide* between chords rather than retriggering. |
| Choir | Sawtooth pairs through three parallel band-pass filters tuned to vowel formants, morphing vowel to vowel on each chord. Wordless by construction — it can't produce a word. |
| Sub | Sine at the chord root, one octave down, with a slow amplitude swell. |
| Texture | Looping pink-ish noise through a sweeping band-pass. |
| Bells | FM one-shots (carrier + one detuned partial) on a deliberately uneven scheduler, fed hard into reverb and delay. |
| Space | Convolution reverb using an impulse response generated in JS at load time, plus a damped feedback delay that also feeds the reverb. |
| Pulse | Optional pitch-dropping sine kick with a noise transient. Off by default. |
| Bass | Sawtooth + sub sine through a filter envelope, sequenced on an eighth-note grid shared with the kick so they can't drift apart. Takes its pitch from the current chord root. Almost no reverb send — bass in a long reverb is the fastest route to mud. |

Master chain: `bus → tone filter → volume → limiter → soft-clip → fade → analyser → out`.

> The volume/makeup gain **must** stay before the limiter. An earlier version had
> it after, which clipped at +1.5 dBFS with all layers maxed.

## Harmony

Chords move by **one or two scale steps at a time and no more** — 1 to 4 semitones of
root motion, weighted toward the smaller intervals. Successive chords therefore share
most of their tones, and the pad *glides* between them rather than retriggering, so
changes read as drift rather than as edits.

A soft tether (`DEGREE_TETHER`) pulls the walk back when it strays more than 5 degrees
from home; without it the walk slowly ratchets and the whole piece climbs or sinks.

## Controls

- **Randomize** (or the `R` key) rolls every parameter, plus root, scale and pulse.
  Ranges come from `RANDOM_BOUNDS`, deliberately narrower than the sliders — a
  uniform 0–1 roll on everything mostly lands on silence or mud.
- **Randomness** makes the patch rewrite itself as it plays: a shift every ~130 s
  at the low end down to ~8 s at the top, easing parameters toward new targets and
  occasionally jumping key, scale or register.
- Master volume is never touched by either. That's deliberate.

## Deploying

The `public/` folder is the entire deployable site.

**Netlify Drop** (no account needed): go to <https://app.netlify.com/drop> and drag
the `public` folder onto the page. You get an HTTPS URL in seconds. Open it on a
phone, then use Chrome's **⋮ → Add to Home screen** to install it as an app — it
runs full-screen and works with no signal.

Any other static host works the same way; there is nothing to build.

### Why it needs to be served over HTTPS for the full experience

Opening `index.html` from disk works fine, but service workers and installability
require a real origin. Over `file://` the app detects this and skips service worker
registration rather than throwing.

## Mobile notes

- Touch targets scale up under `@media (pointer: coarse)`.
- Screen Wake Lock keeps the display on while playing, released on pause.
- A silent looping `<audio>` element claims a media session, which is what puts
  play/pause on the lock screen and keeps the browser from throttling us hard.
  "Next track" rolls a new patch.
- Reverb drops from a 7.5 s impulse to 3.6 s on touch devices or ≤4 cores.
  Convolution is the most expensive node in the graph by a wide margin.
- Backgrounded tabs get their timers throttled, so scheduler lookahead jumps from
  1.5 s to 10 s when the page is hidden. The drone continues either way; this keeps
  the bells and chord changes coming too.

## Not built yet

- Trance/EDM mode: supersaw lead, 303-style acid line, builds and breakdowns, sidechain.
- Lo-fi mode: swung dusty drums, jazz voicings, tape wobble, vinyl noise. The one
  place a few CC0 samples would genuinely earn their keep.
- Preset save/load and URL-shareable state.
- A weighted/Markov walk for bell note choice (the chord walk is already stepwise).
- Audio export.

### Verifying rhythm

Do not measure rhythm off the rendered audio — an envelope follower with the wrong
smoothing window will happily report double tempo (5 ms smoothing on a 124 Hz bass
ripples straight through the threshold). Set `window.__ENDLESS_TRACE = true` and read
`__endless.TRACE` instead; it records the exact scheduled time, MIDI note and duration
of every kick and bass event.

## A licensing note, if samples ever get added

Most "free sample pack" sites license loops for *making music*, not for *shipping
the loops inside an app*. Looperman's terms explicitly forbid redistributing loops
"as is". Only CC0 / CC-BY sources qualify for bundling — Freesound filtered to CC0
is the practical one. This is a redistribution question, not a royalty question.
