import { HEROES } from "./constants.js";
import { RIVALS_EMOJIS } from "./rivalsEmojis.js";

export const UNIVERSAL_EMOJI_CHARACTER = "__universal__";

const CHARACTER_ALIASES = {
  "Captain America": ["cap", "america"],
  "Cloak & Dagger": ["cloak", "dagger", "lightforce", "darkforce"],
  "Devil Dinosaur": ["dd", "dino", "dinosaur"],
  "Doctor Strange": ["strange", "sorcery", "magic"],
  "Human Torch": ["torch", "flame"],
  "Invisible Woman": ["invisible", "prism", "malice"],
  "Jeff the Land Shark": ["jeff", "shark"],
  "Mister Fantastic": ["fantastic", "stretch"],
  "Rocket Raccoon": ["rocket"],
  "Scarlet Witch": ["scarlet", "witch"],
  "Spider-Man": ["spider", "spidey"],
  "Star Lord": ["star-lord", "star lord", "lord", "quill"],
  "The Punisher": ["punisher"],
  "The Thing": ["thing"],
  "Winter Soldier": ["winter", "bucky"],
};

export function getEmojiCharacterMap(overrides = {}) {
  const map = new Map();

  for (const emoji of RIVALS_EMOJIS) {
    const override = overrides[emoji.id];
    const character = override || getEmojiCharacter(emoji);

    if (character) {
      map.set(emoji.id, character);
    }
  }

  return map;
}

export function getEmojiCharacterOptions(emojiCharacterMap) {
  const counts = new Map();

  for (const emoji of RIVALS_EMOJIS) {
    const character = emojiCharacterMap.get(emoji.id) || UNIVERSAL_EMOJI_CHARACTER;
    counts.set(character, (counts.get(character) || 0) + 1);
  }

  return [
    ...HEROES.filter((hero) => counts.has(hero)).map((hero) => ({
      value: hero,
      label: hero,
      count: counts.get(hero),
    })),
    {
      value: UNIVERSAL_EMOJI_CHARACTER,
      label: "Universal / Other",
      count: counts.get(UNIVERSAL_EMOJI_CHARACTER) || 0,
    },
  ].filter((option) => option.count > 0);
}

export function getEmojiCharacter(emoji) {
  const haystack = normalizeSearchText([
    emoji.name,
    emoji.src,
    emoji.remoteSrc,
    emoji.href,
  ].filter(Boolean).join(" "));

  for (const hero of HEROES) {
    const aliases = getCharacterAliases(hero);

    if (aliases.some((alias) => hasAliasMatch(haystack, alias))) {
      return hero;
    }
  }

  return null;
}

function getCharacterAliases(hero) {
  const aliases = CHARACTER_ALIASES[hero] || [];

  return [hero, ...aliases].map(normalizeSearchText).filter(Boolean);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasAliasMatch(haystack, alias) {
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`);

  return pattern.test(haystack);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
