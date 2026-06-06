import React, { useEffect, useState } from 'react';
import BridgeIcon from '../assets/Bridge.png';

/**
 * BridgeLoader — Cinematic "building a bridge" loading animation.
 *
 * Props:
 *  fullscreen  {boolean}  default true  — covers the whole viewport with overlay
 *  message     {string}   optional label below animation
 *  size        {string}   "sm" | "md" | "lg" — controls scale when fullscreen=false
 */
export default function BridgeLoader({
  fullscreen = true,
  message = 'Connecting…',
  size = 'md',
}) {
  const [tick, setTick] = useState(0);

  // Drive the animation forward every 300ms
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 100), 300);
    return () => clearInterval(id);
  }, []);

  // 8 deck segments that fill in left-to-right
  const segments = 8;
  const activeSegments = (tick % (segments + 4));   // 0-11 cycles back

  if (fullscreen) {
    return (
      <div className="bridge-loader-overlay">
        <div className="bridge-loader-card">
          <BridgeAnimation tick={tick} />
          <div className="bridge-loader-brand">
            <img src={BridgeIcon} alt="VendorBridge" className="bridge-loader-brand-img" />
            <span className="bridge-loader-brand-vendor">Vendor</span>
            <span className="bridge-loader-brand-bridge">Bridge</span>
          </div>
          {message && <p className="bridge-loader-message">{message}</p>}
          <div className="bridge-loader-dots">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="bridge-loader-dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Inline / embedded variant
  return (
    <div className={`bridge-loader-inline bridge-loader-inline--${size}`}>
      <BridgeAnimation tick={tick} compact />
      {message && <p className="bridge-loader-message">{message}</p>}
    </div>
  );
}

/* ─── Internal SVG Bridge Animation ─────────────────────────────────────────── */
function BridgeAnimation({ tick, compact = false }) {
  const segments = 8;
  // How many deck segments are built (0-8), then reset
  const built = Math.min(tick % (segments + 3), segments);
  const progress = (built / segments) * 100;

  const W = compact ? 180 : 320;
  const H = compact ? 90  : 160;

  // Key positions
  const leftX  = W * 0.08;
  const rightX = W * 0.92;
  const deckY  = H * 0.62;
  const towerH = H * 0.45;
  const towerW = W * 0.025;
  const towerY  = deckY - towerH;

  const leftTowerX  = W * 0.28;
  const rightTowerX = W * 0.72;
  const midX        = W / 2;

  // Deck segments
  const deckLen   = rightX - leftX;
  const segW      = deckLen / segments;

  // Cable sag
  const cableTopY = towerY + H * 0.04;
  const cableMidY = deckY - H * 0.1;

  // Particle sparks when building
  const sparks = built > 0 && built < segments
    ? [0, 1, 2].map((i) => ({
        x: leftX + built * segW + (Math.sin(tick * 1.5 + i * 2) * 8),
        y: deckY - 4 + (Math.cos(tick + i) * 6),
      }))
    : [];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="bridge-svg"
      aria-label="Bridge construction animation"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id="deckGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0f3460" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0a1628" stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sparkGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="deckClip">
          <rect x={leftX} y={deckY - 8} width={(built / segments) * deckLen} height={20} />
        </clipPath>
      </defs>

      {/* Sky background */}
      <rect x="0" y="0" width={W} height={H} fill="url(#skyGrad)" rx="12" />

      {/* Stars */}
      {[...Array(18)].map((_, i) => (
        <circle
          key={i}
          cx={(i * 47 + 13) % W}
          cy={(i * 31 + 7) % (deckY - 10)}
          r={0.8 + (i % 3) * 0.4}
          fill="white"
          opacity={0.3 + (Math.sin(tick * 0.3 + i) * 0.2)}
        />
      ))}

      {/* Water / river */}
      <rect x="0" y={deckY + 10} width={W} height={H - deckY - 10} fill="url(#waterGrad)" rx="0" />

      {/* Animated water ripples */}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={W * (0.2 + i * 0.3) + Math.sin(tick * 0.5 + i) * 10}
          cy={deckY + 16 + i * 4}
          rx={20 + i * 8}
          ry={2}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.5"
          opacity={0.25 + Math.sin(tick * 0.4 + i) * 0.15}
        />
      ))}

      {/* Left pillar (ground support) */}
      <rect
        x={leftX - towerW / 2}
        y={deckY}
        width={towerW}
        height={H - deckY}
        fill="#1e40af"
        opacity="0.9"
      />

      {/* Right pillar (ground support) */}
      <rect
        x={rightX - towerW / 2}
        y={deckY}
        width={towerW}
        height={H - deckY}
        fill="#1e40af"
        opacity="0.9"
      />

      {/* Left tower */}
      <rect
        x={leftTowerX - towerW / 2}
        y={towerY}
        width={towerW}
        height={towerH}
        fill="url(#towerGrad)"
        filter="url(#glow)"
        rx={towerW / 4}
      />

      {/* Right tower */}
      <rect
        x={rightTowerX - towerW / 2}
        y={towerY}
        width={towerW}
        height={towerH}
        fill="url(#towerGrad)"
        filter="url(#glow)"
        rx={towerW / 4}
      />

      {/* Tower cross-beams */}
      {[0.35, 0.6, 0.82].map((frac, i) => (
        <rect
          key={i}
          x={leftTowerX - towerW * 1.5}
          y={towerY + towerH * frac}
          width={towerW * 3}
          height={towerW * 0.6}
          fill="#3b82f6"
          opacity="0.8"
          rx={1}
        />
      ))}
      {[0.35, 0.6, 0.82].map((frac, i) => (
        <rect
          key={i}
          x={rightTowerX - towerW * 1.5}
          y={towerY + towerH * frac}
          width={towerW * 3}
          height={towerW * 0.6}
          fill="#3b82f6"
          opacity="0.8"
          rx={1}
        />
      ))}

      {/* Tower top lights */}
      <circle cx={leftTowerX}  cy={towerY - 2} r={3} fill="#60a5fa" filter="url(#glow)"
        opacity={0.7 + Math.sin(tick * 0.6) * 0.3}
      />
      <circle cx={rightTowerX} cy={towerY - 2} r={3} fill="#60a5fa" filter="url(#glow)"
        opacity={0.7 + Math.sin(tick * 0.6 + Math.PI) * 0.3}
      />

      {/* Main suspension cables (always visible) */}
      {/* Left cable: left anchor → left tower → right tower → right anchor */}
      <path
        d={`M ${leftX} ${deckY} 
            C ${leftX + (leftTowerX - leftX) * 0.6} ${deckY - 4},
              ${leftTowerX - 10} ${cableTopY + 4},
              ${leftTowerX} ${cableTopY}`}
        fill="none" stroke="#93c5fd" strokeWidth="1.2" opacity="0.9"
      />
      <path
        d={`M ${leftTowerX} ${cableTopY}
            Q ${midX} ${cableMidY},
              ${rightTowerX} ${cableTopY}`}
        fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.9"
      />
      <path
        d={`M ${rightTowerX} ${cableTopY}
            C ${rightTowerX + 10} ${cableTopY + 4},
              ${rightX - (rightX - rightTowerX) * 0.6} ${deckY - 4},
              ${rightX} ${deckY}`}
        fill="none" stroke="#93c5fd" strokeWidth="1.2" opacity="0.9"
      />

      {/* Suspender hanger cables (vertical lines from main cable down to deck) */}
      {[...Array(segments + 1)].map((_, i) => {
        const x = leftX + (deckLen / segments) * i;
        // Parabolic cable height at position x
        const t = (x - leftX) / deckLen;
        const cableY = deckY - (towerH * 0.35) + (4 * (towerH * 0.35)) * t * (1 - t);
        return (
          <line
            key={i}
            x1={x} y1={Math.min(cableY, deckY)}
            x2={x} y2={deckY}
            stroke="#bfdbfe"
            strokeWidth="0.6"
            opacity={0.5}
          />
        );
      })}

      {/* DECK — built segment by segment */}
      {[...Array(built)].map((_, i) => {
        const x = leftX + i * segW;
        const isLast = i === built - 1;
        return (
          <g key={i}>
            <rect
              x={x}
              y={deckY - 4}
              width={segW}
              height={5}
              fill={isLast ? '#60a5fa' : '#2563eb'}
              opacity={isLast ? 0.95 : 0.85}
              filter={isLast ? 'url(#glow)' : undefined}
            />
            {/* Road surface texture */}
            <rect
              x={x}
              y={deckY - 5}
              width={segW}
              height={1.2}
              fill="#3b82f6"
              opacity={0.6}
            />
          </g>
        );
      })}

      {/* Road center-line dashes (only on built portion) */}
      {built > 1 && [...Array(built - 1)].map((_, i) => (
        <rect
          key={i}
          x={leftX + i * segW + segW * 0.35}
          y={deckY - 2}
          width={segW * 0.3}
          height={1}
          fill="white"
          opacity={0.35}
          rx={0.5}
        />
      ))}

      {/* Construction sparks at the build front */}
      {sparks.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={1.5 - i * 0.3}
          fill={i === 0 ? '#fbbf24' : '#fb923c'}
          filter="url(#sparkGlow)"
          opacity={0.9 - i * 0.2}
        />
      ))}

      {/* Construction crane (small) at build front */}
      {built > 0 && built < segments && (
        <g transform={`translate(${leftX + built * segW - 2}, ${deckY - 5})`}>
          {/* Crane vertical mast */}
          <line x1="2" y1="0" x2="2" y2={-H * 0.15} stroke="#fbbf24" strokeWidth="1" opacity="0.9" />
          {/* Crane horizontal arm */}
          <line x1="2" y1={-H * 0.15} x2={-12} y2={-H * 0.15} stroke="#fbbf24" strokeWidth="0.8" opacity="0.9" />
          {/* Crane cable */}
          <line x1={-6} y1={-H * 0.15} x2={-6} y2={-4} stroke="#fde68a" strokeWidth="0.5" opacity="0.8" />
          {/* Crane hook */}
          <circle cx={-6} cy={-3} r={1.5} fill="none" stroke="#fde68a" strokeWidth="0.6" opacity="0.8" />
        </g>
      )}

      {/* "COMPLETE" glow pulse when all segments built */}
      {built >= segments && (
        <rect
          x={leftX}
          y={deckY - 6}
          width={deckLen}
          height={7}
          fill="#3b82f6"
          opacity={0.25 + Math.sin(tick * 0.8) * 0.15}
          filter="url(#glow)"
          rx={2}
        />
      )}

      {/* Progress label (small text at bottom) */}
      {!compact && (
        <text
          x={W / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize="7"
          fill="#60a5fa"
          fontFamily="monospace"
          opacity="0.6"
        >
          {Math.round(Math.min((built / segments) * 100, 100))}% COMPLETE
        </text>
      )}
    </svg>
  );
}
