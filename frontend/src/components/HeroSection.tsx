export default function HeroSection() {
  return (
    <header className="hero">
      <div className="hero-badge">
        <span className="dot"></span>
        AI-Powered
      </div>
      <h1>
        Predict Your Startup's <br/>
        <span className="gradient-text">Success Potential</span>
      </h1>
      <p>
        Analyze your metrics against our logistic regression model trained on 
        thousands of past startup outcomes. Find out your success probability 
        and discover data-driven recommendations to improve your odds.
      </p>
    </header>
  );
}
