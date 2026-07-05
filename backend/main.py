from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import joblib
import pandas as pd
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

app = FastAPI()

# Enable CORS
origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
)
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Load model artifacts dynamically relative to this file's location
BASE_DIR = Path(__file__).resolve().parent
model = joblib.load(BASE_DIR / "startup_model.pkl")
scaler = joblib.load(BASE_DIR / "scaler.pkl")
encoders = joblib.load(BASE_DIR / "encoders.pkl")

# The exact feature order the model was trained on
MODEL_FEATURES = [
    "funding_rounds",
    "founder_experience_years",
    "team_size",
    "market_size_billion",
    "product_traction_users",
    "burn_rate_million",
    "revenue_million",
    "investor_type",
    "sector",
    "founder_background",
]

# Model coefficients (from model.coef_[0]) — used for recommendations
COEF = dict(zip(MODEL_FEATURES, model.coef_[0].tolist()))


class StartupInput(BaseModel):
    funding_rounds: float
    founder_experience_years: float
    team_size: float
    market_size_billion: float
    product_traction_users: float
    burn_rate_million: float
    revenue_million: float
    investor_type: str
    sector: str
    founder_background: str


class Recommendation(BaseModel):
    text: str
    priority: str
    impact: str
    coefficient: float


class PredictionResult(BaseModel):
    prediction: int
    probability: float
    recommendations: List[Recommendation]
    feature_impacts: dict


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/metadata")
def metadata():
    """Return encoder categories so the frontend can render dropdowns."""
    categories = {}
    for col, le in encoders.items():
        categories[col] = le.classes_.tolist()
    return {"categories": categories}


@app.post("/predict")
def predict(data: StartupInput):
    raw = data.model_dump()

    # Build DataFrame with exact model feature order
    df = pd.DataFrame([{feat: raw[feat] for feat in MODEL_FEATURES}])

    # ---- Encode categorical columns ----
    for col in ["investor_type", "sector", "founder_background"]:
        if col in encoders:
            le = encoders[col]
            try:
                df[col] = le.transform(df[col])
            except ValueError:
                return {
                    "error": f"Invalid category '{raw[col]}' for '{col}'. "
                    f"Valid options: {le.classes_.tolist()}"
                }

    # ---- Scale all features ----
    df[MODEL_FEATURES] = scaler.transform(df[MODEL_FEATURES])

    # ---- Predict ----
    pred = int(model.predict(df)[0])
    prob = float(model.predict_proba(df)[0][1])

    # ---- Feature impacts (scaled_value * coefficient) ----
    scaled_values = df.iloc[0].to_dict()
    feature_impacts = {}
    for feat in MODEL_FEATURES:
        impact = scaled_values[feat] * COEF[feat]
        feature_impacts[feat] = round(float(impact), 4)

    # ---- Model-backed recommendations ----
    recs = _generate_recommendations(raw, feature_impacts, prob)

    return {
        "prediction": pred,
        "probability": round(prob, 4),
        "recommendations": recs,
        "feature_impacts": feature_impacts,
    }


def _generate_recommendations(
    raw: dict, feature_impacts: dict, probability: float
) -> list:
    """Generate recommendations grounded in the logistic regression coefficients."""
    recs = []

    # Sorted features by absolute coefficient strength (strongest first)
    sorted_features = sorted(COEF.items(), key=lambda x: abs(x[1]), reverse=True)

    # Thresholds informed by scaler means (training data averages)
    means = dict(zip(MODEL_FEATURES, scaler.mean_.tolist()))

    for feat, coef in sorted_features:
        val = raw[feat]

        # Skip categorical features for numeric threshold recommendations
        if feat in ["investor_type", "sector", "founder_background"]:
            continue

        # Only recommend improvements for features with positive coefficients
        # (i.e. increasing them improves success odds)
        if coef > 0.1 and isinstance(val, (int, float)):
            ratio = val / means[feat] if means[feat] != 0 else 1.0

            if ratio < 0.5:
                priority = "high"
                impact_label = "strong positive"
            elif ratio < 0.8:
                priority = "medium"
                impact_label = "moderate positive"
            elif ratio < 1.0:
                priority = "low"
                impact_label = "slight positive"
            else:
                continue  # Already above average, skip

            text = _recommendation_text(feat, val, means[feat], coef)
            recs.append(
                {
                    "text": text,
                    "priority": priority,
                    "impact": impact_label,
                    "coefficient": round(coef, 4),
                }
            )

    # Burn rate special case: high burn rate is risky if revenue is low
    if raw["burn_rate_million"] > means["burn_rate_million"] and raw["revenue_million"] < means["revenue_million"]:
        recs.append(
            {
                "text": f"Your burn rate (${raw['burn_rate_million']:.1f}M) exceeds the average "
                f"(${means['burn_rate_million']:.1f}M) while revenue is below average. "
                f"Focus on unit economics to extend runway.",
                "priority": "high",
                "impact": "risk factor",
                "coefficient": round(COEF["burn_rate_million"], 4),
            }
        )

    # Investor type insight
    if raw["investor_type"] == "none":
        recs.append(
            {
                "text": "Securing investor backing (angel or VC) can provide strategic value "
                "beyond capital — consider fundraising.",
                "priority": "medium",
                "impact": "strategic",
                "coefficient": round(COEF["investor_type"], 4),
            }
        )

    # Founder background insight
    if raw["founder_background"] == "first_time":
        recs.append(
            {
                "text": "First-time founders can offset experience gaps by recruiting advisors "
                "or co-founders with prior startup exits.",
                "priority": "medium",
                "impact": "strategic",
                "coefficient": round(COEF["founder_background"], 4),
            }
        )

    # If probability is high but still room to grow
    if probability > 0.7 and len(recs) == 0:
        recs.append(
            {
                "text": "Your startup metrics are strong across the board. "
                "Focus on execution speed and market timing.",
                "priority": "low",
                "impact": "maintain momentum",
                "coefficient": 0.0,
            }
        )

    return recs


def _recommendation_text(feat: str, val: float, mean: float, coef: float) -> str:
    """Return a human-readable recommendation for a numeric feature."""
    labels = {
        "funding_rounds": (
            f"You have {int(val)} funding round(s), below the average of {mean:.0f}. "
            f"Additional rounds strongly correlate with success (weight: {coef:.2f})."
        ),
        "founder_experience_years": (
            f"Founder has {val:.0f} years of experience vs. average {mean:.0f}. "
            f"More experience significantly boosts success odds (weight: {coef:.2f})."
        ),
        "team_size": (
            f"Team of {int(val)} is below the average of {mean:.0f}. "
            f"Growing your team can positively impact outcomes (weight: {coef:.2f})."
        ),
        "market_size_billion": (
            f"Target market is ${val:.1f}B vs. average ${mean:.1f}B. "
            f"Larger addressable markets improve success chances."
        ),
        "product_traction_users": (
            f"Current traction is {int(val):,} users vs. average {int(mean):,}. "
            f"User growth is a strong success predictor (weight: {coef:.2f})."
        ),
        "revenue_million": (
            f"Revenue is ${val:.1f}M vs. average ${mean/1e6:.1f}M. "
            f"Revenue is the strongest success predictor (weight: {coef:.2f}). "
            f"Prioritize monetization."
        ),
        "burn_rate_million": (
            f"Burn rate of ${val:.1f}M/month. Monitor runway carefully."
        ),
    }
    return labels.get(feat, f"Improve {feat} (currently {val}, avg {mean:.1f}).")