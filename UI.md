# UI.md — Design Language Reference

Reference image: anime-styled soft dashboard (Project Sekai / Hoshino Ichika fan UI).

---

## Mood & Feeling

Soft, airy, and clean. Nothing feels heavy or cluttered. The interface feels like a well-organized personal workspace — calm and approachable, not clinical or corporate. Think pastel productivity app with a slight Japanese design sensibility.

---

## Color

The page background is a desaturated cool lavender-grey — not white, not dark. Somewhere around `#e8eaf2`. It reads almost neutral but has a faint purple warmth to it.

Cards and surfaces sit on top of this background in pure white, which gives them a floating, elevated feel without needing strong shadows.

The primary accent color is a medium indigo-violet (`#6c63ff`). It appears on active elements, buttons, progress fills, icon highlights, and links. It's the only color that "pops" — everything else is either white, near-white, or muted grey.

The navbar and sidebar use a very dark navy (`#1a1a2e`) — nearly black with a blue undertone. This creates a strong contrast anchor without feeling harsh.

Text comes in two weights of the same dark-navy: a rich dark `#2d2d4e` for headings and values, and a muted `#8888aa` for labels, subtitles, and secondary info.

---

## Typography

Clean, geometric sans-serif. Slightly rounded. Good choices: **Plus Jakarta Sans**, **DM Sans**, or **Nunito**. Nothing monospaced, nothing decorative.

Size hierarchy is subtle — there's not a huge jump between heading and body. The differentiation is done more through weight (semibold vs regular) and color (dark vs muted) than through dramatic size differences.

---

## Cards & Surfaces

Cards are white, rounded (12–14px radius), with a very soft diffuse shadow — barely visible, just enough to lift them off the lavender background. No borders. No hard edges.

Padding inside cards is generous enough to breathe but compact enough to keep the layout information-dense.

---

## Icons & Badges

Small icon elements sit inside tiny circular badge containers with a light lavender background (`#ede9fe`) and the violet icon inside. This gives icons a contained, pill-like softness rather than floating raw on the page.

---

## Buttons

Two styles:
- **Primary / dark:** Dark navy background, white text, slightly rounded rectangle. Used for main actions.
- **Pill / playful:** Fully rounded (pill shape), dark background, white text with a small icon. Used for featured CTAs.

No outlined buttons. No ghost buttons. Everything is filled.

---

## Overall Composition

Sections are separated by whitespace and grouping, not by lines or dividers. The eye naturally clusters related elements because of consistent card styling and spacing rhythm.

The layout feels structured but not rigid — columns exist but content within them varies in height and density comfortably.

---

## What to Avoid

- Pure white backgrounds (use the lavender-grey base instead)
- Hard borders or outlines on cards
- Bright or saturated colors other than the single violet accent
- Heavy shadows or dramatic depth effects
- Monospaced or serif fonts
- Dark mode
