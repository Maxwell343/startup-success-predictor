import { useState, useEffect } from "react";
import HeroSection from "./components/HeroSection";
import PredictionForm from "./components/PredictionForm";
import ResultDashboard from "./components/ResultDashboard";
import LoadingState from "./components/LoadingState";
import { fetchMetadata } from "./utils/predict";
import type { PredictionResponse, MetadataResponse } from "./types";

function App() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch encoder categories on mount
    const loadMetadata = async () => {
      try {
        const data = await fetchMetadata();
        setMetadata(data);
      } catch (err) {
        console.error("Failed to load metadata, please refresh", err);
        setError("Please refresh the page to try again. Apologies for the inconvenience.");
      }
    };
    loadMetadata();
  }, []);

  return (
    <div className="app-container">
      <HeroSection />

      {error && <div className="error-banner">⚠️ {error}</div>}

      <main>
        {!result && !loading && (
          <PredictionForm
            setResult={setResult}
            setLoading={setLoading}
            metadata={metadata}
          />
        )}

        {loading && <LoadingState />}

        {result && !loading && (
          <>
            <ResultDashboard result={result} onReset={() => setResult(null)} />
          </>
        )}
      </main>

      <footer className="footer">
        <p>Built with React & FastAPI • Powered by Logistic Regression</p>
      </footer>
    </div>
  );
}

export default App;