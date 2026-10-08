"""Demo data. Run `python seed.py` to reset the database and reload demo data."""
import random
from datetime import datetime, timedelta
from app.models import db, User, Department, Complaint, ComplaintReport, ComplaintUpdate, Notification, Feedback
from app.ai import service as ai

PW = "Demo@123"
DEPTS = [("Roads & Engineering", "Potholes and road damage"), ("Sanitation", "Garbage and cleanliness"),
         ("Water Supply", "Water leakage and supply"), ("Drainage Department", "Drains and sewage"),
         ("Electrical Department", "Streetlights and wiring"), ("Parks & Horticulture", "Trees and green spaces"),
         ("General Administration", "Everything else")]
# title, description, status, days_ago, extra_reports
DATA = [
 ("Large pothole near main road", "Very big deep pothole on the main road near the bus stop, bikes are skidding", "Assigned", 2, 4),
 ("Open manhole near school", "Open manhole cover missing next to the primary school, dangerous for children", "In Progress", 1, 6),
 ("Garbage pile at market", "Garbage has not been collected for a week near the vegetable market", "Pending", 3, 2),
 ("Water pipe burst", "Burst pipe leaking water onto the street, large water wastage", "Resolved", 9, 3),
 ("Streetlight not working", "Streetlight is off for three nights, the lane is dark and unsafe", "Verified", 20, 1),
 ("Drain blocked and overflowing", "Blocked drain, sewage overflow and stagnant water near homes", "Assigned", 4, 2),
 ("Fallen tree on road", "Large tree fell after rain and is blocking the road", "In Progress", 1, 5),
 ("Cracked road surface", "Road damage with cracks and a small sinkhole forming", "Verified", 35, 0),
 ("Small garbage near park", "Small garbage accumulation outside the park gate", "Verified", 50, 0),
 ("Pothole on bypass", "Deep pothole near the highway junction causing accidents", "Reopened", 12, 7),
 ("Water leakage at corner", "Minor water leak from pipeline at the street corner", "Resolved", 6, 1),
 ("Broken streetlight pole", "Streetlight pole damaged and leaning, wires exposed", "Pending", 0, 3),
 ("Garbage burning", "Garbage dump overflowing and being burnt, smoke near houses", "Verified", 70, 2),
 ("Drain clogged", "Clogged drain causing waterlogging in the lane", "Verified", 95, 0),
]

def seed_data():
    rnd = random.Random(7)
    depts = {}
    for n, d in DEPTS:
        x = Department(name=n, description=d); db.session.add(x); depts[n] = x
    db.session.flush()
    db.session.add(User(name="Demo Admin", email="admin@civic.demo", role="admin", phone="9000000001", password_hash=User.hash(PW)))
    officers = {}
    for i, (n, _) in enumerate(DEPTS):
        e = "officer@civic.demo" if i == 0 else f"officer{i+1}@civic.demo"
        o = User(name=f"Officer {n.split()[0]}", email=e, role="officer", phone=f"90000001{i:02d}", department_id=depts[n].id, password_hash=User.hash(PW))
        db.session.add(o); officers[n] = o
    cits = [User(name=n, email=e, role="citizen", phone="9111111111", password_hash=User.hash(PW))
            for n, e in [("Demo Citizen", "citizen@civic.demo"), ("Asha Kumar", "citizen2@civic.demo"), ("Ravi Nair", "citizen3@civic.demo")]]
    db.session.add_all(cits); db.session.flush()
    now = datetime.utcnow()
    for i, (t, d, st, days, extra) in enumerate(DATA):
        r = ai.analyze(f"{t}. {d}", use_llm=False)
        created = now - timedelta(days=days, hours=rnd.randint(0, 10))
        dept = depts[r["department"]]; off = officers[r["department"]]
        score = min(100, r["priority"] + 2 * extra)
        c = Complaint(title=t, description=d, category=r["category"], severity=ai.band(score), priority_score=score, status=st,
                      latitude=11.0168 + rnd.uniform(-.05, .05), longitude=76.9558 + rnd.uniform(-.05, .05), address="Coimbatore",
                      ai_summary=r["summary"], department_id=dept.id, citizen_id=cits[i % 3].id,
                      officer_id=None if st == "Pending" else off.id, created_at=created, updated_at=created)
        db.session.add(c); db.session.flush()
        c.complaint_number = f"CIV-{1000 + c.id}"
        db.session.add(ComplaintUpdate(complaint_id=c.id, user_id=c.citizen_id, status="Pending", remarks="Complaint submitted", created_at=created))
        for k in range(extra):
            db.session.add(ComplaintReport(complaint_id=c.id, citizen_id=cits[(i + k + 1) % 3].id, description="Same issue, please act soon.", created_at=created))
        if st != "Pending":
            db.session.add(ComplaintUpdate(complaint_id=c.id, user_id=off.id, status="Assigned", remarks=f"Routed to {dept.name}", created_at=created))
        if st in ("In Progress", "Resolved", "Verified", "Reopened"):
            db.session.add(ComplaintUpdate(complaint_id=c.id, user_id=off.id, status="In Progress", remarks="Team dispatched", created_at=created + timedelta(hours=6)))
        if st in ("Resolved", "Verified", "Reopened"):
            c.resolved_at = created + timedelta(days=rnd.randint(1, 4)); c.updated_at = c.resolved_at
            db.session.add(ComplaintUpdate(complaint_id=c.id, user_id=off.id, status="Resolved", remarks="Work completed", created_at=c.resolved_at))
        if st == "Verified":
            db.session.add(ComplaintUpdate(complaint_id=c.id, user_id=c.citizen_id, status="Verified", remarks="Confirmed fixed", created_at=c.resolved_at))
            db.session.add(Feedback(complaint_id=c.id, citizen_id=c.citizen_id, rating=rnd.randint(3, 5), comment="Thanks for the quick fix."))
        if st == "Reopened":
            db.session.add(ComplaintUpdate(complaint_id=c.id, user_id=c.citizen_id, status="Reopened", remarks="Pothole is back", created_at=c.resolved_at + timedelta(days=1)))
        if c.citizen_id == cits[0].id:
            db.session.add(Notification(user_id=c.citizen_id, complaint_id=c.id, message=f"Your complaint {c.complaint_number} is now {st}.", created_at=created))
    db.session.commit()

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        db.drop_all(); db.create_all(); seed_data()
        print("Database reset and demo data loaded.")
