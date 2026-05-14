import { useState } from "react";
import { uid } from "../utils/parsing.js";
import { makeDefaultBackgroundRectLayer, makePageTitleLayer, makeFooterLayer, syncPageTitleLayers } from "../utils/layerFactory.js";
import { getPageTemplateStyle } from "../utils/constants.js";

export function usePages(form) {
  const [pages, setPages] = useState(() => {
    const firstPage = {
      id: uid(),
      title: "VOD FEEDBACK",
      isCoverPage: true,
      layers: [
        makeDefaultBackgroundRectLayer("VOD FEEDBACK", getPageTemplateStyle(form.hero, form.templateStyle, 0)),
        makePageTitleLayer("VOD FEEDBACK", getPageTemplateStyle(form.hero, form.templateStyle, 0)),
        makeFooterLayer(form),
      ],
    };

    return [firstPage];
  });
  const [activePageId, setActivePageId] = useState(() => pages[0].id);
  const [editingPageId, setEditingPageId] = useState(null);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  function updateActivePageLayers(updater) {
    setPages((prev) =>
      prev.map((page) =>
        page.id === activePageId ? { ...page, layers: updater(page.layers) } : page
      )
    );
  }

  function updatePageTitleLayer(title = activePage?.title || "VOD FEEDBACK") {
    const activePageIndex = pages.findIndex((page) => page.id === activePageId);

    updateActivePageLayers((layers) =>
      syncPageTitleLayers(layers, title, getPageTemplateStyle(form.hero, form.templateStyle, activePageIndex))
    );
  }

  function updateFooterLayer() {
    const footerLayer = makeFooterLayer(form);

    updateActivePageLayers((layers) => {
      const withoutOldFooter = layers.filter((layer) => layer.id !== "footer-info");
      return [...withoutOldFooter, footerLayer];
    });
  }

  function renamePage(pageId, title) {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;

        const nextTitle = title;
        const pageIndex = prev.findIndex((candidate) => candidate.id === pageId);

        return {
          ...page,
          title: nextTitle,
          layers: syncPageTitleLayers(
            page.layers,
            nextTitle,
            getPageTemplateStyle(form.hero, form.templateStyle, pageIndex)
          ),
        };
      })
    );
  }

  function getPageFallbackTitle(pageIndex, pageId) {
    const currentPage = pages.find((page) => page.id === pageId);

    if (pageIndex === 0 || currentPage?.isCoverPage) {
      return "VOD FEEDBACK";
    }

    const otherPages = pages.filter((page) => page.id !== pageId);
    return getNextPageTitle(otherPages);
  }

  function getNextPageTitle(pageList = pages) {
    const usedNumbers = new Set();

    for (const page of pageList) {
      if (page.isCoverPage) continue;

      const match = String(page.title || "").trim().match(/^Page\s+(\d+)$/i);

      if (match) {
        usedNumbers.add(Number(match[1]));
      }
    }

    let nextNumber = 1;

    while (usedNumbers.has(nextNumber)) {
      nextNumber += 1;
    }

    return `Page ${nextNumber}`;
  }

  function removeActivePage() {
    if (pages.length <= 1) {
      alert("You need at least one page.");
      return;
    }

    const currentIndex = pages.findIndex((page) => page.id === activePageId);
    const nextPages = pages.filter((page) => page.id !== activePageId);

    const nextIndex = Math.max(0, currentIndex - 1);
    const nextActive = nextPages[nextIndex] || nextPages[0];

    setPages(nextPages);
    setActivePageId(nextActive.id);
  }

  function addPage() {
    const pageTitle = getNextPageTitle(pages);
    const pageTemplateStyle = getPageTemplateStyle(form.hero, form.templateStyle, pages.length);

    const page = {
      id: uid(),
      title: pageTitle,
      isCoverPage: false,
      layers: [
        makeDefaultBackgroundRectLayer(pageTitle, pageTemplateStyle),
        makePageTitleLayer(pageTitle, pageTemplateStyle),
        makeFooterLayer(form),
      ],
    };

    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
  }

  return {
    pages,
    setPages,
    activePageId,
    setActivePageId,
    activePage,
    editingPageId,
    setEditingPageId,
    updateActivePageLayers,
    updatePageTitleLayer,
    updateFooterLayer,
    renamePage,
    getPageFallbackTitle,
    getNextPageTitle,
    removeActivePage,
    addPage,
  };
}
