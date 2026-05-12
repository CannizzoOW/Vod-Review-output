import { useState } from "react";

export function useUIState() {
  const [zoom, setZoom] = useState(0.9);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [pageTabsOpen, setPageTabsOpen] = useState(true);
  const [segmentsOpen, setSegmentsOpen] = useState(true);
  const [safeZonesOpen, setSafeZonesOpen] = useState(true);
  const [layerListOpen, setLayerListOpen] = useState(true);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [lockToRegions, setLockToRegions] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardRawText, setWizardRawText] = useState("");
  const [wizardSource, setWizardSource] = useState("json");
  const [wizardForm, setWizardForm] = useState({
    player: "",
    reviewer: "",
    replayId: "",
    hero: "",
  });

  // Modal state
  const [detailsEditorOpen, setDetailsEditorOpen] = useState(false);

  return {
    zoom,
    setZoom,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    pageTabsOpen,
    setPageTabsOpen,
    segmentsOpen,
    setSegmentsOpen,
    safeZonesOpen,
    setSafeZonesOpen,
    layerListOpen,
    setLayerListOpen,
    gridEnabled,
    setGridEnabled,
    lockToRegions,
    setLockToRegions,
    pendingImage,
    setPendingImage,
    isExporting,
    setIsExporting,
    wizardOpen,
    setWizardOpen,
    wizardStep,
    setWizardStep,
    wizardRawText,
    setWizardRawText,
    wizardSource,
    setWizardSource,
    wizardForm,
    setWizardForm,
    detailsEditorOpen,
    setDetailsEditorOpen,
  };
}
