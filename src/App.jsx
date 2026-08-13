import { useState } from "react";

function App() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState(null);

const handleAnalyze = async () => {
  if (!websiteUrl.trim()) {
    alert("Please enter a website URL.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        websiteUrl: websiteUrl,
      }),
    });

const data = await response.json();

console.log("Backend response:", data);

if (!data.success) {
  alert(data.message);
  return;
}

setAnalysis(data.analysis);
setShowResults(true);

  } catch (error) {
    console.error("Error connecting to backend:", error);
    alert("Could not connect to the backend.");
  }
};

  if (showResults) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="logo">AI CRO Auditor</div>

          <button
            className="login-btn"
            onClick={() => setShowResults(false)}
          >
            New Audit
          </button>
        </nav>

        <main className="results-page">
          <p className="analyzed-url">
            Audit report for: <strong>{websiteUrl}</strong>
          </p>
          <div className="real-analysis">
  <h2>Website Analysis</h2>

  <div className="analysis-grid">
    <div className="analysis-item">
      <span>Page Title</span>
      <strong>{analysis?.title || "Not found"}</strong>
    </div>

    <div className="analysis-item">
      <span>H1 Headline</span>
      <strong>{analysis?.h1 || "Not found"}</strong>
    </div>

    <div className="analysis-item">
      <span>Meta Description</span>
      <strong>
        {analysis?.metaDescription || "Not found"}
      </strong>
    </div>

    <div className="analysis-item">
      <span>Links</span>
      <strong>{analysis?.links ?? 0}</strong>
    </div>

    <div className="analysis-item">
      <span>Buttons</span>
      <strong>{analysis?.buttons ?? 0}</strong>
    </div>

    <div className="analysis-item">
      <span>Forms</span>
      <strong>{analysis?.forms ?? 0}</strong>
    </div>

    <div className="analysis-item">
      <span>Images</span>
      <strong>{analysis?.images ?? 0}</strong>
    </div>
  </div>
</div>

          <h1>Conversion Audit</h1>

          <div className="score-card">
            <div>
              <p className="score-label">Overall CRO Score</p>
              <div className="score">72<span>/100</span></div>
            </div>

            <div className="score-message">
              <strong>Good, but there is room to improve.</strong>
              <p>
                We found several opportunities that could improve
                conversions and user experience.
              </p>
            </div>
          </div>

          <section className="audit-section">
            <h2>Audit Summary</h2>

            <div className="issues-grid">
              <div className="issue-card critical">
                <div className="issue-header">
                  <span>🔴</span>
                  <strong>Critical Issues</strong>
                </div>
                <div className="issue-number">3</div>
                <p>Issues that may significantly affect conversions.</p>
              </div>

              <div className="issue-card warning">
                <div className="issue-header">
                  <span>🟠</span>
                  <strong>Opportunities</strong>
                </div>
                <div className="issue-number">7</div>
                <p>Potential improvements worth testing.</p>
              </div>

              <div className="issue-card success">
                <div className="issue-header">
                  <span>🟢</span>
                  <strong>What's Working</strong>
                </div>
                <div className="issue-number">12</div>
                <p>Elements that are already helping the experience.</p>
              </div>
            </div>
          </section>

          <section className="audit-section">
            <h2>Top Recommendations</h2>

            <div className="recommendation">
              <div className="recommendation-number">1</div>
              <div>
                <h3>Make the primary CTA more prominent</h3>
                <p>
                  Your main conversion action should be visually stronger
                  and easier to identify above the fold.
                </p>
              </div>
              <span className="priority high">High</span>
            </div>

            <div className="recommendation">
              <div className="recommendation-number">2</div>
              <div>
                <h3>Improve headline clarity</h3>
                <p>
                  Make the value proposition immediately understandable
                  for first-time visitors.
                </p>
              </div>
              <span className="priority medium">Medium</span>
            </div>

            <div className="recommendation">
              <div className="recommendation-number">3</div>
              <div>
                <h3>Add stronger social proof</h3>
                <p>
                  Customer reviews, results, or trust signals can reduce
                  hesitation before conversion.
                </p>
              </div>
              <span className="priority medium">Medium</span>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">AI CRO Auditor</div>
        <button className="login-btn">Log in</button>
      </nav>

      <main className="hero">
        <div className="badge">
          ✦ AI-Powered Conversion Optimization
        </div>

        <h1>
          Find out why your website
          <span> isn't converting.</span>
        </h1>

        <p className="subtitle">
          AI analyzes your website and identifies conversion problems,
          UX issues, and opportunities to increase your sales.
        </p>

        <div className="url-box">
          <input
            type="text"
            placeholder="https://yourwebsite.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />

          <button onClick={handleAnalyze}>
            Analyze Website →
          </button>
        </div>

        <p className="note">
          No credit card required • Get your first audit in minutes
        </p>
      </main>
    </div>
  );
}

export default App;