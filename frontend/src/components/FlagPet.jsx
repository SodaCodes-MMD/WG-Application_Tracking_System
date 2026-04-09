import { useState, useEffect, useRef, useCallback } from "react";
import "./FlagPet.css";

const BOUNCE_PHRASES = [
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

const PET_SIZE = 48;
const COLUMN_WIDTH = 200;
const COLUMN_START_Y = 350;
const SPEED = 0.8;
const BUBBLE_HEIGHT = 50;

function getBubblePosition(pos) {
  const bubbleWidth = 140;
  const bubbleHeight = BUBBLE_HEIGHT;
  const padding = 5;
  
  const viewportWidth = window.innerWidth;
  
  const tabZoneBottom = 300;
  
  let top = PET_SIZE + padding;
  let left = 0;
  
  left = -bubbleWidth / 2 + PET_SIZE / 2;
  
  const bubbleTopY = pos.y - bubbleHeight - padding;
  
  const wouldBlockTabs = bubbleTopY < tabZoneBottom && pos.y < tabZoneBottom;
  
  if (wouldBlockTabs) {
    top = PET_SIZE + padding;
  } else {
    top = -bubbleHeight - padding;
  }
  
  const bubbleLeftX = pos.x + left;
  if (bubbleLeftX < padding) {
    left = padding - pos.x;
  }
  
  const bubbleRightX = pos.x + left + bubbleWidth;
  if (bubbleRightX > viewportWidth - padding) {
    left = viewportWidth - pos.x - bubbleWidth - padding;
  }
  
  return { top, left };
}

export default function FlagPet() {
  const [pos, setPos] = useState({ x: COLUMN_WIDTH / 2, y: 500 });
  const [bouncing, setBouncing] = useState(false);
  const [phrase, setPhrase] = useState(null);
  const [phraseType, setPhraseType] = useState("bounce");
  const [jobAction, setJobAction] = useState(null);
  
  const posRef = useRef({ x: COLUMN_WIDTH / 2, y: 500 });
  const velocityRef = useRef({ x: SPEED, y: SPEED * 0.7 });
  const isWorkingRef = useRef(false);
  const animationRef = useRef(null);
  const bounceTimer = useRef(null);
  const phraseTimer = useRef(null);
  const workTimer = useRef(null);
  const phraseDisplayTimer = useRef(null);
  const periodicPhraseTimer = useRef(null);

  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    isWorkingRef.current = isWorking;
  }, [isWorking]);

  useEffect(() => {
    const showPeriodicPhrase = () => {
      if (isWorkingRef.current) return;
      
      const p = BOUNCE_PHRASES[Math.floor(Math.random() * BOUNCE_PHRASES.length)];
      setPhrase(p);
      setPhraseType("bounce");
      setBouncing(true);
      
      clearTimeout(bounceTimer.current);
      clearTimeout(phraseTimer.current);
      
      bounceTimer.current = setTimeout(() => setBouncing(false), 600);
      phraseTimer.current = setTimeout(() => setPhrase(null), 2000);
    };

    showPeriodicPhrase();
    periodicPhraseTimer.current = setInterval(showPeriodicPhrase, 8000);

    return () => {
      clearInterval(periodicPhraseTimer.current);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      if (isWorkingRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const pos = posRef.current;
      const velocity = velocityRef.current;

      pos.x += velocity.x;
      pos.y += velocity.y;

      const minY = COLUMN_START_Y;
      const maxY = window.innerHeight - PET_SIZE - 100;
      const maxX = COLUMN_WIDTH - PET_SIZE - 10;
      const minX = 10;

      if (pos.y <= minY || pos.y >= maxY) {
        velocity.y *= -1;
        pos.y = Math.max(minY, Math.min(maxY, pos.y));
      }

      if (pos.x <= minX || pos.x >= maxX) {
        velocity.x *= -1;
        pos.x = Math.max(minX, Math.min(maxX, pos.x));
      }

      pos.x = Math.max(minX, Math.min(maxX, pos.x));
      pos.y = Math.max(minY, Math.min(maxY, pos.y));

      posRef.current = pos;
      setPos({ ...pos });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const doJobAction = () => {
      if (isWorkingRef.current) return;
      
      const actions = ["laptop", "resume", "jobboard"];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const jobPhrase = JOB_PHRASES[action][Math.floor(Math.random() * JOB_PHRASES[action].length)];
      
      setJobAction(action);
      setPhrase(jobPhrase);
      setPhraseType("job");
      setIsWorking(true);
      setBouncing(false);
      
      clearTimeout(phraseTimer.current);
      clearTimeout(bounceTimer.current);
      
      const workDuration = 5000 + Math.random() * 2000;
      
      clearTimeout(workTimer.current);
      workTimer.current = setTimeout(() => {
        setJobAction(null);
        setIsWorking(false);
        
        const afterPhrase = BOUNCE_PHRASES[Math.floor(Math.random() * BOUNCE_PHRASES.length)];
        setPhrase(afterPhrase);
        setPhraseType("bounce");
        setBouncing(true);
        
        phraseDisplayTimer.current = setTimeout(() => {
          setPhrase(null);
          setBouncing(false);
        }, 2500);
        
      }, workDuration);
    };

    const id = setInterval(doJobAction, 30000);
    return () => {
      clearInterval(id);
      clearTimeout(workTimer.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    const p = BOUNCE_PHRASES[Math.floor(Math.random() * BOUNCE_PHRASES.length)];
    setPhrase(p);
    setPhraseType("bounce");
    setBouncing(true);
    clearTimeout(phraseTimer.current);
    phraseTimer.current = setTimeout(() => {
      setPhrase(null);
      setBouncing(false);
    }, 2200);
  }, []);

  const bubbleStyle = {
    position: "absolute",
    ...getBubblePosition(pos),
    zIndex: 100,
    pointerEvents: "none",
  };

  const renderJobIcon = () => {
    if (jobAction === "laptop") {
      return (
        <svg width="44" height="44" viewBox="0 0 44 44" className="fp-action-icon">
          <rect x="6" y="8" width="32" height="22" rx="3" fill="#2c3e50" />
          <rect x="8" y="10" width="28" height="17" rx="2" fill="#27ae60">
            <animate attributeName="fill" values="#27ae60;#2ecc71;#27ae60" dur="0.6s" repeatCount="8" />
          </rect>
          <rect x="17" y="30" width="10" height="5" fill="#2c3e50" />
          <rect x="12" y="35" width="20" height="4" rx="2" fill="#34495e" />
          <text x="22" y="22" fontSize="6" fill="#fff" textAnchor="middle">code</text>
        </svg>
      );
    }
    if (jobAction === "resume") {
      return (
        <svg width="44" height="44" viewBox="0 0 44 44" className="fp-action-icon">
          <rect x="10" y="4" width="24" height="36" rx="2" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" />
          <rect x="13" y="8" width="18" height="2" fill="#2c3e50" />
          <rect x="13" y="12" width="14" height="1.5" fill="#7f8c8d" />
          <rect x="13" y="15" width="16" height="1.5" fill="#7f8c8d" />
          <rect x="13" y="19" width="18" height="2" fill="#2c3e50" />
          <rect x="13" y="23" width="12" height="1.5" fill="#7f8c8d" />
          <rect x="13" y="26" width="14" height="1.5" fill="#7f8c8d" />
          <rect x="13" y="31" width="18" height="2" fill="#2c3e50" />
          <rect x="13" y="35" width="10" height="1.5" fill="#7f8c8d" />
        </svg>
      );
    }
    if (jobAction === "jobboard") {
      return (
        <svg width="44" height="44" viewBox="0 0 44 44" className="fp-action-icon">
          <rect x="4" y="6" width="36" height="30" rx="3" fill="#3498db" />
          <rect x="6" y="8" width="14" height="10" rx="1" fill="#fff" opacity="0.95" />
          <rect x="22" y="8" width="16" height="5" rx="1" fill="#fff" opacity="0.9" />
          <rect x="22" y="15" width="12" height="3" rx="1" fill="#fff" opacity="0.7" />
          <rect x="6" y="20" width="32" height="3" rx="1" fill="#fff" opacity="0.6" />
          <rect x="6" y="25" width="24" height="3" rx="1" fill="#fff" opacity="0.5" />
          <rect x="4" y="36" width="36" height="4" rx="2" fill="#2980b9" />
          <circle cx="32" cy="38" r="3" fill="#e74c3c">
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="6" />
          </circle>
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      className={[
        "fp",
        bouncing ? "fp--bounce" : "",
        jobAction ? `fp--working fp--${jobAction}` : "",
      ].join(" ").trim()}
      style={{ left: pos.x, top: pos.y }}
      onClick={handleClick}
      title="Click me!"
    >
      {phrase && (
        <div className="fp-bubble-wrapper" style={bubbleStyle}>
          <div className={phraseType === "job" ? "fp-job-bubble" : "fp-bubble"}>
            <span className="fp-bubble-text">{phrase}</span>
          </div>
        </div>
      )}

      <div className="fp-pet-body">
        <svg className="fp-flag" width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="fp-circle">
              <circle cx="24" cy="24" r="24" />
            </clipPath>
          </defs>
          <g clipPath="url(#fp-circle)">
            <rect width="48" height="48" fill="#F0C800" />
            <polygon points="0,0 0,48 21,24" fill="#000000" />
            <polygon points="48,0 48,48 27,24" fill="#000000" />
            <polygon points="0,0 48,0 24,21" fill="#009B3A" />
            <polygon points="0,48 48,48 24,27" fill="#009B3A" />
            <circle cx="17" cy="18" r="2.5" fill="#fff" />
            <circle cx="17" cy="18" r="1.2" fill="#1a1a1a" />
            <circle cx="31" cy="18" r="2.5" fill="#fff" />
            <circle cx="31" cy="18" r="1.2" fill="#1a1a1a" />
            {jobAction && (
              <path d="M 18 27 Q 24 32 30 27" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="d" values="M 18 27 Q 24 32 30 27;M 18 27 Q 24 29 30 27;M 18 27 Q 24 32 30 27" dur="0.5s" repeatCount="7" />
              </path>
            )}
          </g>
          <circle cx="24" cy="24" r="23" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        </svg>

        {jobAction && (
          <div className="fp-action-icon-wrapper">
            {renderJobIcon()}
          </div>
        )}
      </div>

      <div className="fp-legs">
        <span className="fp-leg fp-leg--l" />
        <span className="fp-leg fp-leg--r" />
      </div>
    </div>
  );
}
