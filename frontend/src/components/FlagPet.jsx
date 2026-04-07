import { useState, useEffect, useRef, useCallback } from "react";
import "./FlagPet.css";

const PHRASES = [
  "Irie! 🌴", "Ya mon!", "No problem!", "One love! ❤️",
  "Respect! ✊", "Wagwan?", "Blessed! 🙏", "Walk good!",
  "Everyting irie!", "Big up! 🇯🇲",
];

const SIDEBAR_W = 240;
const PET_SIZE  = 48;
const MARGIN    = 10;

function randomPos() {
  return {
    x: MARGIN + Math.random() * (SIDEBAR_W - PET_SIZE - MARGIN * 2),
    y: window.innerHeight * 0.5 + Math.random() * (window.innerHeight * 0.5 - PET_SIZE - 70),
  };
}

export default function FlagPet() {
  const initialPos = { x: MARGIN, y: window.innerHeight - 140 };
  const posRef    = useRef(initialPos);
  const [pos,     setPos]      = useState(initialPos);
  const [facing,  setFacing]   = useState(1);
  const [walking, setWalking]  = useState(false);
  const [bouncing,setBouncing] = useState(false);
  const [phrase,  setPhrase]   = useState(null);
  const walkTimer  = useRef(null);
  const phraseTimer = useRef(null);

  useEffect(() => {
    const wander = () => {
      const next = randomPos();
      setFacing(next.x > posRef.current.x ? 1 : -1);
      posRef.current = next;
      setPos(next);
      setWalking(true);
      clearTimeout(walkTimer.current);
      walkTimer.current = setTimeout(() => setWalking(false), 1300);
    };

    const id = setInterval(wander, 4000);
    return () => { clearInterval(id); clearTimeout(walkTimer.current); };
  }, []);

  const handleClick = useCallback(() => {
    const p = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setPhrase(p);
    setBouncing(true);
    clearTimeout(phraseTimer.current);
    phraseTimer.current = setTimeout(() => {
      setPhrase(null);
      setBouncing(false);
    }, 2200);
  }, []);

  return (
    <div
      className={["fp", walking ? "fp--walk" : "", bouncing ? "fp--bounce" : ""].join(" ").trim()}
      style={{ left: pos.x, top: pos.y, transform: `scaleX(${facing})` }}
      onClick={handleClick}
      title="Click me!"
    >
      {phrase && (
        <div className="fp-bubble" style={{ transform: `scaleX(${facing})` }}>
          {phrase}
        </div>
      )}

      {/* Circular Jamaican flag */}
      <svg className="fp-flag" width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="fp-circle">
            <circle cx="24" cy="24" r="24" />
          </clipPath>
        </defs>
        <g clipPath="url(#fp-circle)">
          {/* Gold background (cross) */}
          <rect width="48" height="48" fill="#F0C800" />
          {/* Black left triangle */}
          <polygon points="0,0 0,48 21,24" fill="#000000" />
          {/* Black right triangle */}
          <polygon points="48,0 48,48 27,24" fill="#000000" />
          {/* Green top triangle */}
          <polygon points="0,0 48,0 24,21" fill="#009B3A" />
          {/* Green bottom triangle */}
          <polygon points="0,48 48,48 24,27" fill="#009B3A" />
          {/* Eyes */}
          <circle cx="17" cy="18" r="2.5" fill="#fff" />
          <circle cx="17" cy="18" r="1.2" fill="#1a1a1a" />
          <circle cx="31" cy="18" r="2.5" fill="#fff" />
          <circle cx="31" cy="18" r="1.2" fill="#1a1a1a" />
        </g>
        {/* Circle border */}
        <circle cx="24" cy="24" r="23" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      </svg>

      {/* Little legs */}
      <div className="fp-legs">
        <span className="fp-leg fp-leg--l" />
        <span className="fp-leg fp-leg--r" />
      </div>
    </div>
  );
}
