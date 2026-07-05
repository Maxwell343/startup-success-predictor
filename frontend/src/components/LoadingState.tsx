export default function LoadingState() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-text">Analyzing your startup metrics...</div>
    </div>
  );
}
