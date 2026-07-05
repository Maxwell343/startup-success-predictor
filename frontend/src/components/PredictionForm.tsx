import { useState, useEffect } from "react";
import { predictStartup } from "../utils/predict";
import type { StartupInput, PredictionResponse, MetadataResponse } from "../types";

interface Props {
  setResult: (res: PredictionResponse) => void;
  setLoading: (l: boolean) => void;
  metadata: MetadataResponse | null;
}

export default function PredictionForm({ setResult, setLoading, metadata }: Props) {
  const [form, setForm] = useState<StartupInput>({
    funding_rounds: 1,
    founder_experience_years: 2,
    team_size: 3,
    market_size_billion: 1,
    product_traction_users: 1000,
    burn_rate_million: 0.5,
    revenue_million: 0,
    investor_type: "none",
    sector: "SaaS",
    founder_background: "first_time",
  });

  // Once metadata loads, sync default values to avoid invalid selects
  useEffect(() => {
    if (metadata) {
      setForm(prev => ({
        ...prev,
        investor_type: metadata.categories["investor_type"]?.[0] || prev.investor_type,
        sector: metadata.categories["sector"]?.[0] || prev.sector,
        founder_background: metadata.categories["founder_background"]?.[0] || prev.founder_background,
      }));
    }
  }, [metadata]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictStartup(form);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      alert("Error generating prediction. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-section">
      <div className="form-card">
        <h2 className="form-title">Enter Startup Metrics</h2>
        <p className="form-subtitle">Fill in the current data points of your startup to get an accurate prediction.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Numeric Inputs */}
            <div className="form-group">
              <label>Funding Rounds</label>
              <input type="number" min="0" step="1" name="funding_rounds" value={form.funding_rounds} onChange={handleChange} required />
              <div className="input-hint">Total number of equity funding rounds</div>
            </div>

            <div className="form-group">
              <label>Founder Experience (Years)</label>
              <input type="number" min="0" step="0.5" name="founder_experience_years" value={form.founder_experience_years} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Team Size</label>
              <input type="number" min="1" step="1" name="team_size" value={form.team_size} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Market Size ($B)</label>
              <input type="number" min="0" step="0.1" name="market_size_billion" value={form.market_size_billion} onChange={handleChange} required />
              <div className="input-hint">Total Addressable Market in Billions</div>
            </div>

            <div className="form-group">
              <label>Product Traction (Users)</label>
              <input type="number" min="0" step="1" name="product_traction_users" value={form.product_traction_users} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Burn Rate ($M/mo)</label>
              <input type="number" min="0" step="0.1" name="burn_rate_million" value={form.burn_rate_million} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Annual Revenue ($M)</label>
              <input type="number" min="0" step="0.1" name="revenue_million" value={form.revenue_million} onChange={handleChange} required />
            </div>

            {/* Categorical Selects */}
            <div className="form-group">
              <label>Investor Type</label>
              <select name="investor_type" value={form.investor_type} onChange={handleChange} disabled={!metadata}>
                {metadata?.categories["investor_type"]?.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                )) || <option value="none">Loading...</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Sector</label>
              <select name="sector" value={form.sector} onChange={handleChange} disabled={!metadata}>
                {metadata?.categories["sector"]?.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                )) || <option value="SaaS">Loading...</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Founder Background</label>
              <select name="founder_background" value={form.founder_background} onChange={handleChange} disabled={!metadata}>
                {metadata?.categories["founder_background"]?.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                )) || <option value="first_time">Loading...</option>}
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={!metadata}>
            <span className="btn-content">
              Generate AI Prediction
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </button>
        </form>
      </div>
    </section>
  );
}