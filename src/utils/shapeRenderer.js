import React from "react";

const SHAPE_LABELS = {
  rectangle: "Rectangle",
  circle: "Circle",
  line: "Line",
  arrow: "Arrow",
};

export function getShapeLabel(shapeType) {
  return SHAPE_LABELS[shapeType] || "Shape";
}

export function getShapePaint(layer) {
  const strokeWidth = Math.max(1, Number(layer.strokeWidth) || 1);
  const fillMode = layer.fillMode || "hollow";
  const fillOpacity = fillMode === "filled" ? layer.fillOpacity ?? 1 : 0;
  const strokeOpacity = layer.strokeOpacity ?? 1;

  return {
    fill: fillMode === "filled" ? layer.fillColor || "#2563eb" : "transparent",
    fillOpacity,
    stroke: layer.strokeColor || "#2563eb",
    strokeOpacity,
    strokeWidth,
  };
}

export function renderShapeLayer(layer) {
  const shapeType = layer.shapeType || "rectangle";
  const paint = getShapePaint(layer);
  const commonProps = {
    fill: paint.fill,
    fillOpacity: paint.fillOpacity,
    stroke: paint.stroke,
    strokeOpacity: paint.strokeOpacity,
    strokeWidth: paint.strokeWidth,
  };

  if (shapeType === "circle") {
    return React.createElement("ellipse", {
      ...commonProps,
      cx: "50%",
      cy: "50%",
      rx: "48%",
      ry: "48%",
    });
  }

  if (shapeType === "line" || shapeType === "arrow") {
    if (shapeType === "arrow") {
      return React.createElement(
        React.Fragment,
        null,
        React.createElement("line", {
          x1: 6,
          y1: 50,
          x2: 78,
          y2: 50,
          stroke: paint.stroke,
          strokeOpacity: paint.strokeOpacity,
          strokeWidth: paint.strokeWidth,
          strokeLinecap: "round",
        }),
        React.createElement("polygon", {
          points: "94,50 76,34 76,66",
          fill: paint.stroke,
          fillOpacity: paint.strokeOpacity,
        })
      );
    }

    return React.createElement("line", {
      x1: 6,
      y1: 50,
      x2: 94,
      y2: 50,
      stroke: paint.stroke,
      strokeOpacity: paint.strokeOpacity,
      strokeWidth: paint.strokeWidth,
      strokeLinecap: "round",
    });
  }

  return React.createElement("rect", {
    ...commonProps,
    x: "2%",
    y: "2%",
    width: "96%",
    height: "96%",
    rx: layer.cornerRadius || 0,
  });
}
