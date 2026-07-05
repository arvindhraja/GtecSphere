import "./GtecSphereLogo.css";

function GtecSphereLogo({
  showText = true,
  subtitle = "",
  size = "medium",
  variant = "light",
}) {
  return (
    <div
      className={`gtec-brand gtec-brand-${size} gtec-brand-${variant}`}
    >
      <div className="gtec-logo-mark">
        <span className="gtec-orbit gtec-orbit-one" />
        <span className="gtec-orbit gtec-orbit-two" />

        <span className="gtec-logo-core">
          <span className="gtec-code-symbol">&lt;/&gt;</span>
        </span>

        <span className="gtec-orbit-dot" />
      </div>

      {showText && (
        <div className="gtec-brand-copy">
          <strong>
            Gtec<span>Sphere</span>
          </strong>

          {subtitle && <small>{subtitle}</small>}
        </div>
      )}
    </div>
  );
}

export default GtecSphereLogo;