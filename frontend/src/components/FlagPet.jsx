import { useState, useEffect, useRef, useCallback } from "react";
import "./FlagPet.css";

const PHRASES = [
  "Irie! 🌴", "Ya mon!", "No problem!", "One love! ❤️",
  "Respect! ✊", "Wagwan?", "Blessed! 🙏", "Walk good!",
  "Everyting irie!", "Big up! 🇯🇲",
];

const JOB_PHRASES = {
  laptop: [
    "Coding time! 💻", "Build build! 🚀", "Git commit! 📝",
    "Debuggin! 🐛", "Ship it! 📦", "Deploy soon! ☁️",
  ],
  resume: [
    "Update time! 📄", "Skills sharp! ⚔️", "Experience grow! 📈",
    "New achievement! 🏆", "Resume game strong! 💪",
  ],
  jobboard: [
    "Job huntin! 🔍", "Apply apply! 📮", "Opportunities! ✨",
    "Interview soon! 🤞", "Dream job incoming! 🌟",
  ],
};

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
  const [jobAction, setJobAction] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const walkTimer  = useRef(null);
  const phraseTimer = useRef(null);
  const workTimer = useRef(null);
  const actionTimer = useRef(null);

  useEffect(() => {
    const wander = () => {
      if (isWorking) return;
      
      const next = randomPos();
      setFacing(next.x > posRef.current.x ? 1 : -1);
      posRef.current = next;
      setPos(next);
      setWalking(true);
      clearTimeout(walkTimer.current);
      walkTimer.current = setTimeout(() => setWalking(false), 1300);
    };

    const id = setInterval(wander, 5000);
    return () => { clearInterval(id); clearTimeout(walkTimer.current); };
  }, [isWorking]);

  useEffect(() => {
    const startJobActivity = () => {
      if (isWorking || walking) return;
      
      const actions = ["laptop", "resume", "jobboard"];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const phrase = JOB_PHRASES[action][Math.floor(Math.random() * JOB_PHRASES[action].length)];
      
      setJobAction(action);
      setPhrase(phrase);
      setIsWorking(true);
      
      clearTimeout(workTimer.current);
      clearTimeout(actionTimer.current);
      workTimer.current = setTimeout(() => {
        setJobAction(null);
        setPhrase(null);
        setIsWorking(false);
      }, 4000);
    };

    const id = setInterval(startJobActivity, 12000);
    return () => {
      clearInterval(id);
      clearTimeout(workTimer.current);
    };
  }, [isWorking, walking]);

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

  const actionIcons = {
    laptop: (
      <g className="fp-job-icon">
        <rect x="8" y="10" width="32" height="22" rx="2" fill="#333" />
        <rect x="10" y="12" width="28" height="16" rx="1" fill="#1a5">
          <animate attributeName="fill" values="#1a5;#2c7;#1a5" dur="0.5s" repeatCount="8" />
        </rect>
        <rect x="20" y="32" width="8" height="4" fill="#333" />
        <rect x="16" y="36" width="16" height="3" rx="1" fill="#444" />
        <rect x="18" y="39" width="12" height="2" fill="#555" />
      </g>
    ),
    resume: (
      <g className="fp-job-icon">
        <rect x="10" y="6" width="28" height="36" rx="2" fill="#f5f5f5" />
        <rect x="14" y="10" width="20" height="2" fill="#333" />
        <rect x="14" y="14" width="16" height="1.5" fill="#666" />
        <rect x="14" y="17" width="18" height="1.5" fill="#666" />
        <rect x="14" y="22" width="20" height="1.5" fill="#333" />
        <rect x="14" y="25" width="14" height="1.5" fill="#666" />
        <rect x="14" y="28" width="16" height="1.5" fill="#666" />
        <rect x="14" y="33" width="20" height="1.5" fill="#333" />
        <rect x="14" y="36" width="12" height="1.5" fill="#666" />
      </g>
    ),
    jobboard: (
      <g className="fp-job-icon">
        <rect x="6" y="8" width="36" height="28" rx="2" fill="#5a3" />
        <rect x="8" y="10" width="14" height="10" rx="1" fill="#fff" opacity="0.9" />
        <rect x="24" y="10" width="16" height="6" rx="1" fill="#fff" opacity="0.9" />
        <rect x="24" y="18" width="12" height="4" rx="1" fill="#fff" opacity="0.7" />
        <rect x="8" y="22" width="32" height="3" rx="1" fill="#fff" opacity="0.5" />
        <rect x="8" y="27" width="20" height="3" rx="1" fill="#fff" opacity="0.5" />
        <rect x="6" y="36" width="36" height="4" rx="1" fill="#3a2" />
      </g>
    ),
  };

  return (
    <div
      className={[
        "fp",
        walking ? "fp--walk" : "",
        bouncing ? "fp--bounce" : "",
        jobAction ? `fp--working fp--${jobAction}` : "",
      ].join(" ").trim()}
      style={{ left: pos.x, top: pos.y, transform: `scaleX(${facing})` }}
      onClick={handleClick}
      title="Click me!"
    >
      {phrase && !jobAction && (
        <div className="fp-bubble" style={{ transform: `scaleX(${facing})` }}>
          {phrase}
        </div>
      )}

      {jobAction && (
        <div className="fp-job-bubble" style={{ transform: `scaleX(${facing})` }}>
          {phrase}
        </div>
      )}

      {/* Main pet container */}
      <div className="fp-pet-body">
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
            {/* Happy mouth when working */}
            {jobAction && (
              <path d={`M 18 28 Q 24 33 30 28`} fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="d" values="M 18 28 Q 24 33 30 28;M 18 28 Q 24 30 30 28;M 18 28 Q 24 33 30 28" dur="0.5s" repeatCount="4" />
              </path>
            )}
          </g>
          {/* Circle border */}
          <circle cx="24" cy="24" r="23" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        </svg>

        {/* Job action icon overlay */}
        {jobAction && (
          <div className="fp-job-icon-container">
            <svg width="40" height="42" viewBox="0 0 40 42">
              {actionIcons[jobAction]}
            </svg>
          </div>
        )}
      </div>

      {/* Little legs */}
      <div className="fp-legs">
        <span className="fp-leg fp-leg--l" />
        <span className="fp-leg fp-leg--r" />
      </div>
    </div>
  );
}
