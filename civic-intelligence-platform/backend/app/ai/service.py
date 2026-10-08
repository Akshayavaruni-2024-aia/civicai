"""Isolated AI module. To change provider, only edit _llm() below.
Without AI_API_KEY everything still works through the keyword fallback."""
import os, re, json, base64, logging
import requests

log = logging.getLogger(__name__)
CATEGORIES = ["Pothole", "Garbage", "Water Leakage", "Drainage", "Streetlight", "Road Damage", "Fallen Tree", "Other"]
DEPT = {"Pothole": "Roads & Engineering", "Road Damage": "Roads & Engineering", "Garbage": "Sanitation",
        "Water Leakage": "Water Supply", "Drainage": "Drainage Department", "Streetlight": "Electrical Department",
        "Fallen Tree": "Parks & Horticulture", "Other": "General Administration"}
KEYS = {"Pothole": ["pothole", "crater", "hole in the road", "hole on road"],
        "Garbage": ["garbage", "trash", "waste", "dump", "litter", "rubbish", "dustbin"],
        "Water Leakage": ["water leak", "leakage", "leak", "pipe burst", "burst pipe", "pipeline", "water wastage"],
        "Drainage": ["drain", "sewage", "sewer", "manhole", "clog", "waterlogging", "stagnant"],
        "Streetlight": ["streetlight", "street light", "lamp", "light not working", "dark", "bulb"],
        "Road Damage": ["road damage", "damaged road", "crack", "broken road", "sinkhole", "footpath", "cave"],
        "Fallen Tree": ["tree", "branch", "fallen"]}
CRIT = ["open manhole", "school", "hospital", "live wire", "exposed wire", "wires exposed", "sparking", "accident", "collapsed", "flood", "highway", "children", "gas"]
HIGH = ["large", "big", "deep", "huge", "dangerous", "major", "blocked", "burst", "blocking", "overflow", "unsafe", "burning", "night"]
LOW = ["minor", "slight", "tiny"]
BASE = {"Low": 20, "Medium": 50, "High": 75, "Critical": 90}
CAT_BONUS = {"Pothole": 5, "Fallen Tree": 5, "Drainage": 3, "Water Leakage": 2}


def band(score):
    return "Critical" if score >= 90 else "High" if score >= 70 else "Medium" if score >= 40 else "Low"


def _heuristic(text):
    t = text.lower()
    scores = {c: sum(t.count(k) for k in ks) for c, ks in KEYS.items()}
    cat = max(scores, key=scores.get) if max(scores.values()) > 0 else "Other"
    sev = "Critical" if any(k in t for k in CRIT) else "High" if any(k in t for k in HIGH) else "Low" if any(k in t for k in LOW) else "Medium"
    return cat, sev


def score(severity, text, category, reports=1):
    t = text.lower()
    s = BASE.get(severity, 50) + CAT_BONUS.get(category, 0)
    s += 6 if any(k in t for k in CRIT) and severity != "Critical" else 0
    s += min(10, 2 * (reports - 1))
    return max(0, min(100, s))


def _llm(system, content, max_tokens=500):
    key = os.getenv("AI_API_KEY")
    if not key:
        return None
    try:
        r = requests.post("https://api.anthropic.com/v1/messages", timeout=40,
                          headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                          json={"model": os.getenv("AI_MODEL", "claude-sonnet-4-6"), "max_tokens": max_tokens,
                                "system": system, "messages": [{"role": "user", "content": content}]})
        r.raise_for_status()
        return "".join(b.get("text", "") for b in r.json()["content"])
    except Exception as e:
        log.warning("AI unavailable, using fallback: %s", e)
        return None


def analyze(text, category_hint=None, image_path=None, reports=1, use_llm=True):
    """Returns category, severity, priority, department, summary, source."""
    cat, sev = _heuristic(text)
    summary, source = "Analysed by built-in keyword engine.", "fallback"
    if use_llm and os.getenv("AI_API_KEY"):
        content = []
        if image_path and os.path.exists(image_path):
            ext = image_path.rsplit(".", 1)[-1].lower()
            with open(image_path, "rb") as f:
                content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png" if ext == "png" else "image/jpeg",
                                                            "data": base64.b64encode(f.read()).decode()}})
        content.append({"type": "text", "text": f"Complaint: {text}\nUser-chosen category: {category_hint or 'none'}"})
        out = _llm("You triage civic complaints. Reply with ONLY JSON: {\"category\": one of " + json.dumps(CATEGORIES) +
                   ", \"severity\": Low|Medium|High|Critical, \"summary\": one sentence}. Consider public safety.", content)
        m = re.search(r"\{.*\}", out or "", re.S)
        if m:
            try:
                j = json.loads(m.group(0))
                if j.get("category") in CATEGORIES: cat = j["category"]
                if j.get("severity") in BASE: sev = j["severity"]
                summary, source = j.get("summary") or summary, "ai"
            except ValueError:
                pass
    elif category_hint in CATEGORIES and cat == "Other":
        cat = category_hint
    pr = score(sev, text, cat, reports)
    return {"category": cat, "severity": band(pr), "priority": pr, "department": DEPT[cat], "summary": summary, "source": source}


def chat(question, context):
    return _llm("You are the Civic Assistant for a city complaint platform. Answer briefly and helpfully using ONLY this JSON "
                "data about the user's complaints and the city. If unsure, say so.\nDATA: " + json.dumps(context), question, 400)
