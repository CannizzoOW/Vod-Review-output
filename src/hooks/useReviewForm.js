import { useState } from "react";
import { DEFAULT_HERO, getDefaultTemplateStyle, heroTemplates } from "../utils/constants.js";

export function useReviewForm(defaultHero) {
  const firstHero = DEFAULT_HERO || Object.keys(heroTemplates)[0];

  const [form, setForm] = useState({
    player: "user123",
    hero: defaultHero || firstHero,
    templateStyle: getDefaultTemplateStyle(defaultHero || firstHero),
    reviewer: "Pathfinder1",
    replayId: "10903088673",
    requestId: "",
  });

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return {
    form,
    setForm,
    updateForm,
  };
}
