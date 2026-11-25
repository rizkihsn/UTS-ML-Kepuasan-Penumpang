"""
Latih ulang model Random Forest untuk prediksi kepuasan penumpang maskapai.

Pemakaian:
    python train_model.py path/ke/airline_passenger_satisfaction.csv

"""
import json
import sys
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split

# Pemetaan kolom kategorikal -> angka (dipakai juga oleh app.py)
MAP_GENDER = {"Female": 0, "Male": 1}
MAP_CUSTOMER = {"First-time": 0, "Returning": 1}
MAP_TRAVEL = {"Personal": 0, "Business": 1}
MAP_CLASS = {"Economy": 0, "Economy Plus": 1, "Business": 2}
TARGET_MAP = {"Neutral or Dissatisfied": 0, "Satisfied": 1}

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_OUT_DIR = BASE_DIR / "model"


def preprocess(df: pd.DataFrame):
    df = df.copy()
    df = df.drop(columns=["ID"])
    df["Arrival Delay"] = df["Arrival Delay"].fillna(df["Arrival Delay"].median())
    df["Gender"] = df["Gender"].map(MAP_GENDER)
    df["Customer Type"] = df["Customer Type"].map(MAP_CUSTOMER)
    df["Type of Travel"] = df["Type of Travel"].map(MAP_TRAVEL)
    df["Class"] = df["Class"].map(MAP_CLASS)
    y = df.pop("Satisfaction").map(TARGET_MAP)
    return df, y


def main(csv_path: str, out_dir: Path | str = DEFAULT_OUT_DIR):
    out = Path(out_dir)
    if not out.is_absolute():
        out = BASE_DIR / out
    out.mkdir(parents=True, exist_ok=True)

    raw = pd.read_csv(csv_path)
    X, y = preprocess(raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=18,
        min_samples_leaf=3,
        n_jobs=-1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()

    metrics = {
        "accuracy": round(accuracy_score(y_test, pred), 4),
        "precision": round(precision_score(y_test, pred), 4),
        "recall": round(recall_score(y_test, pred), 4),
        "f1": round(f1_score(y_test, pred), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "n_rows": int(len(raw)),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "n_features": int(X.shape[1]),
        "sklearn_version": sklearn.__version__,
    }
    imp = sorted(
        zip(X.columns, model.feature_importances_), key=lambda t: t[1], reverse=True
    )
    importance = [{"feature": f, "importance": round(float(v), 4)} for f, v in imp]

    joblib.dump({"model": model, "features": list(X.columns)}, out / "model.joblib", compress=3)
    (out / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (out / "feature_importance.json").write_text(json.dumps(importance, indent=2))

    print(json.dumps(metrics, indent=2))
    print("Top 5 fitur:", [i["feature"] for i in importance[:5]])
    print("Ukuran model.joblib: %.1f MB" % ((out / "model.joblib").stat().st_size / 1e6))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Pemakaian: python train_model.py <path-csv>")
    main(sys.argv[1])