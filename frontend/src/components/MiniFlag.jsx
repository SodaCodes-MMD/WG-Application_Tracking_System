import { useState, useEffect, useRef } from "react";
import "./FlagPet.css";

const PHRASES_SAVED = [
  "Everyting irie! 😄", "Ya mon! 🎉", "One love! ❤️", "Blessed! 🙏",
];

const PHRASES_UNSAVED = [
  "Wagwan? 😢", "Save ya work! 🙁", "Don't forget! 😟", "One love! ❤️",
];

const PHRASES_SAVING = [
  "Hold on... ⏳", "Saving ya work! 🕐", "One moment! ⏰",
];

export function MiniFlag({ mood = "saved" }) {
  const [phrase, setPhrase] = useState(null);
  const phraseTimer = useRef(null);

  const isSaving = mood === "saving";
  const isSaved = mood === "saved";

  useEffect(() => {
    const showPhrase = () => {
      const phrases = isSaving ? PHRASES_SAVING : (isSaved ? PHRASES_SAVED : PHRASES_UNSAVED);
      const p = phrases[Math.floor(Math.random() * phrases.length)];
      setPhrase(p);
      clearTimeout(phraseTimer.current);
      phraseTimer.current = setTimeout(() => setPhrase(null), 2000);
    };
    showPhrase();
    const interval = setInterval(showPhrase, 8000);
    return () => {
      clearInterval(interval);
      clearTimeout(phraseTimer.current);
    };
  }, [mood, isSaving, isSaved]);

  const eyeY = 16;
  const eyeRadius = 3;
  const pupilRadius = 1.5;
  const leftEyeX = 17;
  const rightEyeX = 31;
  const mouthY = 28;
  const mouthWidth = 8;

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 48 48"
        style={{ display: "block", flexShrink: 0 }}
      >
        <defs>
          <clipPath id={`fp-circle-mini`}>
            <circle cx="24" cy="24" r="24" />
          </clipPath>
        </defs>
        <g clipPath="url(#fp-circle-mini)">
          <rect width="48" height="48" fill="#F0C800" />
          <polygon points="0,0 0,48 21,24" fill="#000000" />
          <polygon points="48,0 48,48 27,24" fill="#000000" />
          <polygon points="0,0 48,0 24,21" fill="#009B3A" />
          <polygon points="0,48 48,48 24,27" fill="#009B3A" />
          <circle cx="24" cy="24" r="23" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        </g>
        <circle cx={leftEyeX} cy={eyeY} r={eyeRadius} fill="#fff" />
        <circle cx={leftEyeX} cy={eyeY} r={pupilRadius} fill="#1a1a1a" />
        <circle cx={rightEyeX} cy={eyeY} r={eyeRadius} fill="#fff" />
        <circle cx={rightEyeX} cy={eyeY} r={pupilRadius} fill="#1a1a1a" />
        {isSaving ? (
          <ellipse cx="24" cy={mouthY + 2} rx="4" ry="3" fill="#1a1a1a" />
        ) : isSaved ? (
          <path
            d={`M ${24 - mouthWidth} ${mouthY} Q 24 ${mouthY + 6} ${24 + mouthWidth} ${mouthY}`}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d={`M ${24 - mouthWidth} ${mouthY + 4} Q 24 ${mouthY - 2} ${24 + mouthWidth} ${mouthY + 4}`}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
      {phrase && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            color: "#1a1a1a",
            fontSize: "0.72rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            padding: "4px 8px",
            borderRadius: "10px",
            border: "2px solid #F0C800",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            zIndex: 10,
            animation: "fp-pop 0.2s ease-out",
          }}
        >
          {phrase}
        </div>
      )}
    </div>
  );
}

export function SectionSaveButton({ mood = "saved", onClick, disabled, children }) {
  const isSaving = mood === "saving";
  const isSaved = mood === "saved";
  return (
    <button
      type="button"
      className={`btn btn-section-save ${isSaving ? "" : isSaved ? "btn-saved" : "btn-unsaved"}`}
      onClick={onClick}
      disabled={disabled}
    >
      <MiniFlag mood={mood} />
      <span style={{ marginLeft: 8 }}>{children}</span>
    </button>
  );
}
