import os, re, uuid
from collections import Counter, defaultdict
from datetime import datetime
from difflib import SequenceMatcher
from functools import wraps
from math import radians, sin, cos, asin, sqrt
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import or_
from .models import db, User, Department, Complaint, ComplaintReport, ComplaintUpdate, Notification, Feedback
from .ai import service as ai

bp = Blueprint("api", __name__, url_prefix="/api")
OPEN = ("Pending", "Assigned", "In Progress", "Reopened")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def err(msg, code=400): return jsonify({"error": msg}), code
def cur(): return db.session.get(User, int(get_jwt_identity()))


def roles(*allowed):
    def deco(f):
        @wraps(f)
        def w(*a, **k):
            u = cur()
            if not u or u.role not in allowed:
                return err("You do not have permission for this action.", 403)
            return f(*a, **k)
        return jwt_required()(w)
    return deco


def notify(uid, msg, cid=None):
    db.session.add(Notification(user_id=uid, message=msg, complaint_id=cid))


def notify_reporters(c, msg):
    for uid in {c.citizen_id} | {r.citizen_id for r in c.reports}:
        notify(uid, msg, c.id)


def save_image(file):
    """Validate (extension + real file signature + size) and store. Returns (filename, error)."""
    if not file or not file.filename:
        return None, None
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("jpg", "jpeg", "png"):
        return None, "Only JPG, JPEG or PNG images are allowed."
    head = file.stream.read(8); file.stream.seek(0)
    if not (head.startswith(b"\x89PNG") or head.startswith(b"\xff\xd8")):
        return None, "That file is not a valid image."
    name = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(current_app.config["UPLOAD_FOLDER"], name))
    return name, None


def upath(n): return os.path.join(current_app.config["UPLOAD_FOLDER"], n) if n else None


def km(a, b, c, d):
    a, b, c, d = map(radians, (a, b, c, d))
    return 6371 * 2 * asin(sqrt(sin((c - a) / 2) ** 2 + cos(a) * cos(c) * sin((d - b) / 2) ** 2))


def can_view(u, c):
    if u.role == "admin": return True
    if u.role == "officer": return c.officer_id == u.id or c.department_id == u.department_id
    return c.citizen_id == u.id or any(r.citizen_id == u.id for r in c.reports)


def visible_query(u):
    q = Complaint.query
    if u.role == "officer":
        q = q.filter(or_(Complaint.officer_id == u.id, Complaint.department_id == u.department_id))
    elif u.role == "citizen":
        ids = [r.complaint_id for r in ComplaintReport.query.filter_by(citizen_id=u.id)]
        q = q.filter(or_(Complaint.citizen_id == u.id, Complaint.id.in_(ids)))
    return q


def log_update(c, u, status, remarks, img=None):
    db.session.add(ComplaintUpdate(complaint_id=c.id, user_id=u.id if u else None, status=status, remarks=remarks, image_path=img))


def pick_officer(dept_id):
    offs = User.query.filter_by(role="officer", department_id=dept_id).all()
    if not offs: return None
    load = lambda o: Complaint.query.filter(Complaint.officer_id == o.id, Complaint.status.in_(OPEN)).count()
    return min(offs, key=load)


# ---------- auth ----------
@bp.post("/auth/register")
def register():
    d = request.get_json(silent=True) or {}
    name, email, pw = (d.get("name") or "").strip(), (d.get("email") or "").strip().lower(), d.get("password") or ""
    if not name or not email or not pw: return err("Name, email and password are required.")
    if not EMAIL.match(email): return err("Please enter a valid email address.")
    if len(pw) < 6: return err("Password must be at least 6 characters.")
    if User.query.filter_by(email=email).first(): return err("An account with this email already exists.", 409)
    u = User(name=name, email=email, role="citizen", phone=(d.get("phone") or "").strip(), password_hash=User.hash(pw))
    db.session.add(u); db.session.commit()
    return jsonify({"token": create_access_token(identity=str(u.id)), "user": u.to_dict()}), 201


@bp.post("/auth/login")
def login():
    d = request.get_json(silent=True) or {}
    u = User.query.filter_by(email=(d.get("email") or "").strip().lower()).first()
    if not u or not u.check(d.get("password") or ""): return err("Invalid email or password.", 401)
    return jsonify({"token": create_access_token(identity=str(u.id)), "user": u.to_dict()})


@bp.get("/auth/me")
@jwt_required()
def me():
    return jsonify(cur().to_dict())


@bp.post("/auth/logout")
@jwt_required()
def logout():  # JWT is stateless: the client deletes the token.
    return jsonify({"ok": True})


@bp.get("/uploads/<path:name>")
def uploads(name):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], name)


# ---------- AI ----------
@bp.post("/ai/preview")
@jwt_required()
def ai_preview():
    d = request.get_json(silent=True) or {}
    return jsonify(ai.analyze(f"{d.get('title', '')}. {d.get('description', '')}", d.get("category")))


@bp.post("/assistant")
@jwt_required()
def assistant():
    u = cur(); q = ((request.get_json(silent=True) or {}).get("message") or "").strip()
    if not q: return err("Please type a question.")
    mine = visible_query(u).order_by(Complaint.created_at.desc()).limit(15).all()
    city = Counter(c.category for c in Complaint.query.filter(Complaint.status.in_(OPEN)))
    ctx = {"my_complaints": [{"number": c.complaint_number, "title": c.title, "status": c.status, "category": c.category, "priority": c.priority_score,
                              "department": c.department.name if c.department else None, "officer": c.officer.name if c.officer else None,
                              "reports": c.report_count()} for c in mine], "open_issues_in_city": dict(city)}
    ans = ai.chat(q, ctx)
    if ans: return jsonify({"reply": ans, "source": "ai"})
    ql = q.lower()
    line = lambda c: f"• {c['number']} – {c['title']} ({c['status']}, priority {c['priority']})"
    if not mine and any(k in ql for k in ("status", "complaint", "submitted", "pending", "why")):
        reply = "You have not submitted any complaints yet. Use 'Report Issue' to create one."
    elif any(k in ql for k in ("why", "still pending", "delay", "slow")):
        o = [c for c in ctx["my_complaints"] if c["status"] in OPEN]
        if not o: reply = "None of your complaints are waiting right now."
        else:
            c = o[0]; why = {"Pending": "it is waiting to be routed to an officer", "Assigned": f"it is assigned to {c['officer']} ({c['department']}) who has not started work yet",
                             "In Progress": "work is under way", "Reopened": "it was reopened and is queued for re-inspection"}[c["status"]]
            reply = f"{c['number']} is {c['status']} because {why}. Priority is {c['priority']}/100 and {c['reports']} citizen(s) reported it – higher priority issues are handled first."
    elif any(k in ql for k in ("status", "my complaint", "submitted", "history")):
        reply = "Your complaints:\n" + "\n".join(line(c) for c in ctx["my_complaints"][:8])
    elif any(k in ql for k in ("nearby", "near me", "around", "city")):
        reply = "Open issues in the city: " + (", ".join(f"{k}: {v}" for k, v in city.items()) or "none") + ". See the Issue Map for locations."
    elif any(k in ql for k in ("report", "pothole", "how")):
        reply = "To report: click 'Report Issue', write a title and description, tap the map to mark the location, optionally attach a JPG/PNG photo and submit. The AI classifies it, scores priority and routes it to the right department."
    else:
        reply = "I can help with your complaint status, why something is pending, nearby issues, and how to report a problem."
    return jsonify({"reply": reply, "source": "rules"})


# ---------- complaints ----------
def find_duplicate(cat, lat, lng, text):
    best = None
    for c in Complaint.query.filter(Complaint.category == cat, Complaint.status.in_(OPEN)):
        dist = km(lat, lng, c.latitude, c.longitude) * 1000
        sim = SequenceMatcher(None, text.lower(), f"{c.title}. {c.description}".lower()).ratio()
        if dist <= 50 or (dist <= 150 and sim >= 0.3):
            if best is None or dist < best[0]: best = (dist, c)
    return best[1] if best else None


@bp.post("/complaints")
@roles("citizen")
def create_complaint():
    u, f = cur(), request.form
    title, desc = (f.get("title") or "").strip(), (f.get("description") or "").strip()
    if len(title) < 3 or len(desc) < 10: return err("Please add a title (3+ characters) and a description (10+ characters).")
    try:
        lat, lng = float(f["latitude"]), float(f["longitude"])
        assert -90 <= lat <= 90 and -180 <= lng <= 180
    except Exception:
        return err("Please choose a location on the map.")
    img, e = save_image(request.files.get("image"))
    if e: return err(e)
    extra = (f.get("extra_info") or "").strip()
    text = f"{title}. {desc}. {extra}"
    res = ai.analyze(text, f.get("category"), upath(img))
    dup = find_duplicate(res["category"], lat, lng, text)
    if dup:
        db.session.add(ComplaintReport(complaint_id=dup.id, citizen_id=u.id, description=desc, image_path=img)); db.session.flush()
        if dup.report_count() <= 6: dup.priority_score = min(100, dup.priority_score + 2)
        dup.severity = ai.band(dup.priority_score)
        log_update(dup, u, dup.status, f"Additional report by {u.name}")
        notify(u.id, f"Your report was linked to existing complaint {dup.complaint_number} ({dup.report_count()} citizens reported this).", dup.id)
        if dup.officer_id: notify(dup.officer_id, f"{dup.complaint_number} now has {dup.report_count()} reports (priority {dup.priority_score}).", dup.id)
        db.session.commit()
        return jsonify({"duplicate": True, "complaint": dup.to_dict(), "ai": res}), 200
    dept = Department.query.filter_by(name=res["department"]).first()
    c = Complaint(title=title, description=desc, extra_info=extra, category=res["category"], severity=res["severity"], priority_score=res["priority"],
                  latitude=lat, longitude=lng, address=(f.get("address") or "").strip() or None, image_path=img, ai_summary=res["summary"],
                  citizen_id=u.id, department_id=dept.id if dept else None)
    db.session.add(c); db.session.flush()
    c.complaint_number = f"CIV-{1000 + c.id}"
    log_update(c, u, "Pending", "Complaint submitted")
    notify(u.id, f"Your complaint {c.complaint_number} has been submitted.", c.id)
    off = pick_officer(c.department_id)
    if off:
        c.officer_id, c.status = off.id, "Assigned"
        log_update(c, off, "Assigned", f"Auto-routed to {dept.name}, officer {off.name}")
        notify(u.id, f"Your complaint {c.complaint_number} has been assigned to {dept.name}.", c.id)
        notify(off.id, f"New {c.severity} complaint {c.complaint_number} assigned to you.", c.id)
    if c.severity == "Critical":
        for a in User.query.filter_by(role="admin"): notify(a.id, f"Critical issue {c.complaint_number}: {c.title}", c.id)
    db.session.commit()
    return jsonify({"duplicate": False, "complaint": c.to_dict(), "ai": res}), 201


@bp.get("/complaints")
@jwt_required()
def list_complaints():
    u, a = cur(), request.args
    q = visible_query(u)
    for k in ("category", "severity", "status"):
        if a.get(k): q = q.filter(getattr(Complaint, k) == a[k])
    if a.get("department_id"): q = q.filter(Complaint.department_id == int(a["department_id"]))
    try:
        if a.get("date_from"): q = q.filter(Complaint.created_at >= datetime.fromisoformat(a["date_from"]))
        if a.get("date_to"): q = q.filter(Complaint.created_at <= datetime.fromisoformat(a["date_to"] + "T23:59:59"))
    except ValueError:
        return err("Invalid date filter.")
    if a.get("q"):
        like = f"%{a['q']}%"; q = q.filter(or_(Complaint.title.ilike(like), Complaint.complaint_number.ilike(like), Complaint.description.ilike(like)))
    return jsonify([c.to_dict() for c in q.order_by(Complaint.priority_score.desc(), Complaint.created_at.desc()).all()])


@bp.get("/map")
@jwt_required()
def map_points():
    return jsonify([{k: c.to_dict()[k] for k in ("id", "complaint_number", "title", "category", "severity", "status", "latitude", "longitude", "address", "report_count")}
                    for c in Complaint.query.all()])


def get_visible(cid):
    u = cur(); c = db.session.get(Complaint, cid)
    if not c: return u, None, err("Complaint not found.", 404)
    if not can_view(u, c): return u, None, err("You do not have access to this complaint.", 403)
    return u, c, None


@bp.get("/complaints/<int:cid>")
@jwt_required()
def get_complaint(cid):
    u, c, e = get_visible(cid)
    return e or jsonify(c.to_dict(detail=True))


@bp.put("/complaints/<int:cid>")
@roles("admin")
def update_complaint(cid):
    c = db.session.get(Complaint, cid)
    if not c: return err("Complaint not found.", 404)
    d = request.get_json(silent=True) or {}
    msgs = []
    if "department_id" in d and d["department_id"] != c.department_id:
        dep = db.session.get(Department, d["department_id"])
        if not dep: return err("Department not found.")
        c.department_id = dep.id; off = pick_officer(dep.id); c.officer_id = off.id if off else None
        if c.status == "Pending" and off: c.status = "Assigned"
        msgs.append(f"Department changed to {dep.name}" + (f", officer {off.name}" if off else ""))
        if off: notify(off.id, f"Complaint {c.complaint_number} was assigned to you.", c.id)
        notify_reporters(c, f"Your complaint {c.complaint_number} has been assigned to {dep.name}.")
    elif "officer_id" in d and d["officer_id"] != c.officer_id:
        o = db.session.get(User, d["officer_id"]) if d["officer_id"] else None
        if d["officer_id"] and (not o or o.role != "officer"): return err("Officer not found.")
        c.officer_id = o.id if o else None
        if o:
            c.department_id = o.department_id or c.department_id
            if c.status == "Pending": c.status = "Assigned"
            notify(o.id, f"Complaint {c.complaint_number} was assigned to you.", c.id); msgs.append(f"Reassigned to officer {o.name}")
    if d.get("category") in ai.CATEGORIES and d["category"] != c.category: c.category = d["category"]; msgs.append(f"Category set to {c.category}")
    if d.get("severity") in ai.BASE: c.severity = d["severity"]; msgs.append(f"Severity set to {c.severity}")
    if isinstance(d.get("priority_score"), int): c.priority_score = max(0, min(100, d["priority_score"])); c.severity = ai.band(c.priority_score)
    if d.get("status") in ("Pending", "Assigned", "In Progress", "Resolved", "Verified", "Reopened"): c.status = d["status"]; msgs.append(f"Status set to {c.status}")
    if msgs: log_update(c, cur(), c.status, "Admin: " + "; ".join(msgs))
    db.session.commit()
    return jsonify(c.to_dict(detail=True))


@bp.delete("/complaints/<int:cid>")
@roles("admin")
def delete_complaint(cid):
    c = db.session.get(Complaint, cid)
    if not c: return err("Complaint not found.", 404)
    Notification.query.filter_by(complaint_id=cid).delete(); db.session.delete(c); db.session.commit()
    return jsonify({"ok": True})


@bp.post("/complaints/<int:cid>/analyze")
@jwt_required()
def reanalyze(cid):
    u, c, e = get_visible(cid)
    if e: return e
    r = ai.analyze(f"{c.title}. {c.description}. {c.extra_info or ''}", c.category, upath(c.image_path), c.report_count())
    if u.role in ("admin", "officer"):
        c.category, c.priority_score, c.severity, c.ai_summary = r["category"], r["priority"], r["severity"], r["summary"]
        if u.role == "admin":
            d = Department.query.filter_by(name=r["department"]).first()
            if d: c.department_id = d.id
        db.session.commit()
    return jsonify({"ai": r, "complaint": c.to_dict(detail=True)})


@bp.post("/complaints/<int:cid>/status")
@roles("officer", "admin")
def set_status(cid):
    u, c, e = get_visible(cid)
    if e: return e
    d = request.get_json(silent=True) or {}
    st = d.get("status")
    if st not in ("Assigned", "In Progress"): return err("Officers can set Assigned or In Progress. Use 'Resolve' to finish.")
    if c.status in ("Resolved", "Verified"): return err("This complaint is already resolved.")
    if u.role == "officer" and not c.officer_id: c.officer_id = u.id
    c.status = st
    log_update(c, u, st, (d.get("remarks") or "").strip() or f"Status changed to {st}")
    notify_reporters(c, f"Your complaint {c.complaint_number} is now {st}.")
    db.session.commit()
    return jsonify(c.to_dict(detail=True))


@bp.post("/complaints/<int:cid>/resolve")
@roles("officer", "admin")
def resolve(cid):
    u, c, e = get_visible(cid)
    if e: return e
    remarks = (request.form.get("remarks") or "").strip()
    if not remarks: return err("Please add remarks describing the work done.")
    before, e1 = save_image(request.files.get("before_image")); after, e2 = save_image(request.files.get("after_image"))
    if e1 or e2: return err(e1 or e2)
    if before: c.before_image_path = before
    if after: c.resolution_image_path = after
    if u.role == "officer" and not c.officer_id: c.officer_id = u.id
    c.status, c.resolved_at = "Resolved", datetime.utcnow()
    log_update(c, u, "Resolved", remarks, after)
    notify_reporters(c, f"Your complaint {c.complaint_number} has been marked as resolved.")
    notify(c.citizen_id, f"Verification required: please confirm whether {c.complaint_number} is fixed.", c.id)
    db.session.commit()
    return jsonify(c.to_dict(detail=True))


@bp.post("/complaints/<int:cid>/verify")
@roles("citizen")
def verify(cid):
    u, c, e = get_visible(cid)
    if e: return e
    if c.citizen_id != u.id: return err("Only the original reporter can verify.", 403)
    if c.status != "Resolved": return err("Only resolved complaints can be verified.")
    d = request.get_json(silent=True) or {}
    rating = d.get("rating")
    if not isinstance(rating, int) or not 1 <= rating <= 5: return err("Please give a rating from 1 to 5.")
    c.status = "Verified"
    db.session.add(Feedback(complaint_id=c.id, citizen_id=u.id, rating=rating, comment=(d.get("comment") or "").strip()))
    log_update(c, u, "Verified", "Citizen confirmed the issue is fixed")
    if c.officer_id: notify(c.officer_id, f"{c.complaint_number} was verified by the citizen. Thank you!", c.id)
    db.session.commit()
    return jsonify(c.to_dict(detail=True))


@bp.post("/complaints/<int:cid>/reopen")
@roles("citizen")
def reopen(cid):
    u, c, e = get_visible(cid)
    if e: return e
    if c.citizen_id != u.id: return err("Only the original reporter can reopen.", 403)
    if c.status not in ("Resolved", "Verified"): return err("Only resolved complaints can be reopened.")
    c.status, c.resolved_at = "Reopened", None
    c.priority_score = min(100, c.priority_score + 5); c.severity = ai.band(c.priority_score)
    log_update(c, u, "Reopened", ((request.get_json(silent=True) or {}).get("remarks") or "Issue not actually fixed").strip())
    if c.officer_id: notify(c.officer_id, f"{c.complaint_number} was reopened by the citizen.", c.id)
    for a in User.query.filter_by(role="admin"): notify(a.id, f"{c.complaint_number} was reopened.", c.id)
    db.session.commit()
    return jsonify(c.to_dict(detail=True))


# ---------- notifications / departments / users ----------
@bp.get("/notifications")
@jwt_required()
def notifications():
    q = Notification.query.filter_by(user_id=cur().id).order_by(Notification.created_at.desc())
    return jsonify({"items": [n.to_dict() for n in q.limit(50)], "unread": q.filter_by(is_read=False).count()})


@bp.post("/notifications/read")
@jwt_required()
def read_all():
    Notification.query.filter_by(user_id=cur().id, is_read=False).update({"is_read": True}); db.session.commit()
    return jsonify({"ok": True})


@bp.get("/departments")
@jwt_required()
def departments():
    return jsonify([d.to_dict() for d in Department.query.order_by(Department.name)])


@bp.post("/departments")
@roles("admin")
def add_department():
    d = request.get_json(silent=True) or {}; n = (d.get("name") or "").strip()
    if not n: return err("Department name is required.")
    if Department.query.filter_by(name=n).first(): return err("Department already exists.", 409)
    x = Department(name=n, description=(d.get("description") or "").strip()); db.session.add(x); db.session.commit()
    return jsonify(x.to_dict()), 201


@bp.put("/departments/<int:did>")
@roles("admin")
def edit_department(did):
    x = db.session.get(Department, did)
    if not x: return err("Department not found.", 404)
    d = request.get_json(silent=True) or {}
    x.name = (d.get("name") or x.name).strip(); x.description = d.get("description", x.description); db.session.commit()
    return jsonify(x.to_dict())


@bp.delete("/departments/<int:did>")
@roles("admin")
def del_department(did):
    x = db.session.get(Department, did)
    if not x: return err("Department not found.", 404)
    if Complaint.query.filter_by(department_id=did).count() or User.query.filter_by(department_id=did).count():
        return err("Department is in use. Reassign its complaints and officers first.")
    db.session.delete(x); db.session.commit()
    return jsonify({"ok": True})


@bp.get("/users")
@roles("admin")
def users():
    q = User.query
    if request.args.get("role"): q = q.filter_by(role=request.args["role"])
    return jsonify([u.to_dict() | {"complaints": Complaint.query.filter_by(citizen_id=u.id).count() if u.role == "citizen"
                                   else Complaint.query.filter_by(officer_id=u.id).count()} for u in q.order_by(User.id)])


@bp.post("/users")
@roles("admin")
def create_user():
    d = request.get_json(silent=True) or {}
    email = (d.get("email") or "").strip().lower()
    if not (d.get("name") and EMAIL.match(email) and len(d.get("password") or "") >= 6 and d.get("role") in ("citizen", "officer", "admin")):
        return err("Name, valid email, role and a password of 6+ characters are required.")
    if User.query.filter_by(email=email).first(): return err("Email already registered.", 409)
    u = User(name=d["name"].strip(), email=email, role=d["role"], phone=d.get("phone"), department_id=d.get("department_id") or None, password_hash=User.hash(d["password"]))
    db.session.add(u); db.session.commit()
    return jsonify(u.to_dict()), 201


@bp.put("/users/<int:uid>")
@roles("admin")
def edit_user(uid):
    u = db.session.get(User, uid)
    if not u: return err("User not found.", 404)
    d = request.get_json(silent=True) or {}
    if d.get("role") in ("citizen", "officer", "admin"): u.role = d["role"]
    if "department_id" in d: u.department_id = d["department_id"] or None
    if d.get("name"): u.name = d["name"].strip()
    db.session.commit()
    return jsonify(u.to_dict())


@bp.delete("/users/<int:uid>")
@roles("admin")
def delete_user(uid):
    u = db.session.get(User, uid)
    if not u: return err("User not found.", 404)
    if u.id == cur().id: return err("You cannot delete your own account.")
    if Complaint.query.filter((Complaint.citizen_id == uid) | (Complaint.officer_id == uid)).count():
        return err("This user has complaints and cannot be deleted.")
    Notification.query.filter_by(user_id=uid).delete(); db.session.delete(u); db.session.commit()
    return jsonify({"ok": True})


# ---------- dashboards & analytics ----------
def counts(cs):
    return {"total": len(cs), "pending": sum(c.status in ("Pending", "Assigned") for c in cs), "in_progress": sum(c.status in ("In Progress", "Reopened") for c in cs),
            "resolved": sum(c.status in ("Resolved", "Verified") for c in cs), "critical": sum(c.severity == "Critical" and c.status != "Verified" for c in cs)}


def prio_dist(cs):
    return [{"name": n, "value": sum(ai.band(c.priority_score) == n for c in cs)} for n in ("Low", "Medium", "High", "Critical")]


@bp.get("/dashboard/<role>")
@jwt_required()
def dashboard(role):
    u = cur()
    if role != u.role: return err("You do not have access to this dashboard.", 403)
    cs = visible_query(u).order_by(Complaint.created_at.desc()).all()
    out = {"stats": counts(cs), "recent": [c.to_dict() for c in cs[:6]]}
    if u.role == "citizen":
        out["notifications"] = [n.to_dict() for n in Notification.query.filter_by(user_id=u.id).order_by(Notification.created_at.desc()).limit(5)]
    elif u.role == "officer":
        out["priority_distribution"] = prio_dist(cs); out["department"] = u.department.name if u.department else None
    else:
        done = [c for c in cs if c.resolved_at]
        out["stats"]["avg_resolution_hours"] = round(sum((c.resolved_at - c.created_at).total_seconds() for c in done) / 3600 / len(done), 1) if done else 0
        out["stats"]["resolution_rate"] = round(100 * out["stats"]["resolved"] / len(cs), 1) if cs else 0
        out["stats"].update(citizens=User.query.filter_by(role="citizen").count(), officers=User.query.filter_by(role="officer").count())
        out["critical"] = [c.to_dict() for c in cs if c.severity == "Critical" and c.status != "Verified"][:6]
    return jsonify(out)


@bp.get("/analytics")
@roles("admin")
def analytics():
    cs = Complaint.query.all()
    cnt = lambda it: [{"name": k, "value": v} for k, v in Counter(it).most_common()]
    created, resolved = Counter(c.created_at.strftime("%Y-%m") for c in cs), Counter(c.resolved_at.strftime("%Y-%m") for c in cs if c.resolved_at)
    months = sorted(set(created) | set(resolved))[-6:]
    perf = defaultdict(lambda: {"total": 0, "resolved": 0, "hours": []})
    for c in cs:
        p = perf[c.department.name if c.department else "Unassigned"]; p["total"] += 1
        if c.status in ("Resolved", "Verified"): p["resolved"] += 1
        if c.resolved_at: p["hours"].append((c.resolved_at - c.created_at).total_seconds() / 3600)
    ratings = [f.rating for f in Feedback.query.all()]
    return jsonify({"by_category": cnt(c.category for c in cs), "by_severity": [{"name": n, "value": sum(c.severity == n for c in cs)} for n in ("Low", "Medium", "High", "Critical")],
                    "by_department": cnt(c.department.name if c.department else "Unassigned" for c in cs),
                    "monthly": [{"month": m, "reported": created[m], "resolved": resolved[m]} for m in months], "priority_distribution": prio_dist(cs),
                    "department_performance": [{"department": k, "total": v["total"], "resolved": v["resolved"], "rate": round(100 * v["resolved"] / v["total"]),
                                                "avg_hours": round(sum(v["hours"]) / len(v["hours"]), 1) if v["hours"] else None} for k, v in perf.items()],
                    "avg_rating": round(sum(ratings) / len(ratings), 2) if ratings else None})
