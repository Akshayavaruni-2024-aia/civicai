from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()
now = datetime.utcnow


class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255), default="")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "description": self.description}


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="citizen")  # citizen|officer|admin
    phone = db.Column(db.String(20))
    department_id = db.Column(db.Integer, db.ForeignKey("department.id"))
    created_at = db.Column(db.DateTime, default=now)
    department = db.relationship("Department")

    @staticmethod
    def hash(pw): return generate_password_hash(pw)
    def check(self, pw): return check_password_hash(self.password_hash, pw)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role, "phone": self.phone,
                "department_id": self.department_id, "department": self.department.name if self.department else None,
                "created_at": self.created_at.isoformat()}


class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_number = db.Column(db.String(20), unique=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    extra_info = db.Column(db.Text)
    category = db.Column(db.String(50), default="Other", index=True)
    severity = db.Column(db.String(20), default="Medium")
    priority_score = db.Column(db.Integer, default=50)
    status = db.Column(db.String(20), default="Pending", index=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(255))
    image_path = db.Column(db.String(255))
    before_image_path = db.Column(db.String(255))
    resolution_image_path = db.Column(db.String(255))
    ai_summary = db.Column(db.Text)
    department_id = db.Column(db.Integer, db.ForeignKey("department.id"))
    citizen_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    officer_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=now)
    updated_at = db.Column(db.DateTime, default=now, onupdate=now)
    resolved_at = db.Column(db.DateTime)
    department = db.relationship("Department")
    citizen = db.relationship("User", foreign_keys=[citizen_id])
    officer = db.relationship("User", foreign_keys=[officer_id])
    reports = db.relationship("ComplaintReport", backref="complaint", cascade="all, delete-orphan")
    updates = db.relationship("ComplaintUpdate", backref="complaint", cascade="all, delete-orphan", order_by="ComplaintUpdate.created_at")
    feedback = db.relationship("Feedback", backref="complaint", cascade="all, delete-orphan")

    def report_count(self): return 1 + len(self.reports)

    def to_dict(self, detail=False):
        d = {"id": self.id, "complaint_number": self.complaint_number, "title": self.title, "description": self.description,
             "category": self.category, "severity": self.severity, "priority_score": self.priority_score, "status": self.status,
             "latitude": self.latitude, "longitude": self.longitude, "address": self.address, "image_path": self.image_path,
             "before_image_path": self.before_image_path, "resolution_image_path": self.resolution_image_path,
             "ai_summary": self.ai_summary, "department_id": self.department_id,
             "department": self.department.name if self.department else None, "citizen_id": self.citizen_id,
             "citizen": self.citizen.name if self.citizen else None, "officer_id": self.officer_id,
             "officer": self.officer.name if self.officer else None, "report_count": self.report_count(),
             "created_at": self.created_at.isoformat(), "updated_at": self.updated_at.isoformat() if self.updated_at else None,
             "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None}
        if detail:
            d["extra_info"] = self.extra_info
            d["updates"] = [u.to_dict() for u in self.updates]
            d["reports"] = [{"citizen": r.citizen.name, "description": r.description, "created_at": r.created_at.isoformat()} for r in self.reports]
            d["feedback"] = [{"rating": f.rating, "comment": f.comment} for f in self.feedback]
        return d


class ComplaintReport(db.Model):
    """An additional citizen report linked to an existing (duplicate) complaint."""
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaint.id"), nullable=False)
    citizen_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    description = db.Column(db.Text)
    image_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=now)
    citizen = db.relationship("User")


class ComplaintUpdate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaint.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    status = db.Column(db.String(20))
    remarks = db.Column(db.Text)
    image_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=now)
    user = db.relationship("User")

    def to_dict(self):
        return {"status": self.status, "remarks": self.remarks, "image_path": self.image_path,
                "by": self.user.name if self.user else "System", "created_at": self.created_at.isoformat()}


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaint.id"))
    message = db.Column(db.String(300), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=now)

    def to_dict(self):
        return {"id": self.id, "complaint_id": self.complaint_id, "message": self.message,
                "is_read": self.is_read, "created_at": self.created_at.isoformat()}


class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaint.id"), nullable=False)
    citizen_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=now)
