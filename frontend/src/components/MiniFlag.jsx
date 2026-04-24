import React, { useState, useEffect, useRef } from "react";
import "./FlagPet.css";

const PHRASES_SAVED = [
  "Everyting irie! 😄", "Ya mon! 🎉", "One love! ❤️", "Blessed! 🙏",
  "Wah gwaan! ✨", "Selecta! 🎵", "irie vibes! 🌴",
];

const PHRASES_UNSAVED = [
  "Wagwan? 😢", "Save ya work! 🙁", "Don't forget! 😟", "One love! ❤️",
  "Check it! 📝", "Ya work need ya! 😔",
];

const PHRASES_SAVING = [
  "Hold on... ⏳", "Saving ya work! 🕐", "One moment! ⏰",
  "Processing! ⚙️", "Soon come! 🏃",
];

const ANIMATIONS = [
  "fp-bounce-gentle",
  "fp-wiggle",
  "fp-spin",
  "fp-jump",
  "fp-squish",
];

export function MiniFlag({ mood = "saved" }) {
  const [phrase, setPhrase] = useState(null);
  const [animClass, setAnimClass] = useState("");
  const [isDancing, setIsDancing] = useState(false);
  const phraseTimer = useRef(null);

  const isSaving = mood === "saving";
  const isSaved = mood === "saved";

  useEffect(() => {
    const showPhrase = () => {
      const currentPhrases = isSaving ? PHRASES_SAVING : (isSaved ? PHRASES_SAVED : PHRASES_UNSAVED);
      const p = currentPhrases[Math.floor(Math.random() * currentPhrases.length)];
      setPhrase(p);
      clearTimeout(phraseTimer.current);
      phraseTimer.current = setTimeout(() => setPhrase(null), 2500);
    };
    
    const triggerRandomAnim = () => {
      if (Math.random() > 0.5) {
        const anim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
        setAnimClass(anim);
        setIsDancing(true);
        setTimeout(() => {
          setAnimClass("");
          setIsDancing(false);
        }, 1500);
      }
    };

    showPhrase();
    const phraseInterval = setInterval(showPhrase, 7000);
    const animInterval = setInterval(triggerRandomAnim, 5000);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(animInterval);
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
    <div 
      className={`mini-flag-container ${isDancing ? "dancing" : ""}`}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 48 48"
        className={`mini-flag-svg ${animClass}`}
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
        {isDancing && (
          <>
            <circle cx="10" cy="24" r="4" fill="#F0C800" stroke="#1a1a1a" strokeWidth="1">
              <animate attributeName="cx" values="10;8;12;10" dur="0.3s" repeatCount="3" />
            </circle>
            <circle cx="38" cy="24" r="4" fill="#F0C800" stroke="#1a1a1a" strokeWidth="1">
              <animate attributeName="cx" values="38;40;36;38" dur="0.3s" repeatCount="3" />
            </circle>
          </>
        )}
      </svg>
      
      {phrase && (
        <div
          className="mini-flag-bubble"
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
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (isSaved) {
      const addSparkle = () => {
        const newSparkle = {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 30 + 5,
        };
        setSparkles((prev) => [...prev.slice(-3), newSparkle]);
        setTimeout(() => {
          setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
        }, 1000);
      };
      const interval = setInterval(addSparkle, 800);
      return () => clearInterval(interval);
    }
  }, [isSaved]);

  return (
    <button
      type="button"
      className={`btn btn-section-save ${isSaving ? "" : isSaved ? "btn-saved" : "btn-unsaved"} ${isSaving ? "btn-saving" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
      <MiniFlag mood={mood} />
      <span style={{ marginLeft: 8 }}>{children}</span>
    </button>
  );
}
