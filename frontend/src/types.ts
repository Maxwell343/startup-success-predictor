export interface StartupInput {
  funding_rounds: number;
  founder_experience_years: number;
  team_size: number;
  market_size_billion: number;
  product_traction_users: number;
  burn_rate_million: number;
  revenue_million: number;
  investor_type: string;
  sector: string;
  founder_background: string;
}

export interface Recommendation {
  text: string;
  priority: "high" | "medium" | "low" | string;
  impact: string;
  coefficient: number;
}

export interface PredictionResponse {
  prediction: number;
  probability: number;
  recommendations: Recommendation[];
  feature_impacts: Record<string, number>;
  error?: string;
}

export interface MetadataResponse {
  categories: Record<string, string[]>;
}