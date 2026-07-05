import type { PredictionResponse } from "../types";

export default function ResultDashboard({
  result,
  onReset
}: {
  result: PredictionResponse;
  onReset: () => void;
}) {
  const isSuccessType = result.prediction === 1;
  const probPercent = (result.probability * 100).toFixed(1);

  if (result.error) {
    return <div className="error-banner">⚠️ {result.error}</div>;
  }

  // Find max absolute impact to normalize progress bars
  const impacts = Object.entries(result.feature_impacts || {});
  const maxAbsImpact = Math.max(...impacts.map(([_, val]) => Math.abs(val)), 1);

  return (
    <section className="results-section">
      <button onClick={onReset} style={{ background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '4px', marginBottom: '24px', cursor: 'pointer' }}>
        ← Test another startup
      </button>

      <div className={`result-header ${isSuccessType ? "success" : "failure"}`}>
        <div className="result-icon">
          {isSuccessType ? "🚀" : "⚠️"}
        </div>
        <div className="result-info">
          <h2>{isSuccessType ? "High Success Potential" : "High Risk Profile"}</h2>
          <p>Based on our historical logistic regression model analysis.</p>
        </div>
        <div className="probability-display">
          <div className="probability-value">{probPercent}%</div>
          <div className="probability-label">Success Odds</div>
        </div>
      </div>

      <div className="impacts-card">
        <h3>Model Feature Impact Analysis</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          This visualizes exactly how your inputs weighed into the regression model. Positive impacts push you toward success, negative away.
        </p>

        {impacts
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])) // Sort by magnitude (strongest first)
          .map(([feature, impact]) => {
          
          const isPositive = impact > 0;
          const normalizedWidth = (Math.abs(impact) / maxAbsImpact) * 100;
          const displayFeatureName = feature.replace(/_/g, ' ').replace('million', '($M)').replace('billion', '($B)');
          
          return (
            <div className="impact-row" key={feature}>
              <div className="impact-label" style={{textTransform: 'capitalize'}}>{displayFeatureName}</div>
              <div className="impact-bar-container">
                <div 
                  className={`impact-bar ${isPositive ? 'positive' : 'negative'}`} 
                  style={{ width: `${normalizedWidth}%`, marginLeft: isPositive ? '0' : 'auto', right: isPositive ? 'auto' : '0', position: 'absolute' }}
                ></div>
              </div>
              <div className={`impact-value ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{impact.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {result.recommendations && result.recommendations.length > 0 && (
        <div className="recs-card">
          <h3>Strategic Recommendations</h3>
          {result.recommendations.map((rec, i) => (
            <div className={`rec-item ${rec.priority}`} key={i}>
              <div className="rec-priority">{rec.priority} Priority</div>
              <div className="rec-content">
                <div className="rec-text">{rec.text}</div>
                <div className="rec-meta">Expected Model Impact: {rec.impact} ({rec.coefficient > 0 ? '+' : ''}{rec.coefficient})</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}