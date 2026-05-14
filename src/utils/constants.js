import heroTemplates from "../data/heroTemplates.json";

export const PAGE_W = 1080;
export const PAGE_H = 1527;
export const HEROES = Object.keys(heroTemplates);
export const DEFAULT_HERO = HEROES.includes("Invisible Woman")
  ? "Invisible Woman"
  : HEROES[0];
export const FALLBACK_TEMPLATE = `${import.meta.env.BASE_URL}templates/default.png`;

export function getHeroTemplateStyles(hero) {
  const config = heroTemplates[hero];

  if (!config) return [];

  if (config.styles) {
    return Object.entries(config.styles).map(([value, style]) => ({
      value,
      label: style.label || value,
      template: style.template,
    }));
  }

  return [
    {
      value: "default",
      label: "Default",
      template: config.template,
    },
  ];
}

export function getDefaultTemplateStyle(hero) {
  const config = heroTemplates[hero];

  if (!config) return "default";
  if (config.defaultStyle) return config.defaultStyle;

  const styles = getHeroTemplateStyles(hero);
  return styles[0]?.value || "default";
}

export function getPageTemplateStyle(hero, templateStyle, pageIndex = 0) {
  const config = heroTemplates[hero];
  const styleKey = templateStyle || getDefaultTemplateStyle(hero);

  if (!config?.styles || pageIndex <= 0) return styleKey;
  if (/(?:^|-)page-2(?:$|-)/i.test(styleKey)) return styleKey;

  const pageTwoStyleKey = styleKey.replace(/page-1/i, "page-2");

  return config.styles[pageTwoStyleKey] ? pageTwoStyleKey : styleKey;
}

export function getHeroTemplatePath(hero, templateStyle) {
  const config = heroTemplates[hero];

  if (!config) return null;

  if (config.styles) {
    const styleKey = templateStyle || getDefaultTemplateStyle(hero);
    return config.styles[styleKey]?.template || config.styles[getDefaultTemplateStyle(hero)]?.template || null;
  }

  return config.template || null;
}

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

const PAGE_TWO_SAFE_ZONE_Y = 255;

export function isPageTwoTemplateStyle(templateStyle = "") {
  return /(?:^|-)page-2(?:$|-)/i.test(String(templateStyle || ""));
}

export function getSafeZonesForTemplateStyle(safeZones = DEFAULT_SAFE_ZONES, templateStyle = "") {
  if (!isPageTwoTemplateStyle(templateStyle)) {
    return safeZones;
  }

  return safeZones.map((zone) => {
    if (zone.id !== "mainText" && zone.id !== "rightMedia") {
      return zone;
    }

    const yDelta = zone.y - PAGE_TWO_SAFE_ZONE_Y;

    return {
      ...zone,
      y: PAGE_TWO_SAFE_ZONE_Y,
      h: zone.h + Math.max(0, yDelta),
    };
  });
}

export const SAMPLE_REVIEW = `Replay ID: 10903088673

Abilities
Dagger Storm is a very useful ability for creating space, but you’re not using it often enough. It does burst heal on impact and also do overtime healing for allies that step inside the bubble after. Try placing it in front of your tank so they can push, or behind them when they’re under pressure. It comes down to game sense—knowing when your team needs to move forward or fall back. There are times where you can use it on yourself (for example, if enemies push close enough to reach you), but this should be rare if you are positioned well and supporting your Vanguard properly.
1:42 This would be a better time to use bubble instead of veil of light. You can see your Vanguard (The Thing and Rogue) being pushed back toward you. Dropping the bubble here would help them hold space and stay on point.
Around 3:00 onward, it looks like you start to panic and spam abilities. Since Venom is a melee Vanguard, you need to create space between you and him and let Rogue stay between you. Drop bubble on yourself or switch to Cloak to reposition before continuing to deal damage or heal would be a way to go.
Don’t be afraid to switch to Cloak and blind enemies when they are low on health (for example, at 2:00 on StarLord). This also works when you have space between you and the enemy, such as at 2:28, when your team is full health and pushing enemies off the capture point. (1/2)
Teleport
You use Cloak teleport to reposition, which is good. However, try to find better repositioning spots, either back up or to where your team is (if it safe- do try to reposition to the middle of the fight). It doesn’t provide much value if the enemy sees you disappear and reappear in the same place where they can still damage you.
5:03 As shown here, Venom targets you within 1–2 seconds and eliminates you.
Ult Usage
Always ult as Cloak, not Dagger. (Exceptions are extremely rare.) In rank or in a game where there's counter enemies (Magneto, Iron Man, etc.). Ulting as Cloak gives you a split second to teleport to safety, behind cover or back to your team.
Not only that, ulting as cloak also allows you to push to the backline to their healer, blind enemies and apply pressure (if it’s safe, if not you can teleport back to your team).
You don’t always need to ult-trade immediately. Delaying your counter-ult by a few seconds can outlast the enemy’s ult and give your team an advantage. Understanding ult economy is important`;

export { heroTemplates };
