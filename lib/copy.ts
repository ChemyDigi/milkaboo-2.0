/** Every player-facing line of the game in one place, so brand and translation edits never touch components. */
export const BRAND = "Milkaboo";

export const copy = {
  title: `Free the ${BRAND} Cup`,
  tagline: "A ghost has wrapped itself around your bubble tea. Suck it off before time runs out and the cup is yours.",
  steps: [
    { icon: "phone", text: "Hold your phone close to your lips. Close, not touching!" },
    { icon: "breath", text: "Suck air in, long and hard. Shouting won't scare it off." },
    { icon: "cup", text: "Peel the ghost off in 20 seconds and win a free cup." },
  ],
  start: "Start",
  triesLeft: (n: number) => (n === 1 ? "1 try left today" : `${n} tries left today`),
  noTriesLeft: "No tries left today. The ghost needs its beauty sleep. Come back tomorrow!",
  hygiene: "Keep the phone a finger's width from your mouth. No licking the ghost.",

  permission: {
    title: "Let the ghost hear you",
    body: "We use your microphone to hear how hard you're sucking. Nothing is recorded or sent anywhere.",
    allow: "Allow microphone",
    asking: "Waiting for your browser…",
    denied: {
      title: "The mic is blocked",
      body: "No mic, no ghostbusting. Turn it back on, then reload this page:",
      ios: "iPhone/iPad Safari: tap ᴀA in the address bar → Website Settings → Microphone → Allow.",
      android: "Android Chrome: tap the lock (or ⋮ icon) next to the address → Permissions → Microphone → Allow.",
      desktop: "On a computer: click the icon left of the address bar and allow the microphone.",
    },
    insecure: {
      title: "This page needs a secure link",
      body: "Browsers only share the mic with https:// pages. Open the game from its https address.",
    },
    unsupported: {
      title: "This browser can't hear you",
      body: "Try the latest Safari on iPhone or Chrome on Android.",
    },
    noDevice: {
      title: "No microphone found",
      body: "Plug one in, or try on your phone.",
    },
    error: {
      title: "The ghost jammed the mic",
      body: "Something went wrong opening your microphone. Close other apps that use it and try again.",
    },
    retry: "Try again",
    reload: "Reload page",
  },

  calibrating: {
    title: "Shhh… the ghost is listening",
    body: "Stay quiet for a moment",
    go: "Suck!",
  },

  hud: {
    freed: "Cup freed",
    status: {
      idle: "Suck now!",
      sucking: "Keep sucking!",
      gripping: "It's holding on! Harder!",
      draining: "Don't stop, it's wrapping back!",
      almost: "Almost! Just the logo left!",
    },
    micLabel: "Mic level",
  },

  win: {
    title: "You freed the cup!",
    body: "The ghost is gone and the bubble tea is yours.",
    emailLabel: "Your email",
    emailHint: "Where should we send your free cup code?",
    emailPlaceholder: "you@example.com",
    claim: "Get my free cup",
    claiming: "Checking with the ghost…",
    codeLabel: "Your free cup code",
    copy: "Copy",
    copied: "Copied!",
    redeem: `Show this code at any ${BRAND} counter.`,
    expires: (date: string) => `Valid until ${date}. One free cup per code.`,
    errors: {
      "bad-email": "That email looks a bit spooky. Check it and try again.",
      "email-already-won": "This email has already won a cup. Share the fun with a friend!",
      "device-already-won": "This phone already won today. Come back tomorrow!",
      "budget-spent": "You beat the ghost, but today's free cups are all gone. Try again tomorrow!",
      "already-claimed": "This win has already been claimed.",
      "invalid-session": "Your round expired before you claimed it. Play again!",
      "round-rejected": "The ghost disputes that win. Play another round!",
      network: "We couldn't reach the counter. Check your connection and try again.",
    } as Record<string, string>,
    playAgain: "Back to start",
  },

  lose: {
    title: "The ghost won this time",
    freed: (pct: number) => `You freed ${pct}% of the cup`,
    tryAgain: "Try again",
    taunt: ["Boo-hoo-hoo!", "Is that all you've got?", "This tea is mine!"],
  },

  mute: "Mute sound",
  unmute: "Unmute sound",
} as const;
