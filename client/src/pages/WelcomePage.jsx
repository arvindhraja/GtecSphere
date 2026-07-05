import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import GtecSphereLogo from "../components/GtecSphereLogo.jsx";
import "./WelcomePage.css";

function WelcomePage() {
  const navigate = useNavigate();

  // ==========================================
  // ENTER LOGIN PAGE
  // ==========================================
  const handleEnter = () => {
    navigate("/login");
  };

  // ==========================================
  // ENTER KEY SUPPORT
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        handleEnter();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <main className="welcome-page">
      {/* ======================================
          BACKGROUND
      ====================================== */}

      <div
        className="welcome-background"
        aria-hidden="true"
      >
        <div className="welcome-gradient welcome-gradient-one" />
        <div className="welcome-gradient welcome-gradient-two" />
        <div className="welcome-grid" />
        <div className="welcome-noise" />
      </div>

      {/* ======================================
          FLOATING ORBS
      ====================================== */}

      <div
        className="welcome-orbs"
        aria-hidden="true"
      >
        <span className="welcome-orb orb-one" />
        <span className="welcome-orb orb-two" />
        <span className="welcome-orb orb-three" />
      </div>

      {/* ======================================
          PARTICLES
      ====================================== */}

      <div
        className="welcome-particles"
        aria-hidden="true"
      >
        {Array.from({ length: 18 }).map(
          (_, index) => (
            <span
              key={index}
              style={{
                "--particle-index": index,
              }}
            />
          )
        )}
      </div>

      {/* ======================================
          TOP WAVE
      ====================================== */}

      <div
        className="welcome-wave welcome-wave-top"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0,160 C180,40 320,280 520,150 C720,20 850,260 1060,130 C1210,40 1320,80 1440,20" />

          <path d="M0,190 C220,70 360,290 560,170 C760,50 920,240 1120,150 C1260,80 1360,100 1440,70" />

          <path d="M0,220 C180,120 400,300 600,200 C820,90 980,260 1180,180 C1300,130 1380,130 1440,120" />
        </svg>
      </div>

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="welcome-header">
        <div className="welcome-brand">
          <GtecSphereLogo
            size="small"
            variant="light"
          />
        </div>

        <button
          type="button"
          className="welcome-login-button"
          onClick={handleEnter}
          data-cursor-hover
        >
          <span>Login</span>
          <span className="welcome-login-arrow">
            ↗
          </span>
        </button>
      </header>

      {/* ======================================
          HERO CONTENT
      ====================================== */}

      <section className="welcome-content">
        <div className="welcome-badge">
          <span className="welcome-badge-dot" />

          <span>
            YOUR CAMPUS. ONE DIGITAL SPHERE.
          </span>
        </div>

        <p className="welcome-eyebrow">
          WELCOME TO GTECSPHERE
        </p>

        <h1 className="welcome-title">
          <span className="welcome-title-line">
            WE CODE
          </span>

          <span className="welcome-title-line welcome-title-gradient">
            EVENTS.
          </span>
        </h1>

        <p className="welcome-description">
          We create experiences that connect your
          campus, empower students, and turn every
          event into a story worth remembering.
        </p>

        <div className="welcome-actions">
          <button
            type="button"
            className="welcome-enter-button"
            onClick={handleEnter}
            data-cursor-hover
          >
            <span>ENTER THE SPHERE</span>

            <span className="welcome-enter-icon">
              →
            </span>
          </button>

          <span className="welcome-enter-hint">
            Press Enter to continue
          </span>
        </div>
      </section>

      {/* ======================================
          SIDE DECORATION
      ====================================== */}

      <div
        className="welcome-side-text welcome-side-left"
        aria-hidden="true"
      >
        <span>01</span>
        <div />
        <p>GTECSphere</p>
      </div>

      <div
        className="welcome-side-text welcome-side-right"
        aria-hidden="true"
      >
        <p>Campus Experience Platform</p>
        <div />
        <span>2026</span>
      </div>

      {/* ======================================
          BOTTOM DIGITAL WAVE
      ====================================== */}

      <div
        className="welcome-wave-field"
        aria-hidden="true"
      >
        {Array.from({ length: 12 }).map(
          (_, index) => (
            <span
              key={index}
              style={{
                "--wave-index": index,
              }}
            />
          )
        )}
      </div>

      {/* ======================================
          BOTTOM WAVE SVG
      ====================================== */}

      <div
        className="welcome-wave welcome-wave-bottom"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0,210 C160,90 320,290 500,190 C700,80 820,270 1030,170 C1200,90 1320,150 1440,80" />

          <path d="M0,245 C180,130 350,310 560,220 C760,120 900,290 1100,210 C1260,150 1360,170 1440,140" />

          <path d="M0,280 C220,190 390,320 620,260 C820,190 1010,300 1200,250 C1320,220 1390,220 1440,210" />
        </svg>
      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="welcome-footer">
        <p>
          © 2026 GtecSphere
        </p>

        <div className="welcome-footer-status">
          <span />
          <p>System Online</p>
        </div>

        <p>
          Built for campus experiences
        </p>
      </footer>
    </main>
  );
}

export default WelcomePage;