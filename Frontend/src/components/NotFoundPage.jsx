import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BridgeIcon from "../../src/assets/Bridge.png"

/* ─── Animated broken-bridge SVG ─────────────────────────────────── */
function BrokenBridgeSVG({ tick }) {
  const W = 340, H = 180;

  const leftX   = W * 0.08;
  const rightX  = W * 0.92;
  const deckY   = H * 0.60;
  const towerH  = H * 0.44;
  const towerW  = W * 0.024;
  const towerY  = deckY - towerH;

  const leftTowerX  = W * 0.28;
  const rightTowerX = W * 0.72;
  const midX        = W / 2;

  // gap in the middle — bridge is broken
  const gapL = midX - 28;
  const gapR = midX + 28;

  // debris particles falling
  const debris = [
    { x: midX - 14, y: deckY + 8  + Math.sin(tick * 0.7) * 6,  r: 5,  op: 0.6 },
    { x: midX + 6,  y: deckY + 18 + Math.cos(tick * 0.5) * 8,  r: 3,  op: 0.5 },
    { x: midX - 4,  y: deckY + 30 + Math.sin(tick * 0.9) * 5,  r: 4,  op: 0.4 },
    { x: midX + 16, y: deckY + 10 + Math.cos(tick * 0.6) * 7,  r: 2,  op: 0.5 },
  ];

  // warning light pulse
  const warnOpacity = 0.6 + Math.sin(tick * 1.2) * 0.4;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="bridge-svg-404"
      aria-label="Broken bridge 404 animation"
    >
      <defs>
        <linearGradient id="sky404" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1c1427" />
        </linearGradient>
        <linearGradient id="tower404" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="water404" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0f2040" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#080d18" stopOpacity="1" />
        </linearGradient>
        <filter id="glow404">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="redGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="debrisGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width={W} height={H} fill="url(#sky404)" rx="14" />

      {/* Stars */}
      {[...Array(20)].map((_, i) => (
        <circle
          key={i}
          cx={(i * 53 + 11) % W}
          cy={(i * 29 + 9) % (deckY - 12)}
          r={0.7 + (i % 3) * 0.3}
          fill="white"
          opacity={0.2 + Math.sin(tick * 0.4 + i) * 0.15}
        />
      ))}

      {/* Red danger glow in the gap */}
      <ellipse
        cx={midX}
        cy={deckY + 4}
        rx={38}
        ry={18}
        fill="#ef4444"
        opacity={warnOpacity * 0.12}
        filter="url(#redGlow)"
      />

      {/* Water */}
      <rect x="0" y={deckY + 10} width={W} height={H - deckY - 10} fill="url(#water404)" />

      {/* Water ripples */}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={W * (0.2 + i * 0.3) + Math.sin(tick * 0.4 + i) * 8}
          cy={deckY + 14 + i * 4}
          rx={18 + i * 7}
          ry={2}
          fill="none"
          stroke="#ef4444"
          strokeWidth="0.5"
          opacity={0.18 + Math.sin(tick * 0.3 + i) * 0.1}
        />
      ))}

      {/* Left ground pillar */}
      <rect x={leftX - towerW / 2} y={deckY} width={towerW} height={H - deckY} fill="#1e3a8a" opacity="0.9" />
      {/* Right ground pillar */}
      <rect x={rightX - towerW / 2} y={deckY} width={towerW} height={H - deckY} fill="#1e3a8a" opacity="0.9" />

      {/* Left tower */}
      <rect x={leftTowerX - towerW / 2} y={towerY} width={towerW} height={towerH}
        fill="url(#tower404)" filter="url(#glow404)" rx={towerW / 4} />
      {/* Right tower */}
      <rect x={rightTowerX - towerW / 2} y={towerY} width={towerW} height={towerH}
        fill="url(#tower404)" filter="url(#glow404)" rx={towerW / 4} />

      {/* Tower cross-beams */}
      {[0.35, 0.6, 0.82].map((f, i) => (
        <React.Fragment key={i}>
          <rect x={leftTowerX  - towerW * 1.5} y={towerY + towerH * f} width={towerW * 3} height={towerW * 0.6} fill="#3b82f6" opacity="0.8" rx={1} />
          <rect x={rightTowerX - towerW * 1.5} y={towerY + towerH * f} width={towerW * 3} height={towerW * 0.6} fill="#3b82f6" opacity="0.8" rx={1} />
        </React.Fragment>
      ))}

      {/* Tower top warning lights (red pulse) */}
      <circle cx={leftTowerX}  cy={towerY - 2} r={3.5} fill="#ef4444" filter="url(#redGlow)" opacity={warnOpacity} />
      <circle cx={rightTowerX} cy={towerY - 2} r={3.5} fill="#ef4444" filter="url(#redGlow)" opacity={1 - warnOpacity + 0.4} />

      {/* Main suspension cables */}
      <path d={`M ${leftX} ${deckY} C ${leftX + (leftTowerX - leftX) * 0.6} ${deckY - 4}, ${leftTowerX - 10} ${towerY + H*0.04 + 4}, ${leftTowerX} ${towerY + H*0.04}`}
        fill="none" stroke="#93c5fd" strokeWidth="1.2" opacity="0.8" />
      <path d={`M ${leftTowerX} ${towerY + H*0.04} Q ${midX - 30} ${deckY - H*0.08}, ${gapL} ${deckY - 2}`}
        fill="none" stroke="#93c5fd" strokeWidth="1.4" opacity="0.8" />
      <path d={`M ${gapR} ${deckY - 2} Q ${midX + 30} ${deckY - H*0.08}, ${rightTowerX} ${towerY + H*0.04}`}
        fill="none" stroke="#93c5fd" strokeWidth="1.4" opacity="0.8" />
      <path d={`M ${rightTowerX} ${towerY + H*0.04} C ${rightTowerX + 10} ${towerY + H*0.04 + 4}, ${rightX - (rightX - rightTowerX)*0.6} ${deckY - 4}, ${rightX} ${deckY}`}
        fill="none" stroke="#93c5fd" strokeWidth="1.2" opacity="0.8" />

      {/* Dangling cable ends at gap */}
      <path d={`M ${gapL} ${deckY - 2} Q ${gapL - 6} ${deckY + 12}, ${gapL - 2} ${deckY + 20}`}
        fill="none" stroke="#93c5fd" strokeWidth="1" opacity={0.5 + Math.sin(tick * 0.8) * 0.2} />
      <path d={`M ${gapR} ${deckY - 2} Q ${gapR + 6} ${deckY + 12}, ${gapR + 2} ${deckY + 20}`}
        fill="none" stroke="#93c5fd" strokeWidth="1" opacity={0.5 + Math.cos(tick * 0.8) * 0.2} />

      {/* LEFT DECK (intact) */}
      <rect x={leftX} y={deckY - 4} width={gapL - leftX} height={5} fill="#2563eb" opacity="0.85" rx={1} />
      <rect x={leftX} y={deckY - 5} width={gapL - leftX} height={1.2} fill="#3b82f6" opacity="0.55" />

      {/* RIGHT DECK (intact) */}
      <rect x={gapR} y={deckY - 4} width={rightX - gapR} height={5} fill="#2563eb" opacity="0.85" rx={1} />
      <rect x={gapR} y={deckY - 5} width={rightX - gapR} height={1.2} fill="#3b82f6" opacity="0.55" />

      {/* Jagged broken edges */}
      <polyline
        points={`${gapL},${deckY-4} ${gapL-5},${deckY} ${gapL-2},${deckY+3} ${gapL+2},${deckY-2} ${gapL},${deckY+1}`}
        fill="none" stroke="#1d4ed8" strokeWidth="1.5" opacity="0.9"
      />
      <polyline
        points={`${gapR},${deckY-4} ${gapR+5},${deckY} ${gapR+2},${deckY+3} ${gapR-2},${deckY-2} ${gapR},${deckY+1}`}
        fill="none" stroke="#1d4ed8" strokeWidth="1.5" opacity="0.9"
      />

      {/* Falling debris */}
      {debris.map((d, i) => (
        <rect
          key={i}
          x={d.x} y={d.y}
          width={d.r * 2} height={d.r}
          fill="#1e40af"
          opacity={d.op}
          rx={1}
          filter="url(#debrisGlow)"
        />
      ))}

      {/* "404" in the gap area as glowing red text */}
      <text
        x={midX}
        y={deckY + 6}
        textAnchor="middle"
        fontSize="8"
        fill="#ef4444"
        fontFamily="monospace"
        fontWeight="bold"
        opacity={warnOpacity}
        filter="url(#redGlow)"
      >
        404
      </text>

      {/* Warning sign */}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="6.5" fill="#ef4444" fontFamily="monospace" opacity="0.45">
        BRIDGE INTEGRITY FAILURE
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   NOT FOUND PAGE
══════════════════════════════════════════════════════════════════ */
export default function NotFoundPage() {
  const [tick, setTick]     = useState(0);
  const [count, setCount]   = useState(10);
  const navigate            = useNavigate();
  const location            = useLocation();
  const { user }            = useSelector((s) => s.auth);

  // Drive animation
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 280);
    return () => clearInterval(id);
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    if (count <= 0) {
      navigate(user ? '/company' : '/', { replace: true });
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate, user]);

  const homeTarget = user ? '/company' : '/';
  const homeLabel  = user ? 'Go to Dashboard' : 'Go to Home';

  return (
    <div className="notfound-root">

      {/* Background grid */}
      <div className="notfound-grid" aria-hidden />

      {/* Red danger glow at bottom */}
      <div className="notfound-danger-glow" aria-hidden />

      {/* Content card */}
      <div className="notfound-card">

        {/* Brand top strip */}
        <div className="notfound-brand">
          <img src={BridgeIcon} alt="VendorBridge" className="notfound-brand-img" />
          <span className="notfound-brand-vendor">Vendor</span>
          <span className="notfound-brand-bridge">Bridge</span>
        </div>

        {/* Broken bridge animation */}
        <div className="notfound-svg-wrap">
          <BrokenBridgeSVG tick={tick} />
        </div>

        {/* 404 heading */}
        <div className="notfound-heading-wrap">
          <h1 className="notfound-code">404</h1>
          <div className="notfound-badge">BRIDGE INTEGRITY FAILURE</div>
        </div>

        {/* Message */}
        <p className="notfound-title">This route doesn't exist.</p>
        <p className="notfound-desc">
          The path <code className="notfound-path">{location.pathname}</code> could not be found.
          <br />
          The bridge to this page was never built.
        </p>

        {/* Countdown bar */}
        <div className="notfound-countdown-wrap">
          <div className="notfound-countdown-track">
            <div
              className="notfound-countdown-bar"
              style={{ width: `${(count / 10) * 100}%` }}
            />
          </div>
          <p className="notfound-countdown-label">
            Auto-redirecting in <span className="notfound-countdown-num">{count}s</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="notfound-actions">
          <Link to={homeTarget} className="notfound-btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {homeLabel}
          </Link>

          <button onClick={() => navigate(-1)} className="notfound-btn-secondary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Footer hint */}
        <p className="notfound-footer">
          Need access?&nbsp;
          <Link to="/Login" className="notfound-footer-link">Sign in</Link>
          &nbsp;or&nbsp;
          <Link to="/register" className="notfound-footer-link">Create account</Link>
        </p>
      </div>
    </div>
  );
}
