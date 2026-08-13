const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

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
    console.log("Fetching website:", websiteUrl);

    const response = await axios.get(websiteUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(response.data);

    const title = $("title").text().trim();
    const h1 = $("h1").first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content") || "";

    const links = $("a").length;
    const buttons = $("button").length;
    const forms = $("form").length;
    const images = $("img").length;

    console.log("Website analyzed successfully.");

    res.json({
      success: true,
      websiteUrl,
      analysis: {
        title,
        h1,
        metaDescription,
        links,
        buttons,
        forms,
        images,
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