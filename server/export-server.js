import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "20mb" }));

app.post("/export/png", async (req, res) => {
    const { embedUrl, layers } = req.body;

    const html = `
    <!doctype html>
    <html>
      <head>
        <style>
          body { margin: 0; background: #111827; }
          .page {
            position: relative;
            width: 1000px;
            height: 1414px;
            overflow: hidden;
          }
          iframe {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border: 0;
          }
          .layer {
            position: absolute;
            color: #5f4e46;
            font-family: Arial, sans-serif;
            white-space: pre-wrap;
            line-height: 1.25;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <iframe src="${embedUrl}" allowfullscreen></iframe>

          ${layers
            .map(
                (l) => `
              <div
                class="layer"
                style="
                  left:${l.x}px;
                  top:${l.y}px;
                  width:${l.w}px;
                  min-height:${l.h}px;
                  font-size:${l.fontSize || 18}px;
                  font-weight:${l.weight || 500};
                "
              >${escapeHtml(l.text || "")}</div>
            `
            )
            .join("")}
        </div>
      </body>
    </html>
  `;

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1000, height: 1414, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: "networkidle2", timeout: 60000 });

        await page.waitForTimeout(3000);

        const buffer = await page.screenshot({
            type: "png",
            fullPage: false,
        });

        res.setHeader("Content-Type", "image/png");
        res.send(buffer);
    } finally {
        await browser.close();
    }
});

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

app.listen(3001, () => {
    console.log("Export server running on http://localhost:3001");
});