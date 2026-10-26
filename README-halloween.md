# Free the Milkaboo Cup (Halloween game)

A ghost has wrapped itself around a Milkaboo cup. The player sucks air in near the phone's microphone to peel it off. If they free the cup within 25 seconds, the server issues a one-time `BOO-XXXXX` code for a free cup, redeemable at the counter.

The game lives at **`/halloween`** inside the Milkaboo site. It has its own full-screen layout (`app/(game)/`), so the site's header and smooth scrolling don't load on that page.

## Setup

```bash
npm install
cp .env.example .env.local     # fill in GAME_SECRET and ADMIN_REDEEM_TOKEN
npm run dev                    # http://localhost:3000/halloween   (desktop: localhost counts as secure)
npm run dev:https              # https://<your-LAN-IP>:3000/halloween   (to test on a real phone)
```

Browsers only allow the microphone on **https** pages (or `localhost`). To test on a phone over wifi, use `npm run dev:https`. It makes a self-signed certificate, so accept the browser warning on the phone. Production must be served over https.

### Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `GAME_SECRET` | production | HMAC key for round tokens. At least 32 random characters. Without it, production refuses to start rounds. |
| `ADMIN_REDEEM_TOKEN` | to redeem | Bearer token for `/api/admin/redeem`. At least 16 characters. |
| `GAME_UNLIMITED_ATTEMPTS` | no | `true` skips the 3-tries-a-day limit. Ignored in production. |

## How it fits together

```
app/(game)/halloween/page.tsx     page shell (metadata, safe-area viewport)
app/(game)/layout.tsx, game.css   full-screen layout, game fonts and colour tokens
components/ui/Game.tsx            screen flow: intro → permission → calibrating → playing → won | lost
components/ui/*                   screens, HUD, mute button, ?debug panel, custom SVG icons
components/three/Scene.tsx        canvas, Director (per-frame shared uniforms), camera, lights, bloom
components/three/Ghost.tsx        the ghost: her portrait draped over the front of the cup (shader in ghostMaterial.ts)
components/three/Cup.tsx          real .glb or PlaceholderCup.tsx (built from the product photo); both get the "cursed" shader
components/three/Atmosphere.tsx   painted backdrop (the cup stands on its ground), lightning, cup shadow, fog, mist, fireflies, bats
components/three/Reveal.tsx       the win: flash, warm halo, sparkles
hooks/useBreathDetector.ts        mic → { rms, flatness, isSucking, calibrate() }
hooks/useGameLoop.ts              per-frame round loop (mic → engine → 3D, HUD at 10 Hz)
lib/gameConfig.ts                 ★ every tunable number
lib/gameEngine.ts                 pure round rules (progress, fight-backs, sampling)
lib/validateRound.ts              server-side replay of a round record (shared with the engine's rules)
lib/reveal.ts                     progress → where the ghost still covers the cup
lib/copy.ts                       every player-facing line
app/api/game/{status,start,claim} and app/api/admin/redeem
lib/server/*                      HMAC tokens, request helpers, storage interface
```

**One number drives the visuals.** The ghost and every cup material share a GLSL function, `ghostCover()` in `curse.ts`, that answers "is this point still covered?" for the current progress. The cup is haunted (pale and milky, with her pink glow swirling through it and a stuttering light) wherever it returns "covered", switches to its real colours wherever it returns "free", and a glowing pink seam (red while she fights back) runs along the border. The stages match the brief: 0–30% the ghost only stretches toward the player, 30–70% it peels from the top (straw and lid come free), 70–99% only the logo is still haunted, and at 100% it's sucked into the camera.

**The look.** The ghost is the pink rose ghost from `public/images/halloween/Mischievous Pink Rose Ghost.png` (position and size in `gameConfig.ghostSprite`). Her portrait is draped over the front of the cup, her head above the lid, on a subdivided plane whose vertex shader animates it: her tail wisps drift, she bobs, tilts her head, twitches, lunges at the player, stretches toward them as they suck, rises off the cup as it peels, shudders and flushes red when she fights back, bounces with laughter when you lose, and spins into the camera at the win. Behind it: the painted cemetery `public/images/halloween/Moonlit Gothic Cemetery Gate.png` (`gameConfig.backdrop`), always filling the screen without extra zoom, slid so its painted ground (`backdrop.ground`) is as close as possible under the cup, and lighting up with the lightning. Lightning strikes every 7–17 s (a bolt across the sky, the backdrop and ghost flare, the camera jolts, and a swarm of bats bursts across the screen). In front of the painting: the cup's shadow, two looping flocks of bats, fog, ground mist and fireflies. Film grain and a heavy vignette finish it. There is no thunder sound on purpose: the mic would hear a noisy rumble as breath.

**No React renders during play.** The game loop writes plain numbers into a ref (`SceneState`). The 3D scene reads them in `useFrame`. Only the HUD re-renders, about 10 times a second.

## Microphone detection

`useBreathDetector` opens the mic with echo cancellation, noise suppression and auto gain all **off**, so the browser doesn't filter out air noise. It creates the `AudioContext` inside the Start tap (required on iOS). Every frame it reads an `AnalyserNode` (fftSize 2048) and computes:

- **RMS loudness** from the waveform
- **Spectral flatness** between 200 Hz and 6 kHz. Breath and air are noise-like (high flatness); voice, shouting and whistling are tonal (low flatness).

A frame counts as sucking only when **RMS ≥ threshold and flatness ≥ `minFlatness`**, held for `attackMs`. Before each round the mic listens to the room for 2 s during the 3-2-1 countdown and sets `threshold = clamp(roomNoise × thresholdFactor, minThreshold, maxThreshold)`.

A microphone can't tell sucking from blowing, so **both work**. The copy says "suck" for the theme.

The mic runs without echo cancellation, so it can hear the game's own sounds. Keep game audio quiet (`gameConfig.sound`). The suction sound is deliberately a **tonal** bubble slurp, not a noise whoosh, because a noise-like sound would register as breath and could keep the cup peeling by itself. If you replace `public/sounds/slurp.wav`, keep it tonal. The ambient loop plays during calibration, so it's counted as room noise.

## Tuning difficulty on real phones

Open **`/halloween?debug`**. A panel shows live `rms`, `flatness`, `threshold` and `isSucking`, with green or red for each check. On a computer, **hold Space** to simulate sucking. Without a mic, `?debug` falls back to Space-only input.

1. **Quiet room, phone in hand.** Note `rms` and `flatness` at rest.
2. **Suck hard, 2–3 cm from the mic.** `flatness` should be well above `minFlatness` and `rms` well above `threshold`.
3. **Shout, sing and whistle.** `isSucking` must stay false. If shouting gets through, raise `mic.minFlatness`. If real breath fails, lower it.
4. Test on at least one iPhone and one mid-range Android. Their mics differ a lot.

All values are in `lib/gameConfig.ts`:

| Knob | Effect |
| --- | --- |
| `mic.thresholdFactor`, `mic.minThreshold` | **The main difficulty knob.** How loud a breath must be compared with the room. |
| `round.fillSeconds`, `round.drainPerSec`, `round.timeLimit` | How long the pull takes, how fast the ghost wraps back, total time. |
| `fightBack.*` | How often and how hard the ghost fights back (threshold ×1.7, drain ×2.2 for 1.4 s). |
| `round.maxBoost`, `round.boostSlope` | How much stronger suction speeds things up (capped at 1.5×). |
| `limits.*` | Tries per day, prizes per email/device, daily prize budget (50), time zone for "today". |

**Measure the win rate before launch.** A simulation of the engine (players with a steady breath, short pauses to breathe) shows the game is a cliff, not a slope:

| Player's suction vs. threshold | Win rate |
| --- | --- |
| below 1.2× | 0% |
| 1.3× | ~17% |
| 1.5× | ~75% |
| 1.7× and up | 100% (strong enough to beat every fight-back) |

So the real-world win rate depends almost entirely on how loud an ordinary player's breath is compared with `threshold`, and that can only be measured on real phones. To reach about 1 in 10, have 10–20 people play with `?debug`, write down their typical `rms ÷ threshold` while sucking, and raise `thresholdFactor` until only the strongest tenth reach about 1.5×. The daily prize budget stops payouts if the estimate is wrong.

## Prize flow and anti-cheat

The browser never decides a win. It only shows the animation.

1. `POST /api/game/start { fingerprint }` uses up a try (3 per device per day, plus a loose per-IP backup limit) and returns an HMAC-signed token containing the start time, a one-time nonce and the device fingerprint.
2. During play the client records progress every 250 ms.
3. `POST /api/game/claim { token, email, fingerprint, record }`. The server checks:
   - the signature, expiry (15 min) and that the fingerprint matches the token
   - **timing:** by the server's own clock, at least the countdown plus the fastest possible round; and the record can't be longer than the time since the token was issued
   - **physics:** the record is replayed. Duration is between `fillSeconds ÷ maxBoost` and `timeLimit + 3 s`, sample count matches duration, progress never rises faster than full suction allows, and it ends at 100%.
   - 1 prize per email (campaign), 1 per device per day, then the one-time nonce is burned and the daily budget checked
   - then a `BOO-XXXXX` code is stored (unredeemed, valid 7 days). Codes avoid 0/O/1/I/L so they're easy to read aloud.
4. Staff check codes with `GET /api/admin/redeem?code=BOO-XXXXX` and redeem with **`POST`** to the same URL, both with `Authorization: Bearer $ADMIN_REDEEM_TOKEN`. Redeeming is a POST so link previews or prefetching can't use up a code.

```bash
curl -H "Authorization: Bearer $ADMIN_REDEEM_TOKEN" "https://<site>/api/admin/redeem?code=BOO-7KQ2M"
curl -X POST -H "Authorization: Bearer $ADMIN_REDEEM_TOKEN" "https://<site>/api/admin/redeem?code=BOO-7KQ2M"
```

These checks stop casual cheating. A determined attacker who reads the client code could still fake a believable record, as with any client-side game. The per-email, per-device and daily-budget limits are what cap the real cost.

### Storage: in memory for now

`lib/server/store.ts` defines a `GameStore` interface with an in-memory implementation. That's fine for local development and a demo, but **it resets on every deploy or restart, and doesn't work across multiple serverless instances.** Before going live, implement `GameStore` with a real database (Postgres/Prisma, Supabase or Upstash Redis) and return it from `getStore()`. Make `increment`, `useNonce` and `takePrize` atomic. Nothing else needs to change.

## The placeholder cup

`PlaceholderCup.tsx` is built from the product photo: a tall tapered clear cup (height/width ≈ 2.1), taro-purple tea filled nearly to the top, boba pearls piled at the bottom and pressed against the walls so they show through as dark circles, condensation (a procedural droplet bump map and roughness map), a flat clear lid with a raised ring and the logo printed on it, and the logo on the front. Dimensions are in `cupShape.ts`, colours in `gameConfig.colors`.

## Swapping in the real cup model

The game uses `public/images/halloween/MilkaBoo_Cup.glb` (`cup.modelUrl`, `useModel: true`). It is 12 MB, which is slow on mobile data; compressing it (Draco/Meshopt, ideally under 1.5 MB) would make the game start much sooner. To swap in another model:

1. Export the cup as **glTF binary**, ideally under 1.5 MB (Draco/Meshopt compression and 1–2K textures), and point `cup.modelUrl` at it.
2. In `lib/gameConfig.ts` → `cup`, keep `useModel: true`. The model is scaled to `cup.height` and stood on `cup.bottom` automatically. Use `modelRotationY` to turn its logo toward the camera.
3. Set `logoAngle`, `logoY`, `logoHalfWidth` and `logoHalfHeight` to where the logo sits on the model. The last haunted patch is placed from these values. Open `?debug`, hold Space to about 80%, and check that the patch covers the logo.
4. Name the logo's material something containing `logo` to get the glint that sweeps across it in the win reveal.
5. Move the ghost with `gameConfig.ghostSprite` (`faceAboveLid`, `depth`, `size`) if the new cup is a different shape.

Every material in the model automatically gets the cursed/free colour shader.

## Performance

- Device tiers: `low` (4 cores or fewer, or 3 GB RAM or less) gets no post-processing, no glass transmission, fewer bats and sparkles, and 1× resolution. `mid` (phones) gets bloom at up to 1.5× resolution. `high` gets 4× MSAA and up to 2× resolution. drei's `PerformanceMonitor` steps down a tier at runtime if frame rate drops.
- Everything is low-poly: one instanced mesh for the bats and one for the pearls, sprites for fog and mist. The environment map is rendered once from three light panels (no HDR download). Sounds and the scene only load on `/halloween`.
- `prefers-reduced-motion` turns off screen and camera shake and the camera sway, and slows the bats and the cup spin.

## Sounds

`public/sounds/*.wav` are synthesized placeholders. Run `npm run sounds` to regenerate them. Replace them with real sound design using the same file names (`ambient`, `wail`, `slurp`, `shloop`, `win`, `laugh`). Compressing them to `.mp3` or `.webm` and updating the `src` in `hooks/useSounds.ts` cuts about 700 KB. The mute button is remembered per browser.

On iPhone, while the mic is open, iOS can route sound to the earpiece and play it quieter. The mic is closed as soon as a round ends, so the win jingle and the laugh play at full volume.

## Before launch

- [ ] `GAME_SECRET` and `ADMIN_REDEEM_TOKEN` set in production
- [ ] A real `GameStore` (not in-memory)
- [ ] Win rate measured on real phones; `thresholdFactor` and `minFlatness` tuned
- [ ] Real cup `.glb`, logo position checked
- [ ] Real sounds, compressed
- [ ] Staff know the redeem URL/token (or build them a small redeem page on top of the API)
- [ ] Privacy note: the game collects an email address and hashed IP/device data for the prize limits
