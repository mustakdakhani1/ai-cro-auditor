require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");
const app = express();
const { chromium } = require("playwright");

async function listGeminiModels() {
  const { GoogleGenAI } = require("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const models = await ai.models.list();

  for await (const model of models) {
    console.log(model.name);
  }
}
async function getBrowser() {
  return await chromium.launch({
    headless: true,
  });
}


  // =====================================================
// MAIN GEMINI CRO ANALYST
// =====================================================

async function analyzeWithGemini(croEvidence) {
  const { GoogleGenAI } = require("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `
You are an expert Conversion Rate Optimization (CRO) analyst.

You are analyzing a real website using evidence collected by a browser automation system.

Your job is to reason about the website's ability to convert visitors into the intended business outcome.

IMPORTANT EVIDENCE-GROUNDING RULES:

1. Base every conclusion ONLY on the provided CRO evidence.

2. Never assume that an element, feature, behavior, or user experience exists
   unless the evidence explicitly supports it.

3. Distinguish between:
   - OBSERVED FACT: directly present in the evidence.
   - CRO INTERPRETATION: a reasonable conclusion derived from observed facts.
   - UNKNOWN: something the evidence does not establish.

4. Never present an inference as an observed fact.

5. If the evidence does not prove something, do NOT claim that it happened.

6. Do not claim that a CTA is persistent, sticky, fixed, or remains visible
   during scrolling unless the evidence explicitly contains scroll/persistence
   measurements.

7. Do not claim that a form is above the fold merely because a form-related
   button is above the fold. The evidence must establish that the actual form
   is visible.

8. Do not claim that a CTA was clicked successfully unless the CTA interaction
   evidence explicitly records a successful interaction.

9. Do not claim that a destination page creates friction unless the CTA journey
   or destination evidence demonstrates that friction.

10. Do not claim that users will experience a particular problem unless there
    is evidence supporting that conclusion. Use CRO language such as
    "may create friction" or "could increase cognitive load" when appropriate.

11. Do not interpret raw counts as automatically negative.
    For example, a large number of links does not automatically mean poor CRO.
    Explain why the evidence suggests those links could affect conversion.

12. Do not treat SEO, accessibility, or technical issues as CRO problems
    unless there is a reasonable conversion connection supported by evidence.

13. Do not recommend changes merely because they are common CRO practices.

14. Consider the website type before judging its conversion strategy.

15. Consider desktop and mobile separately.

16. Give particular importance to evidence from the above-the-fold experience.

17. Evaluate CTA hierarchy using the Gemini CTA classification when available,
    but clearly distinguish AI classification from browser-observed facts.

18. When evidence conflicts, acknowledge the conflict instead of choosing one
    silently.

19. If evidence is insufficient, explicitly say:
    "Evidence is insufficient to determine this."

20. Every issue and recommendation must be traceable to one or more pieces
    of the provided evidence.

21. Never invent metrics, percentages, user behavior, conversion rates,
    customer reactions, or business outcomes.

22. Do not simply copy the existing rule-engine score.
    The existing findings are supporting evidence; you are the CRO analyst.

CRO SCORING:

Return an overall CRO score from 0 to 100.

The score should represent the website's observed conversion effectiveness, not technical quality.

Consider:

- First impression
- Value proposition clarity
- Messaging
- CTA clarity
- CTA hierarchy
- Conversion path
- Conversion friction
- Trust
- Lead generation
- UX
- Content
- Mobile experience

Use the following interpretation:

90-100 = Excellent
80-89 = Strong
70-79 = Good
60-69 = Needs improvement
40-59 = Weak
0-39 = Poor

IMPORTANT:

Do not simply copy the existing rule-engine score.

The existing findings are evidence that can help you reason, but you are the CRO analyst.

WEBSITE EVIDENCE:

${JSON.stringify(croEvidence, null, 2)}

Return ONLY valid JSON.

Use exactly this structure:

{
  "overallScore": 0,

  "grade": "Excellent",

  "executiveSummary": {
    "headline": "",
    "summary": ""
  },

  "firstImpression": {
    "score": 0,
    "assessment": "",
    "strengths": [],
    "issues": []
  },

  "conversion": {
    "score": 0,
    "assessment": "",
    "strengths": [],
    "issues": [],
    "recommendations": []
  },

  "messaging": {
    "score": 0,
    "assessment": "",
    "strengths": [],
    "issues": [],
    "recommendations": []
  },

  "ux": {
    "score": 0,
    "assessment": "",
    "strengths": [],
    "issues": [],
    "recommendations": []
  },

  "trust": {
    "score": 0,
    "assessment": "",
    "strengths": [],
    "issues": [],
    "recommendations": []
  },

  "leadGeneration": {
    "score": 0,
    "assessment": "",
    "strengths": [],
    "issues": [],
    "recommendations": []
  },

  "content": {
    "score": 0,
    "assessment": "",
    "strengths": [],
    "issues": [],
    "recommendations": []
  },

"priorityActions": [
  {
    "priority": 1,
    "issue": "",
    "whyItMatters": "",
    "recommendation": "",
    "expectedImpact": "High",
    "evidence": [
      ""
    ]
  }
] 
  "goodThings": [
    {
      "area": "",
      "observation": ""
    }
  ]
}

Additional requirements:

- Scores must be integers from 0 to 100.
- expectedImpact must be one of: "High", "Medium", "Low".
- priority must start at 1.
- Keep priorityActions focused on the most important conversion opportunities.
- Keep recommendations specific and actionable.
- Do not produce generic advice.
- Every priority action must include at least one evidence item.
- Evidence must refer to actual information contained in CRO evidence.
- Do not fabricate evidence references.
`;

let response;

const maxAttempts = 3;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    console.log(
      `Gemini CRO analysis attempt ${attempt}/${maxAttempts}...`
    );

    response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    // Gemini responded successfully
    break;

  } catch (error) {
    console.error(
      `Gemini CRO analysis attempt ${attempt} failed:`,
      error.message
    );

    if (attempt === maxAttempts) {
      throw error;
    }

    // Wait before retrying
    const delay = attempt * 2000;

    console.log(
      `Retrying Gemini in ${delay / 1000} seconds...`
    );

    await new Promise((resolve) =>
      setTimeout(resolve, delay)
    );
  }
}

  const text = response.text;

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini returned invalid JSON.");

    console.error(text);

    throw new Error("Gemini CRO analysis returned invalid JSON.");
  }
}

// =====================================================
// GEMINI CTA CLASSIFIER
// =====================================================

async function classifyCTACandidates(ctaCandidates, pageContext) {
  const { GoogleGenAI } = require("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });


  const prompt = `
You are a CRO expert analyzing website conversion elements.

Your task is to classify website elements based on their
conversion intent and context.

Possible classifications:

- primary_cta
- secondary_cta
- navigation
- utility
- account_action
- support_action
- legal
- cookie
- other

IMPORTANT:
Do NOT classify an element based only on a specific word.

Consider:
- element text
- element type
- surrounding text
- nearby heading
- destination URL
- whether it is above the fold
- the apparent purpose of the website

Website context:
${JSON.stringify(pageContext, null, 2)}

CTA candidates:
${JSON.stringify(ctaCandidates, null, 2)}

Return ONLY valid JSON in this format:

{
  "primaryCTA": {
    "text": "string",
    "confidence": 0.0
  },
  "secondaryCTAs": [
    {
      "text": "string",
      "confidence": 0.0
    }
  ],
  "classifications": [
    {
      "text": "string",
      "type": "primary_cta",
      "confidence": 0.0
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  return response.text;
}

const screenshotDir = path.join(__dirname, "screenshots");

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir);
}

app.use("/screenshots", express.static(screenshotDir));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AI CRO Auditor backend is running",
  });
});

app.post("/api/analyze", async (req, res) => {
  const { websiteUrl } = req.body;

  if (!websiteUrl) {
    return res.status(400).json({
      success: false,
      message: "Website URL is required",
    });
  }

  try {
    console.log("Opening website with Playwright:", websiteUrl);

const browserInstance = await getBrowser();

const page = await browserInstance.newPage({
  viewport: {
    width: 1440,
    height: 900,
  },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",
});

await page.goto(websiteUrl, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

// Give JavaScript-rendered content a moment to appear
await page.waitForTimeout(1500);

console.log("Website rendered successfully.");

// =====================================================
// ABOVE-THE-FOLD ANALYSIS
// =====================================================

const aboveFoldData = await page.evaluate(() => {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const isVisible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.top < viewportHeight &&
      rect.bottom > 0
    );
  };

  const getText = (element) => {
    return element.innerText
      ?.replace(/\s+/g, " ")
      .trim();
  };

  const visibleHeadings = Array.from(
    document.querySelectorAll("h1, h2, h3")
  )
    .filter(isVisible)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: getText(element),
    }))
    .filter((item) => item.text);

  const visibleButtons = Array.from(
    document.querySelectorAll("button")
  )
    .filter(isVisible)
    .map((element) => getText(element))
    .filter(Boolean);

  const visibleLinks = Array.from(
    document.querySelectorAll("a")
  )
    .filter(isVisible)
    .map((element) => ({
      text: getText(element),
      href: element.href || "",
    }))
    .filter((item) => item.text);

  const ctaPattern =
    /\b(buy now|shop now|get started|start free|start now|try free|free trial|book a demo|request demo|contact us|sign up|signup|subscribe|request a quote|download|join now|learn more)\b/i;

  const visibleCTAs = [
    ...visibleButtons.map((text) => ({
      type: "button",
      text,
    })),

    ...visibleLinks.map((link) => ({
      type: "link",
      text: link.text,
      href: link.href,
    })),
  ].filter((item) => ctaPattern.test(item.text));

  const ctaCandidates = [
  ...Array.from(document.querySelectorAll("button")),
  ...Array.from(document.querySelectorAll("a")),
]
  .filter(isVisible)
  .map((element, index) => {
    const text = getText(element);

    if (!text) {
      return null;
    }

    const rect = element.getBoundingClientRect();

    return {
      index,
      tag: element.tagName.toLowerCase(),
      text,
      href: element.getAttribute("href") || "",
      ariaLabel: element.getAttribute("aria-label") || "",
      title: element.getAttribute("title") || "",
      className:
        typeof element.className === "string"
          ? element.className
          : "",
      nearbyHeading:
        element
          .closest("section, header, main, nav, footer")
          ?.querySelector("h1, h2, h3")
          ?.innerText
          ?.replace(/\s+/g, " ")
          .trim() || "",
      parentText:
        element.parentElement?.innerText
          ?.replace(/\s+/g, " ")
          .trim()
          .slice(0, 300) || "",
      position: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      aboveFold: rect.top < window.innerHeight,
    };
  })
  .filter(Boolean);

  // =====================================================
// PRIMARY CTA DETECTION
// =====================================================

const getCTAPriority = (text) => {
  const normalized = text.toLowerCase().trim();

  if (
    /get started|start free|start now|try free|free trial|buy now|shop now|sign up|signup/.test(
      normalized
    )
  ) {
    return 3;
  }

  if (
    /book a demo|request a demo|request demo|contact us|request a quote/.test(
      normalized
    )
  ) {
    return 2;
  }

  if (
    /learn more|download|subscribe|join now|find your subscription/.test(
      normalized
    )
  ) {
    return 1;
  }

  return 0;
};

const rankedCTAs = visibleCTAs
  .map((cta) => ({
    ...cta,
    priority: getCTAPriority(cta.text),
  }))
  .sort((a, b) => b.priority - a.priority);

const primaryCTA = rankedCTAs[0] || null;

const secondaryCTAs = rankedCTAs.slice(1);

  return {
  viewportWidth,
  viewportHeight,

  visibleHeadings,
  visibleButtons,
  visibleLinks,

  visibleCTAs,
  ctaCandidates,
  primaryCTA,
  secondaryCTAs,

  primaryH1:
    visibleHeadings.find((heading) => heading.tag === "h1")?.text || null,

  hasAboveFoldCTA: visibleCTAs.length > 0,
};
});

console.log("Above-the-fold analysis:", aboveFoldData);

// =====================================================
// MOBILE ABOVE-THE-FOLD ANALYSIS
// =====================================================

const mobilePage = await browserInstance.newPage({
  viewport: {
    width: 390,
    height: 844,
  },

  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
});

await mobilePage.goto(websiteUrl, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

await mobilePage.waitForTimeout(1500);

const mobileAboveFoldData = await mobilePage.evaluate(() => {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const isVisible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.top < viewportHeight &&
      rect.bottom > 0
    );
  };

  const getText = (element) => {
    return element.innerText
      ?.replace(/\s+/g, " ")
      .trim();
  };

  const visibleHeadings = Array.from(
    document.querySelectorAll("h1, h2, h3")
  )
    .filter(isVisible)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: getText(element),
    }))
    .filter((item) => item.text);

  const visibleButtons = Array.from(
    document.querySelectorAll("button")
  )
    .filter(isVisible)
    .map((element) => getText(element))
    .filter(Boolean);

  const visibleLinks = Array.from(
    document.querySelectorAll("a")
  )
    .filter(isVisible)
    .map((element) => ({
      text: getText(element),
      href: element.href || "",
    }))
    .filter((item) => item.text);

  const ctaPattern =
    /\b(buy now|shop now|get started|start free|start now|try free|free trial|book a demo|request a demo|request demo|contact us|sign up|signup|subscribe|request a quote|download|join now|learn more)\b/i;

  const visibleCTAs = [
    ...visibleButtons.map((text) => ({
      type: "button",
      text,
    })),

    ...visibleLinks.map((link) => ({
      type: "link",
      text: link.text,
      href: link.href,
    })),
  ].filter((item) => ctaPattern.test(item.text));


  const ctaCandidates = [
  ...Array.from(document.querySelectorAll("button")),
  ...Array.from(document.querySelectorAll("a")),
]
  .filter(isVisible)
  .map((element, index) => {
    const text = getText(element);

    if (!text) {
      return null;
    }

    const rect = element.getBoundingClientRect();

    const ariaLabel =
      element.getAttribute("aria-label") || "";

    const title =
      element.getAttribute("title") || "";

    const href =
      element.getAttribute("href") || "";

    const className =
      typeof element.className === "string"
        ? element.className
        : "";

    const parentText =
      element.parentElement?.innerText
        ?.replace(/\s+/g, " ")
        .trim()
        .slice(0, 300) || "";

    const nearbyHeading =
      element
        .closest("section, header, main, nav, footer")
        ?.querySelector("h1, h2, h3")
        ?.innerText
        ?.replace(/\s+/g, " ")
        .trim() || "";

    return {
      index,
      tag: element.tagName.toLowerCase(),
      text,
      href,
      ariaLabel,
      title,
      className,
      nearbyHeading,
      parentText,
      position: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      aboveFold: rect.top < window.innerHeight,
    };
  })
  .filter(Boolean);

    // =====================================================
  // PRIMARY CTA DETECTION
  // =====================================================

  const getCTAPriority = (text) => {
    const normalized = text.toLowerCase().trim();

    if (
      /get started|start free|start now|try free|free trial|buy now|shop now|sign up|signup/.test(
        normalized
      )
    ) {
      return 3;
    }

    if (
      /book a demo|request a demo|request demo|contact us|request a quote/.test(
        normalized
      )
    ) {
      return 2;
    }

    if (
      /learn more|download|subscribe|join now|find your subscription/.test(
        normalized
      )
    ) {
      return 1;
    }

    return 0;
  };

  const rankedCTAs = visibleCTAs
    .map((cta) => ({
      ...cta,
      priority: getCTAPriority(cta.text),
    }))
    .sort((a, b) => b.priority - a.priority);

  const primaryCTA = rankedCTAs[0] || null;

  const secondaryCTAs = rankedCTAs.slice(1);

    return {
    viewportWidth,
    viewportHeight,
    visibleHeadings,
    visibleButtons,
    visibleLinks,
    visibleCTAs,
      ctaCandidates,


    primaryCTA,
    secondaryCTAs,

    primaryH1:
      visibleHeadings.find((heading) => heading.tag === "h1")?.text || null,

    hasAboveFoldCTA: visibleCTAs.length > 0,
  };
});

const mobileScreenshotName = `mobile-audit-${Date.now()}.png`;

await mobilePage.screenshot({
  path: path.join(screenshotDir, mobileScreenshotName),
  fullPage: false,
});

console.log(
  "Mobile above-the-fold analysis:",
  mobileAboveFoldData
);

await mobilePage.close();

console.log("Above-the-fold analysis:", aboveFoldData);

// =====================================================
// AI CTA CLASSIFICATION TEST
// =====================================================

try {
  const aiCTAResult = await classifyCTACandidates(
    aboveFoldData.ctaCandidates,
    {
      url: websiteUrl,
      pageTitle:
        aboveFoldData.visibleHeadings
          .find((heading) => heading.tag === "h1")
          ?.text || "",
      primaryH1: aboveFoldData.primaryH1,
      viewportWidth: aboveFoldData.viewportWidth,
      viewportHeight: aboveFoldData.viewportHeight,
    }
  );

  console.log(
    "AI CTA CLASSIFICATION:",
    aiCTAResult
  );
} catch (error) {
  console.error(
    "AI CTA classification failed:",
    error.message
  );
}

// =====================================================
// FIRST IMPRESSION SCORE
// =====================================================

let firstImpressionScore = 0;
const firstImpressionFactors = [];

const desktop = aboveFoldData;
const mobile = mobileAboveFoldData;

// -----------------------------------------------------
// 1. PRIMARY HEADLINE
// -----------------------------------------------------

if (desktop.primaryH1 && mobile.primaryH1) {
  firstImpressionScore += 25;

  firstImpressionFactors.push({
    factor: "Primary headline",
    score: 25,
    status: "Good",
    detail: "A primary headline is visible on both desktop and mobile.",
  });
} else if (desktop.primaryH1 || mobile.primaryH1) {
  firstImpressionScore += 12;

  firstImpressionFactors.push({
    factor: "Primary headline",
    score: 12,
    status: "Needs improvement",
    detail: "A primary headline is visible on only one viewport.",
  });
} else {
  firstImpressionFactors.push({
    factor: "Primary headline",
    score: 0,
    status: "Poor",
    detail: "No visible primary headline detected.",
  });
}

// -----------------------------------------------------
// 2. ABOVE-FOLD CTA
// -----------------------------------------------------

if (desktop.hasAboveFoldCTA && mobile.hasAboveFoldCTA) {
  firstImpressionScore += 25;

  firstImpressionFactors.push({
    factor: "Above-fold CTA",
    score: 25,
    status: "Good",
    detail: "A CTA is visible above the fold on desktop and mobile.",
  });
} else if (desktop.hasAboveFoldCTA || mobile.hasAboveFoldCTA) {
  firstImpressionScore += 12;

  firstImpressionFactors.push({
    factor: "Above-fold CTA",
    score: 12,
    status: "Needs improvement",
    detail: "A CTA is visible above the fold on only one viewport.",
  });
} else {
  firstImpressionFactors.push({
    factor: "Above-fold CTA",
    score: 0,
    status: "Poor",
    detail: "No clear CTA is visible above the fold.",
  });
}

// -----------------------------------------------------
// 3. CTA WORDING
// -----------------------------------------------------

const strongCTA =
  /get started|start free|start now|try free|free trial|buy now|shop now|book a demo|request a demo|request demo|contact us|sign up|signup|request a quote/i;

const desktopPrimaryCTA =
  desktop.primaryCTA?.text || "";

const mobilePrimaryCTA =
  mobile.primaryCTA?.text || "";

const hasStrongCTA =
  strongCTA.test(desktopPrimaryCTA) ||
  strongCTA.test(mobilePrimaryCTA);

if (hasStrongCTA) {
  firstImpressionScore += 15;

  firstImpressionFactors.push({
    factor: "CTA wording",
    score: 15,
    status: "Good",
    detail: "The primary CTA uses action-oriented wording.",
  });
} else {
  firstImpressionFactors.push({
    factor: "CTA wording",
    score: 0,
    status: "Needs improvement",
    detail: "The primary CTA wording could be more action-oriented.",
  });
}

// -----------------------------------------------------
// 4. CTA HIERARCHY
// -----------------------------------------------------

const desktopPrimary = desktop.primaryCTA;
const mobilePrimary = mobile.primaryCTA;

if (desktopPrimary && mobilePrimary) {
  firstImpressionScore += 15;

  firstImpressionFactors.push({
    factor: "CTA hierarchy",
    score: 15,
    status: "Good",
    detail: "A primary CTA was identified on both desktop and mobile.",
  });
} else if (desktopPrimary || mobilePrimary) {
  firstImpressionScore += 7;

  firstImpressionFactors.push({
    factor: "CTA hierarchy",
    score: 7,
    status: "Needs improvement",
    detail: "A primary CTA was identified on only one viewport.",
  });
} else {
  firstImpressionFactors.push({
    factor: "CTA hierarchy",
    score: 0,
    status: "Poor",
    detail: "No primary CTA could be identified.",
  });
}

// -----------------------------------------------------
// 5. MOBILE EXPERIENCE
// -----------------------------------------------------

if (
  mobile.primaryH1 &&
  mobile.hasAboveFoldCTA &&
  mobile.primaryCTA
) {
  firstImpressionScore += 20;

  firstImpressionFactors.push({
    factor: "Mobile first impression",
    score: 20,
    status: "Good",
    detail: "The mobile viewport has a visible headline and CTA.",
  });
} else {
  firstImpressionFactors.push({
    factor: "Mobile first impression",
    score: 0,
    status: "Needs improvement",
    detail: "The mobile first impression is missing one or more important conversion elements.",
  });
}

firstImpressionScore = Math.max(
  0,
  Math.min(100, firstImpressionScore)
);

let firstImpressionGrade = "Poor";

if (firstImpressionScore >= 90) {
  firstImpressionGrade = "Excellent";
} else if (firstImpressionScore >= 75) {
  firstImpressionGrade = "Strong";
} else if (firstImpressionScore >= 60) {
  firstImpressionGrade = "Average";
} else if (firstImpressionScore >= 40) {
  firstImpressionGrade = "Weak";
}

const renderedHtml = await page.content();

const $ = cheerio.load(renderedHtml);

const screenshotName = `audit-${Date.now()}.png`;

await page.screenshot({
  path: path.join(screenshotDir, screenshotName),
  fullPage: true,
});

console.log("Screenshot saved:", screenshotName);

// =====================================================
// CTA INTERACTION TEST
// =====================================================

let ctaInteraction = {
  tested: false,
  clicked: false,
  success: false,
  ctaText: null,
  originalUrl: websiteUrl,
  destinationUrl: null,
  navigationOccurred: false,
  error: null,
};

let ctaJourney = {
  cta: {
    text: null,
    originalUrl: websiteUrl,
  },

  click: {
    tested: false,
    clicked: false,
    successful: false,
  },

  destination: {
    url: null,
    title: null,
    h1: null,
  },

  destinationElements: {
    forms: 0,
    inputs: 0,
    requiredInputs: 0,
    buttons: 0,
    visibleCTAs: [],
  },

  observations: [],
    score: null,
};

// Only test safe, non-destructive CTA actions.
const safeCTA =
  /get started|start free|start now|try free|free trial|learn more|book a demo|request a demo|request demo|contact us|request a quote|download|join now/i;

if (
  aboveFoldData.primaryCTA &&
  safeCTA.test(aboveFoldData.primaryCTA.text)
) {
  try {
    const primaryCTA = aboveFoldData.primaryCTA;

    ctaInteraction.tested = true;
    ctaInteraction.ctaText = primaryCTA.text;

    const targetHref = primaryCTA.href;

    // Find the exact CTA element on the rendered page.
    const matchingIndex = await page.locator("a").evaluateAll(
      (links, target) => {
        return links.findIndex(
          (link) => link.href === target
        );
      },
      targetHref
    );

    if (matchingIndex === -1) {
      throw new Error("Primary CTA element could not be located.");
    }

    const ctaElement = page.locator("a").nth(matchingIndex);

    const isVisible = await ctaElement.isVisible();

    if (!isVisible) {
      throw new Error("Primary CTA is not visible.");
    }

    // Remember the current URL before clicking.
    const beforeClickUrl = page.url();

    // Click the CTA.
    await ctaElement.click({
      timeout: 10000,
    });

    ctaInteraction.clicked = true;

    // Give navigation / client-side routing time to complete.
    await page.waitForTimeout(1500);

    const afterClickUrl = page.url();

    ctaInteraction.destinationUrl = afterClickUrl;

    ctaInteraction.navigationOccurred =
      afterClickUrl !== beforeClickUrl;

    // Check whether the resulting page has usable content.
    const destinationTitle = await page.title();

    ctaInteraction.destinationTitle = destinationTitle || null;

    ctaInteraction.success = true;

    // =====================================================
// CTA DESTINATION ANALYSIS
// =====================================================

const destinationAnalysis = {
  analyzed: false,
  title: null,
  h1: null,
  forms: 0,
  inputs: 0,
  requiredInputs: 0,
  buttons: 0,
  visibleCTAs: [],
  formFields: [],
  conversionFriction: [],
};

try {
  const destinationData = await page.evaluate(() => {
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight
      );
    };

    const getText = (element) =>
      element.innerText?.replace(/\s+/g, " ").trim() || "";

    const h1 =
      document.querySelector("h1");

    const visibleButtons = Array.from(
      document.querySelectorAll("button")
    )
      .filter(isVisible)
      .map(getText)
      .filter(Boolean);

    const visibleLinks = Array.from(
      document.querySelectorAll("a")
    )
      .filter(isVisible)
      .map(getText)
      .filter(Boolean);

    const ctaPattern =
      /\b(get started|start free|start now|try free|free trial|buy now|shop now|book a demo|request a demo|request demo|contact us|sign up|signup|continue|log in|login|submit|join now)\b/i;

    const visibleCTAs = [
      ...visibleButtons,
      ...visibleLinks,
    ].filter((text) => ctaPattern.test(text));

    // =====================================================
// CTA CANDIDATES FOR AI CLASSIFICATION
// =====================================================

const ctaCandidates = [
  ...Array.from(document.querySelectorAll("button")),
  ...Array.from(document.querySelectorAll("a")),
]
  .filter(isVisible)
  .map((element, index) => {
    const text = getText(element);

    if (!text) {
      return null;
    }

    const rect = element.getBoundingClientRect();

    const ariaLabel =
      element.getAttribute("aria-label") || "";

    const title =
      element.getAttribute("title") || "";

    const href =
      element.getAttribute("href") || "";

    const className =
      typeof element.className === "string"
        ? element.className
        : "";

    const parentText =
      element.parentElement?.innerText
        ?.replace(/\s+/g, " ")
        .trim()
        .slice(0, 300) || "";

    const nearbyHeading =
      element
        .closest("section, header, main, nav, footer")
        ?.querySelector("h1, h2, h3")
        ?.innerText
        ?.replace(/\s+/g, " ")
        .trim() || "";

    return {
      index,
      tag: element.tagName.toLowerCase(),
      text,
      href,
      ariaLabel,
      title,
      className,
      nearbyHeading,
      parentText,
      position: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      aboveFold: rect.top < window.innerHeight,
    };
  })
  .filter(Boolean);

    const forms = document.querySelectorAll("form").length;

    const inputElements = Array.from(
      document.querySelectorAll(
        "input, textarea, select"
      )
    );

const formFields = [];

for (const input of inputElements) {
  const type =
    (input.getAttribute("type") || "").toLowerCase();

  const name =
    (input.getAttribute("name") || "").toLowerCase();

  const placeholder =
    (input.getAttribute("placeholder") || "").toLowerCase();

  const id =
    (input.getAttribute("id") || "").toLowerCase();

  const ignoredTypes = [
    "hidden",
    "submit",
    "button",
    "checkbox",
    "radio",
    "file",
    "image",
    "reset",
  ];

  if (ignoredTypes.includes(type)) {
    continue;
  }

  const systemPattern =
    /cookie|consent|privacy|onetrust|vendor|search|filter|language|locale/i;

  if (
    systemPattern.test(name) ||
    systemPattern.test(id) ||
    systemPattern.test(placeholder)
  ) {
    continue;
  }

  formFields.push({
    type: input.getAttribute("type") || "text",
    name: input.getAttribute("name") || "",
    placeholder:
      input.getAttribute("placeholder") || "",
    required: input.required,
  });
}  

    return {
      title: document.title || null,
      h1: h1 ? getText(h1) : null,
      forms,
      inputs: formFields.length,
      requiredInputs: formFields.filter(
        (field) => field.required
      ).length,
      buttons: visibleButtons.length,
      visibleCTAs,
      formFields,
    };
  });

  destinationAnalysis.analyzed = true;
  destinationAnalysis.title = destinationData.title;
  destinationAnalysis.h1 = destinationData.h1;
  destinationAnalysis.forms = destinationData.forms;
  destinationAnalysis.inputs = destinationData.inputs;
  destinationAnalysis.requiredInputs =
    destinationData.requiredInputs;
  destinationAnalysis.buttons = destinationData.buttons;
  destinationAnalysis.visibleCTAs =
    destinationData.visibleCTAs;
  destinationAnalysis.formFields =
    destinationData.formFields;

  // ---------------------------------------------------
  // CONVERSION FRICTION
  // ---------------------------------------------------

  if (destinationData.forms > 0) {
    destinationAnalysis.conversionFriction.push(
      "Destination contains a form."
    );
  }

  if (destinationData.inputs >= 5) {
  destinationAnalysis.conversionFriction.push(
    "Destination contains several potential conversion fields."
  );
}

  if (destinationData.requiredInputs >= 3) {
    destinationAnalysis.conversionFriction.push(
      "Multiple required fields detected."
    );
  }

  if (
    destinationData.forms > 0 &&
    destinationData.inputs === 0
  ) {
    destinationAnalysis.conversionFriction.push(
      "Form detected but no standard input fields were found."
    );
  }

  console.log(
    "CTA destination analysis:",
    destinationAnalysis
  );

} catch (error) {
  destinationAnalysis.conversionFriction.push(
    `Destination analysis failed: ${error.message}`
  );

  console.log(
    "CTA destination analysis failed:",
    error.message
  );
}

ctaInteraction.destinationAnalysis =
  destinationAnalysis;

  // =====================================================
// CTA JOURNEY REPORT
// =====================================================

ctaJourney = {
  cta: {
    text: ctaInteraction.ctaText,
    originalUrl: ctaInteraction.originalUrl,
  },

  click: {
    tested: ctaInteraction.tested,
    clicked: ctaInteraction.clicked,
    successful: ctaInteraction.success,
  },

  destination: {
    url: ctaInteraction.destinationUrl,
    title: destinationAnalysis.title,
    h1: destinationAnalysis.h1,
  },

  destinationElements: {
    forms: destinationAnalysis.forms,
    inputs: destinationAnalysis.inputs,
    requiredInputs: destinationAnalysis.requiredInputs,
    buttons: destinationAnalysis.buttons,
    visibleCTAs: destinationAnalysis.visibleCTAs,
  },

  observations: [],
};

// =====================================================
// CTA JOURNEY OBSERVATIONS
// =====================================================

if (ctaInteraction.clicked) {
  ctaJourney.observations.push(
    "Primary CTA was successfully clicked."
  );
}

if (ctaInteraction.navigationOccurred) {
  ctaJourney.observations.push(
    "CTA click resulted in navigation to another page."
  );
}

if (
  ctaInteraction.destinationUrl &&
  ctaInteraction.destinationUrl !== ctaInteraction.originalUrl
) {
  ctaJourney.observations.push(
    "CTA leads to a different destination URL."
  );
}

if (destinationAnalysis.forms > 0) {
  ctaJourney.observations.push(
    "Destination contains a form."
  );
}

if (destinationAnalysis.inputs > 0) {
  ctaJourney.observations.push(
    `${destinationAnalysis.inputs} input field(s) detected on the destination.`
  );
}

if (destinationAnalysis.requiredInputs > 0) {
  ctaJourney.observations.push(
    `${destinationAnalysis.requiredInputs} required field(s) detected.`
  );
}

if (destinationAnalysis.visibleCTAs.length > 0) {
  ctaJourney.observations.push(
    "Additional CTA(s) detected on the destination."
  );
}

if (!destinationAnalysis.h1) {
  ctaJourney.observations.push(
    "No visible H1 heading was detected on the destination."
  );
}

// CTA JOURNEY SCORE

let ctaJourneyScore = 100;

if (!ctaInteraction.tested) {
  ctaJourneyScore -= 30;
}

if (!ctaInteraction.clicked) {
  ctaJourneyScore -= 30;
}

if (!ctaInteraction.success) {
  ctaJourneyScore -= 25;
}

if (!ctaInteraction.navigationOccurred) {
  ctaJourneyScore -= 15;
}

if (!destinationAnalysis.h1) {
  ctaJourneyScore -= 5;
}

if (destinationAnalysis.inputs >= 5) {
  ctaJourneyScore -= 10;
}

if (destinationAnalysis.requiredInputs >= 3) {
  ctaJourneyScore -= 10;
}

ctaJourneyScore = Math.max(
  0,
  Math.min(100, ctaJourneyScore)
);

ctaJourney.score = ctaJourneyScore;

console.log(
  "CTA Journey Score:",
  ctaJourney.score
);

    console.log(
      "CTA interaction test:",
      ctaInteraction
    );

  } catch (error) {
    ctaInteraction.error = error.message;

    console.log(
      "CTA interaction test failed:",
      error.message
    );
  }
} else {
  console.log(
    "CTA interaction test skipped: no safe primary CTA detected."
  );
}

await page.close();

    // =====================================================
    // BASIC DATA
    // =====================================================

    const title = $("title").text().trim();

    const h1Tags = $("h1");
    const h1 = h1Tags.first().text().trim();

    const metaDescription =
      $('meta[name="description"]').attr("content") || "";

    const links = $("a").length;
    const buttons = $("button").length;
    const forms = $("form").length;
    const images = $("img").length;

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
// =====================================================
// WEBSITE TYPE DETECTION
// =====================================================

const pageText = bodyText.toLowerCase();

let websiteType = "Other";

const saasSignals =
  /free trial|start free|book a demo|request demo|software|saas|ai work platform|work platform|workflow|workflows|automation|automate|dashboard|integrations|api|workspace|subscription|productivity tools/i;

const ecommerceSignals =
  /add to cart|buy now|shop now|shopping cart|checkout|shipping|quantity|product reviews|customer reviews|in stock|out of stock|cart/i;

const localBusinessSignals =
  /contact us|call us|opening hours|location|directions|appointment|book now|our services|service area/i;

const contentSignals =
  /blog|article|read more|author|published|newsletter|subscribe|category|latest posts/i;

if (saasSignals.test(pageText)) {
  websiteType = "SaaS / Software";
} else if (ecommerceSignals.test(pageText)) {
  websiteType = "E-commerce";
} else if (localBusinessSignals.test(pageText)) {
  websiteType = "Local Business";
} else if (contentSignals.test(pageText)) {
  websiteType = "Content / Blog";
}
    // =====================================================
    // CRO DATA
    // =====================================================

    const findings = [];

    // =====================================================
    // 1. TITLE
    // =====================================================

    if (!title) {
      findings.push({
        category: "SEO",
        severity: "High",
        issue: "Missing page title",
        recommendation:
          "Add a clear page title that explains what the page offers.",
      });
    } else if (title.length < 30) {
      findings.push({
        category: "SEO",
        severity: "Medium",
        issue: "Page title may be too short",
        recommendation:
          "Consider using a more descriptive title that communicates the page's value.",
      });
    } else if (title.length > 65) {
      findings.push({
        category: "SEO",
        severity: "Medium",
        issue: "Page title may be too long",
        recommendation:
          "Shorten the title so the main message is easier to understand.",
      });
    } else {
      findings.push({
        category: "SEO",
        severity: "Good",
        issue: "Page title looks healthy",
        recommendation: "No immediate action required.",
      });
    }

    // =====================================================
    // 2. META DESCRIPTION
    // =====================================================

    if (!metaDescription) {
      findings.push({
        category: "SEO",
        severity: "Medium",
        issue: "Missing meta description",
        recommendation:
          "Add a concise description explaining the page's value.",
      });
    } else if (metaDescription.length < 70) {
      findings.push({
        category: "SEO",
        severity: "Medium",
        issue: "Meta description may be too short",
        recommendation:
          "Expand the description to communicate the page's value more clearly.",
      });
    } else {
      findings.push({
        category: "SEO",
        severity: "Good",
        issue: "Meta description detected",
        recommendation: "No immediate action required.",
      });
    }

    // =====================================================
    // 3. H1
    // =====================================================

    if (h1Tags.length === 0) {
      findings.push({
        category: "Content",
        severity: "High",
        issue: "Missing H1 heading",
        recommendation:
          "Add one clear primary headline explaining what the page offers.",
      });
    } else if (h1Tags.length > 1) {
      findings.push({
        category: "Content",
        severity: "Medium",
        issue: "Multiple H1 headings detected",
        recommendation:
          "Use one primary H1 and organize supporting content with H2/H3 headings.",
      });
    } else {
      findings.push({
        category: "Content",
        severity: "Good",
        issue: "Primary H1 heading detected",
        recommendation: "No immediate action required.",
      });
    }

    // =====================================================
    // 4. CTA BUTTONS
    // =====================================================

    const buttonTexts = [];

    $("button").each(function () {
      const text = $(this).text().replace(/\s+/g, " ").trim();

      if (text) {
        buttonTexts.push(text);
      }
    });

    const ctaWords =
  /\b(buy now|shop now|get started|start free|start now|try free|free trial|book a demo|request demo|contact us|sign up|signup|subscribe|request a quote|download|join now)\b/i;

    const ctaButtons = buttonTexts.filter((text) =>
      ctaWords.test(text)
    );

    // =====================================================
    // 5. CTA LINKS
    // =====================================================

    const linkTexts = [];

    $("a").each(function () {
      const text = $(this).text().replace(/\s+/g, " ").trim();

      if (text) {
        linkTexts.push(text);
      }
    });

    const ctaLinks = linkTexts.filter((text) =>
      ctaWords.test(text)
    );

    const totalCTAs = ctaButtons.length + ctaLinks.length;

    if (totalCTAs === 0) {
      findings.push({
        category: "Conversion",
        severity: "High",
        croImpact: "High",
        issue: "No clear call-to-action detected",
        recommendation:
          "Add a prominent CTA such as Start Free Trial, Get Started, Book a Demo, or Contact Us.",
      });
    } else if (totalCTAs === 1) {
      findings.push({
        category: "Conversion",
        severity: "Medium",
        croImpact: "Medium",
        issue: "Only one clear CTA detected",
        recommendation:
          "Consider reinforcing the primary conversion action in important sections of the page.",
      });
    } else {
      findings.push({
        category: "Conversion",
        severity: "Good",
        croImpact: "High",
        issue: "Clear call-to-action elements detected",
        recommendation:
          "Review CTA placement and wording to maximize conversions.",
      });
    }

    // =====================================================
    // 6. CTA WORDING
    // =====================================================

    if (totalCTAs > 0) {
      const genericCTA =
        /click here|submit|button|more info|learn/i;

      const genericCount = [...ctaButtons, ...ctaLinks].filter(
        (text) => genericCTA.test(text)
      ).length;

      if (genericCount > 0) {
        findings.push({
          category: "Conversion",
          severity: "Medium",
          croImpact: "Medium",
          issue: "Some CTA wording is generic",
          recommendation:
            "Use action-oriented CTA copy that communicates the benefit or next step.",
        });
      } else {
        findings.push({
          category: "Conversion",
          severity: "Good",
          croImpact: "High",
          issue: "CTA wording appears action-oriented",
          recommendation: "Continue testing CTA wording for higher conversion rates.",
        });
      }
    }

    // =====================================================
    // 7. FORMS
    // =====================================================

    if (forms === 0) {
      findings.push({
        category: "Lead Generation",
        severity: "Medium",
        croImpact: "None",
        issue: "No forms detected",
        recommendation:
          "If lead generation is a goal, consider adding a simple contact or signup form.",
      });
    } else {
      findings.push({
        category: "Lead Generation",
        severity: "Good",
        croImpact: "Medium",
        issue: "Form detected",
        recommendation:
          "Keep the form focused and minimize unnecessary fields.",
      });
    }

    // =====================================================
    // 8. FORM LABELS
    // =====================================================

    let inputs = 0;
    let inputsWithoutLabels = 0;

    $("input, textarea, select").each(function () {
      const type = ($(this).attr("type") || "").toLowerCase();

      if (type === "hidden" || type === "submit" || type === "button") {
        return;
      }

      inputs++;

      const id = $(this).attr("id");

      const hasLabel =
        id && $(`label[for="${id}"]`).length > 0;

      const hasAriaLabel =
        $(this).attr("aria-label");

      if (!hasLabel && !hasAriaLabel) {
        inputsWithoutLabels++;
      }
    });

    if (inputs > 0 && inputsWithoutLabels > 0) {
      findings.push({
        category: "UX",
        severity: "Medium",
          croImpact: "Low",
        issue: `${inputsWithoutLabels} form field(s) may be missing labels`,
        recommendation:
          "Add clear labels or accessible names to form fields.",
      });
    } else if (inputs > 0) {
      findings.push({
        category: "UX",
        severity: "Good",
        croImpact: "Low",
        issue: "Form fields appear to have labels",
        recommendation: "Continue keeping form fields clear and understandable.",
      });
    }

    // =====================================================
    // 9. IMAGES / ALT TEXT
    // =====================================================

    let imagesWithoutAlt = 0;

    $("img").each(function () {
      const alt = $(this).attr("alt");

      if (alt === undefined || alt.trim() === "") {
        imagesWithoutAlt++;
      }
    });

    if (imagesWithoutAlt > 0) {
      findings.push({
        category: "Accessibility",
        severity: "Medium",
        croImpact: "Low",
        issue: `${imagesWithoutAlt} image(s) missing alt text`,
        recommendation:
          "Add descriptive alt text to meaningful images.",
      });
    } else if (images > 0) {
      findings.push({
        category: "Accessibility",
        severity: "Good",
        issue: "Images contain alt text",
        recommendation: "No immediate action required.",
      });
    }

    // =====================================================
    // 10. EMPTY LINKS
    // =====================================================

    let emptyLinks = 0;

    $("a").each(function () {
      const text = $(this).text().replace(/\s+/g, " ").trim();
      const ariaLabel = $(this).attr("aria-label");
      const titleAttr = $(this).attr("title");

      if (!text && !ariaLabel && !titleAttr) {
        emptyLinks++;
      }
    });

    if (emptyLinks > 0) {
      findings.push({
        category: "UX",
        severity: "Medium",
        croImpact: "Low",
        issue: `${emptyLinks} link(s) have no visible text`,
        recommendation:
          "Add descriptive text or accessible labels to links.",
      });
    }

    // =====================================================
    // 11. PHONE NUMBER
    // =====================================================

    const phonePattern =
      /(\+?\d[\d\s().-]{7,}\d)/;

    const hasPhone = phonePattern.test(bodyText);

    if (hasPhone) {
      findings.push({
        category: "Trust",
        severity: "Good",
        croImpact: "Medium",
        issue: "Phone/contact number detected",
        recommendation:
          "Keep contact information easy to find for users who need assistance.",
      });
    } else {
      findings.push({
        category: "Trust",
        severity: "Medium",
        croImpact: "Medium",
        issue: "No obvious phone number detected",
        recommendation:
          "If customer support is important, consider making contact information easier to find.",
      });
    }

    // =====================================================
    // 12. EMAIL
    // =====================================================

    const emailPattern =
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

    const hasEmail = emailPattern.test(bodyText);

    if (hasEmail) {
      findings.push({
        category: "Trust",
        severity: "Good",
        croImpact: "Medium",
        issue: "Email contact detected",
        recommendation:
          "Keep customer contact information accessible.",
      });
    }

    // =====================================================
    // 13. NAVIGATION
    // =====================================================

    const navLinks = $("nav a").length;

    if (navLinks > 12) {
      findings.push({
        category: "UX",
        severity: "Medium",
        croImpact: "Low",
        issue: "Navigation contains many links",
        recommendation:
          "Consider simplifying navigation so users can reach important actions faster.",
      });
    } else if (navLinks > 0) {
      findings.push({
        category: "UX",
        severity: "Good",
        croImpact: "Low",
        issue: "Navigation detected",
        recommendation:
          "Keep navigation focused on the most important destinations.",
      });
    }

    // =====================================================
    // 14. SOCIAL PROOF
    // =====================================================

    const socialProofPattern =
      /testimonial|testimonials|review|reviews|rating|ratings|customer stories|case stud(y|ies)|trusted by/i;

    const hasSocialProof =
      socialProofPattern.test(bodyText);

    if (hasSocialProof) {
      findings.push({
        category: "Trust",
        severity: "Good",
        croImpact: "Medium",
        issue: "Social proof signals detected",
        recommendation:
          "Continue highlighting authentic reviews, results, or customer stories.",
      });
    } else {
      findings.push({
        category: "Trust",
        severity: "Medium",
        croImpact: "Medium",
        issue: "Limited social proof detected",
        recommendation:
          "Consider adding testimonials, reviews, case studies, ratings, or customer results.",
      });
    }

    // =====================================================
    // 15. VALUE PROPOSITION
    // =====================================================

    const valueWords =
      /save|grow|increase|reduce|fast|easy|simple|secure|affordable|free|solution|help|benefit/i;

    const hasValueLanguage =
      valueWords.test(bodyText);

    if (hasValueLanguage) {
      findings.push({
        category: "Messaging",
        severity: "Good",
        croImpact: "High",
        issue: "Value-oriented language detected",
        recommendation:
          "Make sure the strongest benefit is visible near the primary headline.",
      });
    } else {
      findings.push({
        category: "Messaging",
        severity: "Medium",
        croImpact: "High",
        issue: "Limited value proposition signals detected",
        recommendation:
          "Clearly communicate the main benefit users receive from your product or service.",
      });
    }

    // =====================================================
    // 16. EXTERNAL LINKS
    // =====================================================

    let externalLinks = 0;

    let currentHost = "";

    try {
      currentHost = new URL(websiteUrl).hostname;
    } catch (error) {
      currentHost = "";
    }

    $("a[href]").each(function () {
      const href = $(this).attr("href");

      try {
        const linkUrl = new URL(href, websiteUrl);

        if (
          linkUrl.hostname &&
          currentHost &&
          linkUrl.hostname !== currentHost
        ) {
          externalLinks++;
        }
      } catch (error) {
        // Ignore invalid URLs
      }
    });

    if (externalLinks > 20) {
      findings.push({
        category: "UX",
        severity: "Medium",
        croImpact: "Low",
        issue: "Large number of external links detected",
        recommendation:
          "Review whether external links distract users from the main conversion goal.",
      });
    }

    // =====================================================
    // 17. CONTACT PAGE SIGNAL
    // =====================================================

    const contactLink = $("a").filter(function () {
      const text = $(this).text().toLowerCase();

      const href = ($(this).attr("href") || "").toLowerCase();

      return (
        text.includes("contact") ||
        href.includes("contact")
      );
    }).length;

    if (contactLink > 0) {
      findings.push({
        category: "Trust",
        severity: "Good",
        croImpact: "Medium",
        issue: "Contact option detected",
        recommendation:
          "Keep the contact path easy to find and straightforward.",
      });
    }

    // =====================================================
    // 18. CONTENT LENGTH
    // =====================================================

    const wordCount = bodyText
      .split(/\s+/)
      .filter(Boolean).length;

    if (wordCount < 100) {
      findings.push({
        category: "Content",
        severity: "Medium",
        croImpact: "Medium",
        issue: "Very little visible page content detected",
        recommendation:
          "Make sure visitors have enough information to understand the offer and make a decision.",
      });
    }

    // =====================================================
    // 19. HTTPS
    // =====================================================

    if (websiteUrl.startsWith("https://")) {
      findings.push({
        category: "Security",
        severity: "Good",
        issue: "HTTPS detected",
        recommendation:
          "Continue serving the website securely over HTTPS.",
      });
    } else {
      findings.push({
        category: "Security",
        severity: "High",
        issue: "Website is not using HTTPS",
        recommendation:
          "Use HTTPS to protect users and establish trust.",
      });
    }

    // =====================================================
    // 20. SCORE
    // =====================================================

// =====================================================
// SMART SCORE
// =====================================================

// =====================================================
// SMART CRO SCORE
// =====================================================

// =====================================================
// CRO SCORE
// =====================================================

// Only these categories directly affect the CRO score.
// SEO, Accessibility, Security, etc. can still appear
// in the report without lowering the CRO score.

const croCategories = [
  "Conversion",
  "Messaging",
  "Trust",
  "Lead Generation",
  "UX",
  "Content",
];

const croFindings = findings.filter((finding) =>
  croCategories.includes(finding.category)
);

let croPoints = 0;
let croMaxPoints = 0;

croFindings.forEach((finding) => {
  const impact = finding.croImpact;

  if (!impact || impact === "None") {

    return;
  }

  const impactWeight = {
    High: 3,
    Medium: 2,
    Low: 1,
    None: 0,
  };

  const weight = impactWeight[impact] || 1;

  croMaxPoints += weight;

  if (finding.severity === "Good") {
    croPoints += weight;
  } else if (finding.severity === "Medium") {
    croPoints += weight * 0.5;
  }
});

// If there are no CRO findings, give a neutral score.
let score = 50;

if (croMaxPoints > 0) {
  score = Math.round((croPoints / croMaxPoints) * 100);
}

score = Math.max(0, Math.min(100, score));

// =====================================================
// CATEGORY SCORES
// =====================================================

const categoryScores = {};

const croCategoriesForScore = [
  "Conversion",
  "Messaging",
  "Trust",
  "UX",
  "Lead Generation",
  "Content",
];


// =====================================================
// UNIFIED CRO EVIDENCE
// =====================================================

const croEvidence = {
  website: {
    url: websiteUrl,
    type: websiteType,
    title,
    h1,
    metaDescription,
  },

  desktop: {
    aboveFold: aboveFoldData,
  },

  mobile: {
    aboveFold: mobileAboveFoldData,
  },

  firstImpression: {
    score: firstImpressionScore,
    grade: firstImpressionGrade,
    factors: firstImpressionFactors,
  },

  conversion: {
    ctaInteraction,
    ctaJourney,
  },

  technical: {
    links,
    buttons,
    forms,
    images,
    imagesWithoutAlt,
    inputs,
    inputsWithoutLabels,
    externalLinks,
    wordCount,
  },

  existingChecks: {
    findings,
    score,
    categoryScores,
  },
};

console.log(
  "CRO EVIDENCE PACKAGE CREATED:",
  Object.keys(croEvidence)
);

// =====================================================
// MAIN AI CRO ANALYSIS
// =====================================================

let aiCROReport = null;

try {
  console.log("Sending CRO evidence to Gemini...");

  aiCROReport = await analyzeWithGemini(croEvidence);

  console.log("Gemini CRO analysis completed.");

  console.log(
    "AI CRO Score:",
    aiCROReport.overallScore
  );

  console.log(
  "AI CRO REPORT:",
  JSON.stringify(aiCROReport, null, 2)
);

} catch (error) {
  console.error(
    "Gemini CRO analysis failed:",
    error.message
  );
}

croCategoriesForScore.forEach((category) => {
  const categoryFindings = findings.filter(
    (finding) =>
      finding.category === category &&
      finding.croImpact &&
      finding.croImpact !== "None"
  );

  let possible = 0;
  let earned = 0;

  categoryFindings.forEach((finding) => {
    const weight =
      {
        High: 3,
        Medium: 2,
        Low: 1,
      }[finding.croImpact] || 1;

    possible += weight;

    if (finding.severity === "Good") {
      earned += weight;
    } else if (finding.severity === "Medium") {
      earned += weight * 0.75;
    } else if (finding.severity === "High") {
      earned += 0;
    }
  });

  categoryScores[category] =
    possible > 0
      ? Math.round((earned / possible) * 100)
      : null;
});

    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    console.log("Website analyzed successfully.");
    console.log("CRO Score:", score);
    console.log("Findings:", findings.length);

    res.json({
      success: true,
      websiteUrl,

      analysis: {
        score,
        categoryScores,
          croEvidence,
          aiCROReport,

        overview: {
  websiteType,
  title,
  h1,
  metaDescription,
  screenshot: `/screenshots/${screenshotName}`,
  mobileScreenshot: `/screenshots/${mobileScreenshotName}`,

  firstImpression: {
  score: firstImpressionScore,
  grade: firstImpressionGrade,
  factors: firstImpressionFactors,
},

  aboveFold: {
  desktop: aboveFoldData,
  mobile: mobileAboveFoldData,
},

ctaInteraction,
ctaJourney,

  links,
  buttons,
  forms,
  images,
  imagesWithoutAlt,
  inputs,
  inputsWithoutLabels,
  ctaButtons: ctaButtons.length,
  ctaLinks: ctaLinks.length,
  externalLinks,
  wordCount,
},

        findings,
      },
    });
  } catch (error) {
    console.error("Website analysis failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not fetch or analyze this website.",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
