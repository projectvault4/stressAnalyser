import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const EXPECTED_API_VERSION = "2026-05-11-stress-score-v3";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

const wheelActivities = [
  { title: "Badminton", lines: ["Play", "Badminton"], color: "#ffdc37" },
  { title: "Dance Break", lines: ["Dance", "Break"], color: "#74d8ff" },
  { title: "Doodle Art", lines: ["Doodle", "Art"], color: "#ff8fb3" },
  { title: "Call Friend", lines: ["Call a", "Friend"], color: "#7fd45d" },
  { title: "Campus Walk", lines: ["Campus", "Walk"], color: "#fff8e6" },
  { title: "Sing Along", lines: ["Sing", "Along"], color: "#ffdc37" },
  { title: "Board Game", lines: ["Board", "Game"], color: "#74d8ff" },
  { title: "Make Chai", lines: ["Make", "Chai"], color: "#ff8fb3" },
  { title: "Yoga Stretch", lines: ["Yoga", "Stretch"], color: "#7fd45d" },
  { title: "Photo Walk", lines: ["Photo", "Walk"], color: "#fff8e6" }
];

function polarToCartesian(cx, cy, radius, angle) {
  const radians = (angle - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function describeSlice(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function StressBusterGame() {
  const [rotation, setRotation] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState("Spin for a mood-brightening activity");
  const [spinning, setSpinning] = useState(false);

  const spinWheel = () => {
    if (spinning) return;

    const pickedIndex = Math.floor(Math.random() * wheelActivities.length);
    const segmentAngle = 360 / wheelActivities.length;
    const pickedCenter = pickedIndex * segmentAngle + segmentAngle / 2;
    const currentTurn = ((rotation % 360) + 360) % 360;
    const targetTurn = (360 - pickedCenter) % 360;
    const landingTurn = (targetTurn - currentTurn + 360) % 360;
    const nextRotation = rotation + 2160 + landingTurn;

    setSpinning(true);
    setRotation(nextRotation);
    window.setTimeout(() => {
      setSelectedActivity(wheelActivities[pickedIndex].title);
      setSpinning(false);
    }, 2600);
  };

  return (
    <div className="stress-game">
      <h3>Activity Spin Wheel</h3>
      <div className="wheel-wrap">
        <div className="wheel-pointer" />
        <div className="wheel-rotor" style={{ transform: `rotate(${rotation}deg)` }}>
          <svg className="activity-wheel" viewBox="0 0 320 320" aria-label="Spinning activity wheel">
            {wheelActivities.map((activity, index) => (
              <g key={activity.title}>
                <path
                  d={describeSlice(160, 160, 150, index * 36, (index + 1) * 36)}
                  fill={activity.color}
                />
                <text
                  className="wheel-svg-label"
                  x={polarToCartesian(160, 160, 96, index * 36 + 18).x}
                  y={polarToCartesian(160, 160, 96, index * 36 + 18).y}
                >
                  <tspan x={polarToCartesian(160, 160, 96, index * 36 + 18).x} dy="-5">{activity.lines[0]}</tspan>
                  <tspan x={polarToCartesian(160, 160, 96, index * 36 + 18).x} dy="15">{activity.lines[1]}</tspan>
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="wheel-hub" aria-hidden="true" />
        <button className="wheel-center" onClick={spinWheel} disabled={spinning} type="button">
          {spinning ? "..." : "SPIN"}
        </button>
      </div>
      <p className="wheel-result">{selectedActivity}</p>
    </div>
  );
}

// Cute Animations Component
function CuteAnimations() {
  return (
    <div className="cute-animations">
      <div className="floating-emoji emoji-1">✨</div>
      <div className="floating-emoji emoji-2">🌸</div>
      <div className="floating-emoji emoji-3">🦋</div>
      <div className="floating-emoji emoji-4">🌟</div>
      <div className="bouncing-blob blob-1" />
      <div className="bouncing-blob blob-2" />
      <div className="bouncing-blob blob-3" />
    </div>
  );
}

const fieldGroups = [
  {
    title: "Lifestyle",
    fields: [
      { name: "sleep_hours", label: "Sleep hours", min: 2, max: 10, step: 0.5, value: 6 },
      { name: "screen_hours", label: "Screen hours", min: 0, max: 12, step: 0.5, value: 5 },
      { name: "exercise", label: "Exercise gap", min: 1, max: 4, step: 1, value: 2 },
      { name: "weight_change", label: "Weight change", min: 0, max: 3, step: 1, value: 0 }
    ]
  },
  {
    title: "Academics",
    fields: [
      { name: "cgpa", label: "CGPA", min: 0, max: 10, step: 0.1, value: 7.5 },
      { name: "study_load", label: "Study load", min: 1, max: 5, step: 1, value: 3 },
      { name: "attendance", label: "Attendance strain", min: 1, max: 4, step: 1, value: 2 },
      { name: "financial", label: "Financial pressure", min: 0, max: 4, step: 1, value: 1 }
    ]
  },
  {
    title: "Mind and Social",
    fields: [
      { name: "anxiety", label: "Anxiety", min: 1, max: 5, step: 1, value: 2 },
      { name: "depression_flag", label: "Low mood", min: 0, max: 4, step: 1, value: 1 },
      { name: "concentration", label: "Focus difficulty", min: 0, max: 4, step: 1, value: 1 },
      { name: "panic", label: "Panic frequency", min: 0, max: 4, step: 1, value: 0 },
      { name: "social_isolation", label: "Isolation", min: 1, max: 4, step: 1, value: 2 },
      { name: "peer_pressure", label: "Peer pressure", min: 1, max: 5, step: 1, value: 2 },
      { name: "home_stress", label: "Home stress", min: 1, max: 4, step: 1, value: 2 },
      { name: "relationship_stress", label: "Relationship stress", min: 0, max: 4, step: 1, value: 1 }
    ]
  }
];

const defaultInputs = fieldGroups
  .flatMap((group) => group.fields)
  .reduce((values, field) => ({ ...values, [field.name]: field.value }), {});

function clampPct(value) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function calculateFactorScores(inputs) {
  return {
    "Sleep strain": clampPct((8 - inputs.sleep_hours) / 6 * 100),
    "Academic pressure": clampPct((
      (10 - inputs.cgpa) / 10 +
      (inputs.study_load - 1) / 4 +
      (inputs.attendance - 1) / 3 +
      inputs.financial / 4
    ) / 4 * 100),
    "Mental strain": clampPct((
      (inputs.anxiety - 1) / 4 +
      inputs.depression_flag / 4 +
      inputs.concentration / 4 +
      inputs.panic / 4
    ) / 4 * 100),
    "Social pressure": clampPct((
      (inputs.social_isolation - 1) / 3 +
      (inputs.peer_pressure - 1) / 4 +
      (inputs.home_stress - 1) / 3 +
      inputs.relationship_stress / 4
    ) / 4 * 100),
    "Lifestyle strain": clampPct((
      inputs.screen_hours / 12 +
      (inputs.exercise - 1) / 3 +
      inputs.weight_change / 3
    ) / 3 * 100)
  };
}

function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const stressTone = useMemo(() => {
    const label = result?.stress_label?.toLowerCase();
    if (label === "high") return "high";
    if (label === "moderate") return "moderate";
    return "low";
  }, [result]);

  const factorScores = useMemo(() => {
    if (result?.api_version === EXPECTED_API_VERSION && result.factors) {
      return result.factors;
    }

    return calculateFactorScores(inputs);
  }, [inputs, result]);

  function updateField(name, value) {
    setInputs((current) => ({ ...current, [name]: Number(value) }));
  }

  async function predictStress(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/predict"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="intro">
          <h1>Student Stress Detector</h1>
          <div className="poster-strip" aria-hidden="true">
            <span>Sleep</span>
            <span>Study</span>
            <span>Mood</span>
            <span>Support</span>
          </div>
        </div>

        <form className="survey-panel" onSubmit={predictStress}>
          {fieldGroups.map((group) => (
            <fieldset key={group.title}>
              <legend>{group.title}</legend>
              <div className="field-grid">
                {group.fields.map((field) => (
                  <label className="field" key={field.name}>
                    <span>
                      {field.label}
                      <strong>{inputs[field.name]}</strong>
                    </span>
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={inputs[field.name]}
                      onChange={(event) => updateField(field.name, event.target.value)}
                    />
                    <small>
                      {field.min} to {field.max}
                    </small>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Predict stress"}
            </button>
            {error ? <p className="error">{error}</p> : null}
          </div>
        </form>
      </section>

      <aside className={`results-panel ${result ? stressTone : ""}`}>
        {result ? (
          <>
            <p className="eyebrow">Prediction</p>
            <div className="score-row">
              <div>
                <h2>{result.stress_label}</h2>
                <p>{result.confidence}% model confidence</p>
              </div>
              <div className="score-ring" style={{ "--score": `${result.stress_pct}%` }}>
                <span>
                  {result.stress_pct}%
                  <small>Stress</small>
                </span>
              </div>
            </div>

            <section>
              <h3>Probabilities</h3>
              {Object.entries(result.probabilities).map(([label, value]) => (
                <div className="bar-row" key={label}>
                  <span>{label}</span>
                  <div>
                    <i style={{ width: `${value}%` }} />
                  </div>
                  <strong>{value}%</strong>
                </div>
              ))}
            </section>

            <section>
              <h3>Factor Scores</h3>
              <div className="factor-grid">
                {Object.entries(factorScores).map(([label, value]) => (
                  <div className="factor" key={label}>
                    <span>{label}</span>
                    <strong>{value}%</strong>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3>Recommended Actions</h3>
              <div className="solutions">
                {result.solutions.map((solution) => (
                  <article key={solution.title}>
                    <p>{solution.category}</p>
                    <h4>{solution.title}</h4>
                    <ul>
                      {solution.tips.slice(0, 3).map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                    {solution.spotify_link && (
                      <a href={solution.spotify_link} target="_blank" rel="noopener noreferrer" className="spotify-btn">
                        🎵 Open on Spotify
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            <CuteAnimations />
            <p className="eyebrow">Ready</p>
            <h2>Run a survey to see the model response.</h2>
            <StressBusterGame />
          </div>
        )}
      </aside>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
