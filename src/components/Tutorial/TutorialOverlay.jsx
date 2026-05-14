import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const SPOTLIGHT_PADDING = 10;
const CARD_W = 320;
const CARD_GAP = 18;

export function TutorialOverlay({
  steps,
  stepIndex,
  onNext,
  onBack,
  onSkip,
}) {
  const step = steps[stepIndex];
  const [targetRect, setTargetRect] = useState(null);
  const [practiceStepId, setPracticeStepId] = useState(null);
  const practiceMode = practiceStepId === step?.id;

  useEffect(() => {
    if (!step) return undefined;

    let frame = null;
    let isMounted = true;

    function updateTargetRect() {
      const node = document.querySelector(`[data-tutorial="${step.target}"]`);

      if (!node) {
        setTargetRect((prev) => (prev ? null : prev));
        if (isMounted) frame = requestAnimationFrame(updateTargetRect);
        return;
      }

      const rect = node.getBoundingClientRect();
      const offsetX = step.spotlightOffsetX || 0;
      const offsetY = step.spotlightOffsetY || 0;
      const nextRect = {
        top: Math.max(8, rect.top + offsetY - SPOTLIGHT_PADDING),
        left: Math.max(8, rect.left + offsetX - SPOTLIGHT_PADDING),
        right: Math.min(window.innerWidth - 8, rect.right + offsetX + SPOTLIGHT_PADDING),
        bottom: Math.min(window.innerHeight - 8, rect.bottom + offsetY + SPOTLIGHT_PADDING),
      };

      setTargetRect((prev) => (rectsMatch(prev, nextRect) ? prev : nextRect));
      if (isMounted) frame = requestAnimationFrame(updateTargetRect);
    }

    function restartUpdate() {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateTargetRect);
    }

    restartUpdate();
    window.addEventListener("resize", restartUpdate);
    window.addEventListener("scroll", restartUpdate, true);

    return () => {
      isMounted = false;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", restartUpdate);
      window.removeEventListener("scroll", restartUpdate, true);
    };
  }, [step]);

  const spotlight = targetRect
    ? {
      x: targetRect.left,
      y: targetRect.top,
      w: Math.max(1, targetRect.right - targetRect.left),
      h: Math.max(1, targetRect.bottom - targetRect.top),
    }
    : null;
  const cardStyle = getCardStyle(spotlight, step);

  if (!step) return null;

  const isLast = stepIndex === steps.length - 1;
  const enterPracticeMode = () => setPracticeStepId(step.id);
  const handleBack = () => {
    setPracticeStepId(null);
    onBack();
  };
  const handleNext = () => {
    setPracticeStepId(null);
    onNext();
  };

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1200]">
      {spotlight && !practiceMode ? (
        <>
          <div className="absolute left-0 top-0 bg-black/65" style={{ width: "100%", height: spotlight.y }} />
          <div className="absolute left-0 bg-black/65" style={{ top: spotlight.y, width: spotlight.x, height: spotlight.h }} />
          <div className="absolute right-0 bg-black/65" style={{ top: spotlight.y, left: spotlight.x + spotlight.w, height: spotlight.h }} />
          <div className="absolute bottom-0 left-0 bg-black/65" style={{ top: spotlight.y + spotlight.h, width: "100%" }} />
        </>
      ) : !spotlight && !practiceMode ? (
        <div className="absolute inset-0 bg-black/70" />
      ) : null}

      {spotlight && (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-blue-300 shadow-[0_0_0_4px_rgba(59,130,246,0.25),0_0_36px_rgba(59,130,246,0.9)]"
          style={{
            left: spotlight.x,
            top: spotlight.y,
            width: spotlight.w,
            height: spotlight.h,
          }}
        />
      )}

      {practiceMode ? (
        <div className="pointer-events-auto absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/95 p-2 text-sm text-slate-100 shadow-2xl">
          <span className="px-2 text-slate-300">Try it on the highlighted area.</span>
          <button
            className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={stepIndex <= 0}
            onClick={handleBack}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn-primary h-9 px-3" onClick={handleNext}>
            {isLast ? "Finish" : "Continue"}
          </button>
        </div>
      ) : (
        <div
          className="pointer-events-auto absolute w-[320px] rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-2xl"
          style={cardStyle}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                Tutorial {stepIndex + 1} / {steps.length}
              </p>
              <h2 className="mt-1 text-xl font-black">{step.title}</h2>
            </div>

            <button
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={() => onSkip()}
              title="Skip tutorial"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-sm leading-6 text-slate-300">{step.body}</p>

          {!spotlight && (
            <p className="mt-3 rounded-xl border border-yellow-600/40 bg-yellow-500/10 p-3 text-xs text-yellow-100">
              This step is waiting for the target UI to appear.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={stepIndex <= 0}
              onClick={handleBack}
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div className="flex gap-2">
              <button className="btn-secondary h-9 px-3" onClick={enterPracticeMode}>
                Try it
              </button>
              <button className="btn-primary h-9 px-3" onClick={handleNext}>
                {isLast ? "Finish" : "Next"} {!isLast && <ArrowRight size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

function rectsMatch(a, b) {
  if (!a || !b) return a === b;

  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.right - b.right) < 0.5 &&
    Math.abs(a.bottom - b.bottom) < 0.5
  );
}

function getCardStyle(spotlight, step) {
  if (!spotlight) {
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const preferLeft = step.placement === "left";
  const preferRight = step.placement === "right";
  const preferBottom = step.placement === "bottom";
  const hasRightRoom = spotlight.x + spotlight.w + CARD_GAP + CARD_W < window.innerWidth;
  const hasLeftRoom = spotlight.x - CARD_GAP - CARD_W > 0;

  if ((preferRight && hasRightRoom) || (!preferLeft && hasRightRoom)) {
    return {
      left: `${spotlight.x + spotlight.w + CARD_GAP}px`,
      top: `${Math.min(window.innerHeight - 260, Math.max(18, spotlight.y))}px`,
    };
  }

  if ((preferLeft && hasLeftRoom) || hasLeftRoom) {
    return {
      left: `${spotlight.x - CARD_GAP - CARD_W}px`,
      top: `${Math.min(window.innerHeight - 260, Math.max(18, spotlight.y))}px`,
    };
  }

  if (preferBottom || spotlight.y + spotlight.h + CARD_GAP + 220 < window.innerHeight) {
    return {
      left: `${Math.min(window.innerWidth - CARD_W - 18, Math.max(18, spotlight.x))}px`,
      top: `${spotlight.y + spotlight.h + CARD_GAP}px`,
    };
  }

  return {
    left: `${Math.min(window.innerWidth - CARD_W - 18, Math.max(18, spotlight.x))}px`,
    top: `${Math.max(18, spotlight.y - CARD_GAP - 220)}px`,
  };
}
