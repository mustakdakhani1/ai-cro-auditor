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

  const findings = analysis?.findings || [];

  const highIssues = findings.filter(
    (finding) => finding.severity === "High"
  );

  const mediumIssues = findings.filter(
    (finding) => finding.severity === "Medium"
  );

  const goodIssues = findings.filter(
    (finding) => finding.severity === "Good"
  );

  if (showResults) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="logo">AI CRO Auditor</div>

          <button
            className="login-btn"
            onClick={() => {
              setShowResults(false);
              setAnalysis(null);
            }}
          >
            New Audit
          </button>
        </nav>

        <main className="results-page">
          <p className="analyzed-url">
            Audit report for: <strong>{websiteUrl}</strong>
          </p>


          <div className="website-type">
           Website Type: <strong>{analysis?.overview?.websiteType || "Other"}</strong>
          </div>


          {/* CRO SCORE */}

          <div className="score-card">
            <div>
              <p className="score-label">Overall CRO Score</p>

              <div className="score">
                {analysis?.score ?? 0}
                <span>/100</span>
              </div>
            </div>

            <div className="score-message">
              <strong>
                {analysis?.score >= 80
                  ? "Great website!"
                  : analysis?.score >= 60
                  ? "Good, but there is room to improve."
                  : "Several improvements are needed."}
              </strong>

              <p>
                Our audit found {findings.length} areas that can help improve
                your website's conversion experience.
              </p>
            </div>
          </div>

          {/* WEBSITE DATA */}

          <section className="audit-section">
            <h2>Website Analysis</h2>

            <div className="analysis-grid">
              <div className="analysis-item">
                <span>Page Title</span>
                <strong>{analysis?.overview?.title || "Not found"}</strong>
              </div>

              <div className="analysis-item">
                <span>H1 Headline</span>
                <strong>{analysis?.overview?.h1 || "Not found"}</strong>
              </div>

              <div className="analysis-item">
                <span>Meta Description</span>
                <strong>
                  {analysis?.overview?.metaDescription || "Not found"}
                </strong>
              </div>

              <div className="analysis-item">
                <span>Links</span>
                <strong>{analysis?.overview?.links ?? 0}</strong>
              </div>

              <div className="analysis-item">
                <span>Buttons</span>
                <strong>{analysis?.overview?.buttons ?? 0}</strong>
              </div>

              <div className="analysis-item">
                <span>Forms</span>
                <strong>{analysis?.overview?.forms ?? 0}</strong>
              </div>

              <div className="analysis-item">
                <span>Images</span>
                <strong>{analysis?.overview?.images ?? 0}</strong>
              </div>

              <div className="analysis-item">
                <span>Images Missing Alt</span>
                <strong>
                  {analysis?.overview?.imagesWithoutAlt ?? 0}
                </strong>
              </div>
            </div>
          </section>

                    {/* CRO BREAKDOWN */}

          <section className="audit-section">
            <h2>CRO Breakdown</h2>

            <div className="analysis-grid">
              {Object.entries(analysis?.categoryScores || {}).map(
                ([category, score]) => (
                  <div className="analysis-item" key={category}>
                    <span>{category}</span>
                    <strong>{score === null ? "N/A" : `${score}/100`}</strong>
                  </div>
                )
              )}
            </div>
          </section>

          {/* AUDIT SUMMARY */}

          <section className="audit-section">
            <h2>Audit Summary</h2>

            <div className="issues-grid">
              <div className="issue-card critical">
                <div className="issue-header">
                  <span>🔴</span>
                  <strong>High Priority</strong>
                </div>

                <div className="issue-number">
                  {highIssues.length}
                </div>

                <p>
                  Issues that may significantly affect the website.
                </p>
              </div>

              <div className="issue-card warning">
                <div className="issue-header">
                  <span>🟠</span>
                  <strong>Opportunities</strong>
                </div>

                <div className="issue-number">
                  {mediumIssues.length}
                </div>

                <p>
                  Potential improvements worth addressing.
                </p>
              </div>

              <div className="issue-card success">
                <div className="issue-header">
                  <span>🟢</span>
                  <strong>What's Working</strong>
                </div>

                <div className="issue-number">
                  {goodIssues.length}
                </div>

                <p>
                  Elements that are already passing our checks.
                </p>
              </div>
            </div>
          </section>

          {/* FINDINGS */}

          <section className="audit-section">
            <h2>Audit Findings</h2>

            {findings.map((finding, index) => (
              <div className="recommendation" key={index}>
                <div className="recommendation-number">
                  {index + 1}
                </div>

                <div>
                  <p>
                    <strong>{finding.category}</strong>
                  </p>

                  <h3>{finding.issue}</h3>

                  <p>{finding.recommendation}</p>
                </div>

                <span
                  className={`priority ${finding.severity.toLowerCase()}`}
                >
                  {finding.severity}
                </span>
              </div>
            ))}
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