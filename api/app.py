"""
Student Stress Detector — Flask REST API
Run: python api/app.py
Then POST to http://localhost:5000/predict
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from train_model import StressPredictor, STRESS_LABELS

ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
CORS(app)

MODEL_DIR = os.path.join(ROOT_DIR, "models")

# Load models at startup
predictor = StressPredictor(os.path.join(MODEL_DIR, "primary_model.pkl"))
with open(os.path.join(MODEL_DIR, "model_metadata.json")) as f:
    metadata = json.load(f)

SOLUTIONS_DB = {
    "sleep": {
        "title": "Reset your sleep before the next class day",
        "category": "Sleep hygiene",
        "body": "Irregular sleep makes classes, travel, exams, and hostel life feel heavier. A repeatable night routine is the fastest stabilizer.",
        "tips": ["Fix one wake-up time, even after late study nights", "Keep phone away for the last 25 minutes",
                 "Avoid chai, coffee, or energy drinks after evening snacks", "Use an eye mask or cotton earplugs in hostel rooms"]
    },
    "academics": {
        "title": "Make a 7-day exam and assignment map",
        "category": "Academic strategy",
        "body": "Indian students often juggle internals, practicals, semester exams, coaching, and family expectations. A visible weekly map reduces panic.",
        "tips": ["Write every deadline on one page or calendar", "Use 45-min study blocks with 10-min breaks",
                 "Ask a classmate for notes before the backlog grows", "Meet faculty or a mentor before marks become urgent"]
    },
    "exercise": {
        "title": "Add low-cost movement",
        "category": "Physical wellness",
        "body": "You do not need a gym plan. Regular movement between classes can lower tension and improve sleep.",
        "tips": ["Walk one extra campus round after lunch", "Try 10 minutes of skipping, yoga, or stairs",
                 "Play badminton, cricket, football, or throwball with friends", "Stretch neck and shoulders after long laptop sessions"]
    },
    "mental": {
        "title": "Use small mental-health routines",
        "category": "Mental health",
        "body": "Anxiety, low mood, and pressure around marks are common, but they should not be ignored or hidden.",
        "tips": ["Write the top 3 worries and the next small action for each", "Try 4-4-4 breathing before class or exams",
                 "Tell one trusted friend, sibling, mentor, or warden what is happening", "Take a 15-minute sunlight break without scrolling"]
    },
    "social": {
        "title": "Reconnect without making it a big event",
        "category": "Social connection",
        "body": "Isolation can build quickly in hostel, PG, commute, or online-class routines. One real conversation can soften the day.",
        "tips": ["Call home or a friend for 10 minutes", "Eat one meal with classmates instead of alone",
                 "Join a club, NSS/NCC, sports group, or department activity",
                 "Set boundaries with people who constantly compare marks or placements"]
    },
    "professional": {
        "title": "Talk to a real support person",
        "category": "Professional support",
        "body": "When stress is high, support should be practical and human. Asking for help early is a smart step.",
        "tips": ["Book your college counselor or student welfare office", "Speak with a mentor, class teacher, warden, or trusted adult",
                 "For immediate emotional support in India: Tele-MANAS 14416 or 1-800-891-4416",
                 "If you may harm yourself, contact local emergency services or go to the nearest hospital"]
    },
    "quick_wins": {
        "title": "Five-minute reset",
        "category": "Quick wins (5 min or less)",
        "body": "Use these when the pressure spikes before class, viva, placement prep, or family calls.",
        "tips": ["Wash face and wrists with cool water", "Name 5 things you can see and 4 sounds you can hear",
                 "Step outside the classroom, hostel, or PG for fresh air", "Listen to one familiar song and breathe slowly"]
    },
    "music": {
        "title": "Play a mood-lifting track",
        "category": "Music & Relaxation",
        "body": "Music can interrupt spiralling thoughts and make a study break feel lighter.",
        "tips": [
            "Try calm instrumental music during revision",
            "Use upbeat Bollywood, indie, or regional songs for a short reset",
            "Make a 3-song playlist for breaks only",
            "Avoid sad loops when you are already low"
        ],
        "spotify_link": "https://open.spotify.com/search/stress%20relief"
    }
}


def generate_solutions(result: dict, inputs: dict) -> list:
    """Select relevant solutions based on predicted stress and input signals."""
    solutions = []
    sleep = inputs.get("sleep_hours", 7)
    anxiety = inputs.get("anxiety", 2)
    depression = inputs.get("depression_flag", 0)
    exercise = inputs.get("exercise", 2)
    social = inputs.get("social_isolation", 2)
    study = inputs.get("study_load", 3)
    pct = result["stress_pct"]

    if sleep < 6.5:
        solutions.append(SOLUTIONS_DB["sleep"])
    if study >= 4 or inputs.get("cgpa", 7.5) < 6:
        solutions.append(SOLUTIONS_DB["academics"])
    if exercise >= 3:
        solutions.append(SOLUTIONS_DB["exercise"])
    if anxiety >= 3 or depression >= 2:
        solutions.append(SOLUTIONS_DB["mental"])
    if social >= 3:
        solutions.append(SOLUTIONS_DB["social"])
    if pct >= 70:
        solutions.append(SOLUTIONS_DB["professional"])
    # Always include quick wins and music
    solutions.append(SOLUTIONS_DB["quick_wins"])
    solutions.append(SOLUTIONS_DB["music"])
    return solutions


# ── Routes ────────────────────────────────────────

@app.route("/api", methods=["GET"])
def api_index():
    return jsonify({
        "service": "Student Stress Detector API",
        "version": "1.0.0",
        "endpoints": {
            "POST /predict": "Predict stress level from survey inputs",
            "GET  /health":  "Service health check",
            "GET  /features": "List model features and importance",
            "GET  /metadata": "Model metadata and accuracy stats"
        }
    })


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if os.path.isdir(FRONTEND_DIST):
        file_path = os.path.join(FRONTEND_DIST, path)
        if path and os.path.isfile(file_path):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")

    return jsonify({
        "message": "React frontend has not been built yet.",
        "next_steps": [
            "cd frontend",
            "npm install",
            "npm run build",
            "python ../api/app.py"
        ],
        "api": "/api"
    }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": predictor.model is not None})


@app.route("/metadata", methods=["GET"])
def get_metadata():
    return jsonify(metadata)


@app.route("/features", methods=["GET"])
def get_features():
    importances = joblib.load(os.path.join(MODEL_DIR, "feature_importances.pkl"))
    return jsonify({
        "features": predictor.FEATURE_NAMES,
        "importances": importances.to_dict(),
        "top_5": importances.head(5).to_dict()
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    POST /predict
    Body (JSON):
    {
        "sleep_hours":       7.0,   // 2-10
        "cgpa":              7.5,   // 0-10
        "study_load":        3,     // 1-5
        "attendance":        2,     // 1-4 (1=always, 4=rarely)
        "screen_hours":      4.0,   // 0-12
        "social_isolation":  2,     // 1-4 (1=active, 4=isolated)
        "exercise":          2,     // 1-4 (1=daily, 4=never)
        "weight_change":     0,     // 0-3
        "anxiety":           2,     // 1-5
        "depression_flag":   1,     // 0-4
        "concentration":     1,     // 0-4
        "panic":             0,     // 0-4
        "peer_pressure":     2,     // 1-5
        "home_stress":       2,     // 1-4
        "relationship_stress": 1,  // 0-4
        "financial":         0      // 0-4
    }
    """
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        # Validate types
        numeric_fields = [
            "sleep_hours", "cgpa", "study_load", "attendance", "screen_hours",
            "social_isolation", "exercise", "weight_change", "anxiety",
            "depression_flag", "concentration", "panic", "peer_pressure",
            "home_stress", "relationship_stress", "financial"
        ]
        inputs = {}
        for field in numeric_fields:
            if field in data:
                try:
                    inputs[field] = float(data[field])
                except (ValueError, TypeError):
                    return jsonify({"error": f"Field '{field}' must be numeric"}), 400

        # Run inference
        result = predictor.from_survey(inputs)

        # Add solutions
        solutions = generate_solutions(result, inputs)
        result["solutions"] = solutions

        # Compute factor scores for visualization
        result["factors"] = {
            "Sleep quality":        round(max(0, (8 - inputs.get("sleep_hours", 7)) / 6 * 100)),
            "Academic load":        round(((inputs.get("study_load", 3) - 1) / 4 +
                                           (4 - min(inputs.get("cgpa", 7.5), 4)) / 4 +
                                           inputs.get("financial", 0) / 4) / 3 * 100),
            "Mental health":        round(((inputs.get("anxiety", 2) - 1) +
                                           inputs.get("depression_flag", 0) +
                                           inputs.get("concentration", 1) +
                                           inputs.get("panic", 0)) / 16 * 100),
            "Social environment":   round(((inputs.get("social_isolation", 2) - 1) +
                                           (inputs.get("peer_pressure", 2) - 1) +
                                           (inputs.get("home_stress", 2) - 1) +
                                           inputs.get("relationship_stress", 1)) / 14 * 100),
            "Lifestyle":            round((inputs.get("screen_hours", 4) / 12 +
                                           (inputs.get("exercise", 2) - 1) / 3 +
                                           inputs.get("weight_change", 0) / 3) / 3 * 100),
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/batch_predict", methods=["POST"])
def batch_predict():
    """Predict stress for multiple students at once."""
    try:
        data = request.get_json(force=True)
        if not isinstance(data, list):
            return jsonify({"error": "Body must be a JSON array of student objects"}), 400
        results = []
        for i, student in enumerate(data):
            result = predictor.from_survey(student)
            result["student_index"] = i
            results.append(result)
        summary = {
            "total": len(results),
            "low_count": sum(1 for r in results if r["stress_level"] == 0),
            "moderate_count": sum(1 for r in results if r["stress_level"] == 1),
            "high_count": sum(1 for r in results if r["stress_level"] == 2),
            "avg_stress_pct": round(np.mean([r["stress_pct"] for r in results]), 1),
        }
        return jsonify({"summary": summary, "results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("\n  Student Stress Detector API")
    print(f"  Primary model accuracy: {metadata['primary']['accuracy']*100:.1f}%")

    port = int(os.environ.get("PORT", 5000))
    print(f"  Running on port {port}\n")

    app.run(host="0.0.0.0", port=port)
