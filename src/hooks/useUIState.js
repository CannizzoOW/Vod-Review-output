import { useState } from "react";

export function useUIState() {
  const [zoom, setZoom] = useState(0.9);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [pageTabsOpen, setPageTabsOpen] = useState(true);
  const [segmentsOpen, setSegmentsOpen] = useState(false);
  const [safeZonesOpen, setSafeZonesOpen] = useState(false);
  const [layerListOpen, setLayerListOpen] = useState(true);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [lockToRegions, setLockToRegions] = useState(false);
  const [timestampGutterWidth, setTimestampGutterWidth] = useState(84);
  const [timestampFontSize, setTimestampFontSize] = useState(13);
  const [timestampColor, setTimestampColor] = useState("#1d4ed8");
  const [pendingImage, setPendingImage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardRawText, setWizardRawText] = useState("");
  const [wizardSource, setWizardSource] = useState("blank");
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
    timestampGutterWidth,
    setTimestampGutterWidth,
    timestampFontSize,
    setTimestampFontSize,
    timestampColor,
    setTimestampColor,
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
