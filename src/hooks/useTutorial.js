import { useCallback, useState } from "react";
import { TUTORIAL_STORAGE_KEY, tutorialSteps } from "../utils/tutorialSteps.js";

export function useTutorial() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(() =>
    localStorage.getItem(TUTORIAL_STORAGE_KEY) !== "true"
  );
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);

  const startTutorial = useCallback(() => {
    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
  }, []);

  const closeTutorial = useCallback((completed = false) => {
    if (completed) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    }

    setIsTutorialOpen(false);
  }, []);

  const nextTutorialStep = useCallback(() => {
    setTutorialStepIndex((index) => {
      if (index >= tutorialSteps.length - 1) {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
        setIsTutorialOpen(false);
        return index;
      }

      return index + 1;
    });
  }, []);

  const previousTutorialStep = useCallback(() => {
    setTutorialStepIndex((index) => Math.max(0, index - 1));
  }, []);

  return {
    isTutorialOpen,
    tutorialStepIndex,
    tutorialSteps,
    startTutorial,
    closeTutorial,
    nextTutorialStep,
    previousTutorialStep,
  };
}
