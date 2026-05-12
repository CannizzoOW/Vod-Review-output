import heroTemplates from "../data/heroTemplates.json";

export const PAGE_W = 1080;
export const PAGE_H = 1527;
export const HEROES = Object.keys(heroTemplates);
export const FALLBACK_TEMPLATE = `${import.meta.env.BASE_URL}templates/default.png`;

export const DEFAULT_SAFE_ZONES = [
  {
    id: "mainText",
    label: "Main text",
    x: 10,
    y: 450,
    w: 670,
    h: 940,
    layout: "flow",
    padding: 28,
    gap: 18,
  },
  {
    id: "rightMedia",
    label: "Screenshots",
    x: 700,
    y: 450,
    w: 360,
    h: 940,
    layout: "stack",
    padding: 16,
    gap: 16,
  },
  {
    id: "footerSafe",
    label: "Footer",
    x: 0,
    y: 1450,
    w: 1080,
    h: 70,
    layout: "fixed",
    padding: 10,
    gap: 10,
  },
];

export const SAMPLE_REVIEW = `Replay ID: 10903088673

Abilities
Dagger Storm is a very useful ability for creating space, but you're not using it often enough.

• 1:42 This would be a better time to use bubble instead of veil of light.
• Around 3:00 onward, it looks like you start to panic and spam abilities.

Teleport
You use Cloak teleport to reposition, which is good.
• 5:03 As shown here, Venom targets you within 1–2 seconds and eliminates you.

Ult Usage
Always ult as Cloak, not Dagger.`;

export { heroTemplates };
