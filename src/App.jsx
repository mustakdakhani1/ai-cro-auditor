import { useState } from "react";
import "./App.css";

function App() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      alert("Please enter a website URL.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
        }),
      });

      const data = await response.json();

      console.log("Backend response:", data);
      console.log("AI CRO Report:", data.analysis?.aiCROReport);

      if (!data.success) {
        alert(data.message || "Analysis failed.");
        return;
      }

      setAnalysis(data.analysis);
      setShowResults(true);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const findings = analysis?.findings || [];
  const aiCROReport = analysis?.aiCROReport || null;

  const highIssues = findings.filter(
    (finding) => finding.severity === "High"
  );

  const mediumIssues = findings.filter(
    (finding) => finding.severity === "Medium"
  );

  const goodIssues = findings.filter(
    (finding) => finding.severity === "Good"
  );

  const aiCategories = [
    ["First Impression", aiCROReport?.firstImpression],
    ["Conversion", aiCROReport?.conversion],
    ["Messaging", aiCROReport?.messaging],
    ["UX", aiCROReport?.ux],
    ["Trust", aiCROReport?.trust],
    ["Lead Generation", aiCROReport?.leadGeneration],
    ["Content", aiCROReport?.content],
  ];

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
            Website Type:{" "}
            <strong>{analysis?.overview?.websiteType || "Other"}</strong>
          </div>

          {/* RULE ENGINE SCORE */}

          <section className="score-card">
            <div className="score-container">
              <div
                className="score-circle"
                style={{
                  "--score": `${analysis?.score ?? 0}%`,
                }}
              >
                <div className="score-circle-inner">
                  <div className="score">{analysis?.score ?? 0}</div>
                  <span>/100</span>
                </div>
              </div>

              <p className="score-label">Evidence / Rule Score</p>
            </div>

            <div className="score-message">
              <strong>
                {analysis?.score >= 80
                  ? "Strong technical CRO foundation."
                  : analysis?.score >= 60
                  ? "Good foundation, with room to improve."
                  : "Several improvements are needed."}
              </strong>

              <p>
                The deterministic audit found {findings.length} areas that
                can affect the website's conversion experience.
              </p>
            </div>
          </section>

          {/* AI CRO DASHBOARD */}

          {aiCROReport ? (
            <section className="ai-dashboard">
              <div className="ai-dashboard-header">
                <div>
                  <div className="ai-badge">✦ AI CRO ANALYSIS</div>

                  <h2>Your website's conversion health</h2>

                  <p>
                    AI interpretation based on browser-rendered evidence,
                    desktop/mobile observations, and conversion signals.
                  </p>
                </div>
              </div>

              {/* AI SCORE */}

              <div className="ai-hero-card">
                <div className="ai-score-panel">
                  <div
                    className="ai-score-ring"
                    style={{
                      "--ai-score": `${aiCROReport.overallScore ?? 0}`,
                    }}
                  >
                    <div className="ai-score-ring-inner">
                      <strong>{aiCROReport.overallScore ?? "—"}</strong>
                      <span>/100</span>
                    </div>
                  </div>

                  <div className="ai-score-label">AI CRO SCORE</div>

                  <div className="ai-grade">
                    {aiCROReport.grade || "Not available"}
                  </div>
                </div>

                <div className="ai-summary-panel">
                  <span className="ai-summary-label">
                    EXECUTIVE SUMMARY
                  </span>

                  <h3>
                    {aiCROReport.executiveSummary?.headline ||
                      "AI analysis completed"}
                  </h3>

                  <p>
                    {aiCROReport.executiveSummary?.summary ||
                      "The AI analyst did not provide an executive summary."}
                  </p>
                </div>
              </div>

              {/* PRIORITY ACTIONS */}

              {aiCROReport.priorityActions?.length > 0 && (
                <div className="ai-priority-section">
                  <div className="ai-section-heading">
                    <div>
                      <span>WHAT TO FIX FIRST</span>
                      <h3>Top conversion opportunities</h3>
                    </div>

                    <div className="ai-priority-count">
                      {aiCROReport.priorityActions.length} priorities
                    </div>
                  </div>

                  <div className="ai-priority-list">
                    {aiCROReport.priorityActions.map((action, index) => (
                      <article
                        className="ai-priority-card"
                        key={`${action.priority ?? index}-${action.issue ?? index}`}
                      >
                        <div className="ai-priority-number">
                          {String(action.priority ?? index + 1).padStart(2, "0")}
                        </div>

                        <div className="ai-priority-content">
                          <div className="ai-priority-top">
                            <span className="ai-priority-category">
                              PRIORITY {action.priority ?? index + 1}
                            </span>

                            <span
                              className={`ai-impact ${(action.expectedImpact || "medium").toLowerCase()}`}
                            >
                              {action.expectedImpact || "Medium"}
                            </span>
                          </div>

                          <h4>
                            {action.issue || "Conversion opportunity"}
                          </h4>

                          <p className="ai-why">
                            {action.whyItMatters ||
                              "The evidence suggests this area deserves review."}
                          </p>

                          <div className="ai-recommendation">
                            <span>→</span>

                            <div>
                              <strong>Recommended action</strong>
                              <p>
                                {action.recommendation ||
                                  "Review this area using the supporting evidence."}
                              </p>
                            </div>
                          </div>

                          {action.evidence?.length > 0 && (
                            <div className="ai-evidence-box">
                              <div className="ai-evidence-title">
                                <span>●</span>
                                Evidence
                              </div>

                              <div className="ai-evidence-list">
                                {action.evidence.map((item, evidenceIndex) => (
                                  <span
                                    key={evidenceIndex}
                                    className="ai-evidence-chip"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* AI CATEGORY BREAKDOWN */}

              <div className="ai-category-section">
                <div className="ai-section-heading">
                  <div>
                    <span>AI ASSESSMENT</span>
                    <h3>Conversion health by category</h3>
                  </div>
                </div>

                <div className="ai-category-grid">
                  {aiCategories.map(([name, data]) => {
                    const score =
                      typeof data?.score === "number" ? data.score : null;

                    return (
                      <article className="ai-category-card" key={name}>
                        <div className="ai-category-top">
                          <span>{name}</span>
                          <strong>
                            {score === null ? "—" : `${score}/100`}
                          </strong>
                        </div>

                        <div className="ai-category-bar">
                          <div
                            style={{
                              width: `${score ?? 0}%`,
                            }}
                          />
                        </div>

                        <p>
                          {data?.assessment ||
                            "Evidence is insufficient to determine this."}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : (
            <section className="ai-unavailable">
              <div className="ai-unavailable-icon">✦</div>
              <div>
                <h3>AI CRO analysis unavailable</h3>
                <p>
                  The browser evidence and rule-based audit are available,
                  but Gemini did not return an AI report for this run.
                </p>
              </div>
            </section>
          )}

          {/* FIRST IMPRESSION */}

          <section className="audit-section">
            <h2>First Impression</h2>

            <div className="issues-grid">
              <div className="issue-card success">
                <div className="issue-header">
                  <span>👀</span>
                  <strong>First Impression Score</strong>
                </div>

                <div className="issue-number">
                  {analysis?.overview?.firstImpression?.score ?? "N/A"}/100
                </div>

                <p>
                  {analysis?.overview?.firstImpression?.grade ||
                    "Not available"}
                </p>
              </div>

              <div className="issue-card">
                <div className="issue-header">
                  <span>🖥️</span>
                  <strong>Desktop</strong>
                </div>

                <p>
                  H1:{" "}
                  {analysis?.overview?.aboveFold?.desktop?.primaryH1
                    ? "Detected"
                    : "Missing"}
                </p>

                <p>
                  CTA above fold:{" "}
                  {analysis?.overview?.aboveFold?.desktop?.hasAboveFoldCTA
                    ? "Yes"
                    : "No"}
                </p>

                <p>
                  Primary CTA:{" "}
                  {analysis?.overview?.aboveFold?.desktop?.primaryCTA?.text ||
                    "None detected"}
                </p>
              </div>

              <div className="issue-card">
                <div className="issue-header">
                  <span>📱</span>
                  <strong>Mobile</strong>
                </div>

                <p>
                  H1:{" "}
                  {analysis?.overview?.aboveFold?.mobile?.primaryH1
                    ? "Detected"
                    : "Missing"}
                </p>

                <p>
                  CTA above fold:{" "}
                  {analysis?.overview?.aboveFold?.mobile?.hasAboveFoldCTA
                    ? "Yes"
                    : "No"}
                </p>

                <p>
                  Primary CTA:{" "}
                  {analysis?.overview?.aboveFold?.mobile?.primaryCTA?.text ||
                    "None detected"}
                </p>
              </div>
            </div>
          </section>

          {/* FIRST IMPRESSION ANALYSIS */}

          <section className="audit-section">
            <h2>First Impression Analysis</h2>

            {analysis?.overview?.firstImpression?.factors?.map(
              (factor, index) => (
                <div className="recommendation" key={index}>
                  <div className="recommendation-number">{index + 1}</div>

                  <div>
                    <p>
                      <strong>{factor.factor}</strong>
                    </p>

                    <h3>{factor.status}</h3>

                    <p>{factor.detail}</p>
                  </div>

                  <span
                    className={`priority ${
                      factor.status === "Good"
                        ? "good"
                        : factor.status === "Poor"
                        ? "high"
                        : "medium"
                    }`}
                  >
                    +{factor.score}
                  </span>
                </div>
              )
            )}
          </section>

          {/* WEBSITE ANALYSIS */}

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
                <strong>{analysis?.overview?.imagesWithoutAlt ?? 0}</strong>
              </div>
            </div>
          </section>

          {/* RULE ENGINE BREAKDOWN */}

          <section className="audit-section">
            <h2>Rule Engine Breakdown</h2>

            <div className="category-grid">
              {Object.entries(analysis?.categoryScores || {}).map(
                ([category, score]) => (
                  <div className="category-card" key={category}>
                    <div className="category-header">
                      <span>{category}</span>

                      <strong>
                        {score === null ? "N/A" : `${score}/100`}
                      </strong>
                    </div>

                    {score !== null && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${score}%`,
                          }}
                        />
                      </div>
                    )}
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

                <div className="issue-number">{highIssues.length}</div>

                <p>Issues that may significantly affect the website.</p>
              </div>

              <div className="issue-card warning">
                <div className="issue-header">
                  <span>🟠</span>
                  <strong>Opportunities</strong>
                </div>

                <div className="issue-number">{mediumIssues.length}</div>

                <p>Potential improvements worth addressing.</p>
              </div>

              <div className="issue-card success">
                <div className="issue-header">
                  <span>🟢</span>
                  <strong>What's Working</strong>
                </div>

                <div className="issue-number">{goodIssues.length}</div>

                <p>Elements that are already passing our checks.</p>
              </div>
            </div>
          </section>

          {/* FINDINGS */}

          <section className="audit-section">
            <h2>Audit Findings</h2>

            {findings.map((finding, index) => (
              <div className="recommendation" key={index}>
                <div className="recommendation-number">{index + 1}</div>

                <div>
                  <p>
                    <strong>{finding.category}</strong>
                  </p>

                  <h3>{finding.issue}</h3>

                  <p>{finding.recommendation}</p>
                </div>

                <span
                  className={`priority ${(finding.severity || "Medium").toLowerCase()}`}
                >
                  {finding.severity || "Medium"}
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
        <div className="badge">✦ AI-Powered Conversion Optimization</div>

        <h1>
          Find out why your website
          <span> isn't converting.</span>
        </h1>

        <p className="subtitle">
          AI analyzes your website and identifies conversion problems, UX
          issues, and opportunities to increase your sales.
        </p>

        <div className="url-box">
          <input
            type="text"
            placeholder="https://yourwebsite.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                handleAnalyze();
              }
            }}
          />

          <button onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Website →"}
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
