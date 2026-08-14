const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const app = express();

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
    });
  }

  return browser;
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

const renderedHtml = await page.content();

const $ = cheerio.load(renderedHtml);

const screenshotName = `audit-${Date.now()}.png`;

await page.screenshot({
  path: path.join(screenshotDir, screenshotName),
  fullPage: true,
});

console.log("Screenshot saved:", screenshotName);

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
        overview: {
  websiteType,
  title,
  h1,
  metaDescription,
  screenshot: `/screenshots/${screenshotName}`,
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