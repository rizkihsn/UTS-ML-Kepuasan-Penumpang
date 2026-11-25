import json
import os
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request

BASE = Path(__file__).resolve().parent
MODEL_DIR = BASE / "model"

app = Flask(__name__)

# ---------- muat model & metadata sekali saat start ----------
bundle = joblib.load(MODEL_DIR / "model.joblib")
MODEL = bundle["model"]
FEATURES = bundle["features"]
METRICS = json.loads((MODEL_DIR / "metrics.json").read_text())
IMPORTANCE = json.loads((MODEL_DIR / "feature_importance.json").read_text())

# ---------- pemetaan kategorikal (sama dengan train_model.py) ----------
MAPS = {
    "Gender": {"Female": 0, "Male": 1},
    "Customer Type": {"First-time": 0, "Returning": 1},
    "Type of Travel": {"Personal": 0, "Business": 1},
    "Class": {"Economy": 0, "Economy Plus": 1, "Business": 2},
}

RATING_FEATURES = [
    "Departure and Arrival Time Convenience", "Ease of Online Booking",
    "Check-in Service", "Online Boarding", "Gate Location", "On-board Service",
    "Seat Comfort", "Leg Room Service", "Cleanliness", "Food and Drink",
    "In-flight Service", "In-flight Wifi Service", "In-flight Entertainment",
    "Baggage Handling",
]

# Batas nilai numerik: (min, max)
RANGES = {
    "Age": (1, 100),
    "Flight Distance": (1, 10000),
    "Departure Delay": (0, 2000),
    "Arrival Delay": (0, 2000),
}

# Nama fitur dalam Bahasa Indonesia (untuk tampilan)
LABEL_ID = {
    "Gender": "Jenis kelamin",
    "Age": "Usia",
    "Customer Type": "Tipe pelanggan",
    "Type of Travel": "Tujuan perjalanan",
    "Class": "Kelas kabin",
    "Flight Distance": "Jarak penerbangan",
    "Departure Delay": "Keterlambatan keberangkatan",
    "Arrival Delay": "Keterlambatan kedatangan",
    "Departure and Arrival Time Convenience": "Kenyamanan jadwal",
    "Ease of Online Booking": "Kemudahan pemesanan online",
    "Check-in Service": "Layanan check-in",
    "Online Boarding": "Boarding online",
    "Gate Location": "Lokasi gerbang",
    "On-board Service": "Layanan di pesawat",
    "Seat Comfort": "Kenyamanan kursi",
    "Leg Room Service": "Ruang kaki",
    "Cleanliness": "Kebersihan",
    "Food and Drink": "Makanan & minuman",
    "In-flight Service": "Pelayanan awak kabin",
    "In-flight Wifi Service": "Wi-Fi dalam penerbangan",
    "In-flight Entertainment": "Hiburan dalam penerbangan",
    "Baggage Handling": "Penanganan bagasi",
}


class InputError(ValueError):
    pass


def parse_payload(data: dict) -> dict:
    """Validasi input dan ubah ke nilai numerik sesuai urutan fitur model."""
    if not isinstance(data, dict):
        raise InputError("Format data tidak valid.")
    row = {}
    for feat in FEATURES:
        if feat not in data:
            raise InputError(f"Kolom '{LABEL_ID.get(feat, feat)}' belum diisi.")
        value = data[feat]
        if feat in MAPS:
            if value not in MAPS[feat]:
                raise InputError(f"Nilai '{LABEL_ID.get(feat, feat)}' tidak dikenali.")
            row[feat] = MAPS[feat][value]
            continue
        try:
            num = float(value)
        except (TypeError, ValueError):
            raise InputError(f"'{LABEL_ID.get(feat, feat)}' harus berupa angka.")
        if feat in RATING_FEATURES:
            lo, hi = 0, 5
        else:
            lo, hi = RANGES[feat]
        if not (lo <= num <= hi):
            raise InputError(f"'{LABEL_ID.get(feat, feat)}' harus antara {lo} dan {hi}.")
        row[feat] = num
    return row


def predict_with_levers(row: dict) -> dict:
    """Prediksi + dampak jika tiap layanan dinaikkan 1 poin."""
    base = pd.DataFrame([row], columns=FEATURES)
    p_base = float(MODEL.predict_proba(base)[0, 1])

    variants, names = [], []
    for feat in RATING_FEATURES:
        if row[feat] < 5:
            v = dict(row)
            v[feat] = row[feat] + 1
            variants.append(v)
            names.append(feat)
    levers = []
    if variants:
        probs = MODEL.predict_proba(pd.DataFrame(variants, columns=FEATURES))[:, 1]
        for feat, p in zip(names, probs):
            levers.append({
                "feature": feat,
                "label": LABEL_ID[feat],
                "gain": round(float(p) - p_base, 4),
            })
        levers.sort(key=lambda d: d["gain"], reverse=True)
    return {
        "satisfied": p_base >= 0.5,
        "probability": round(p_base, 4),
        "levers": [l for l in levers if l["gain"] > 0.005][:3],
    }


# ---------- rute ----------
@app.route("/")
def index():
    return render_template("index.html", metrics=METRICS)


@app.post("/api/predict")
def api_predict():
    try:
        row = parse_payload(request.get_json(silent=True))
        return jsonify(predict_with_levers(row))
    except InputError as e:
        return jsonify({"error": str(e)}), 400


@app.get("/api/model-info")
def api_model_info():
    top = [
        {**item, "label": LABEL_ID.get(item["feature"], item["feature"])}
        for item in IMPORTANCE[:10]
    ]
    return jsonify({"metrics": METRICS, "importance": top})


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
