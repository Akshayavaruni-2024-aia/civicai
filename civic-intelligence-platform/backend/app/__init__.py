import os
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from .models import db, User


def create_app():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    load_dotenv(os.path.join(base, ".env"))
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret"),
        JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-please-change-me-32chars"),
        JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=1),
        SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL") or "sqlite:///" + os.path.join(base, "civic.db"),
        UPLOAD_FOLDER=os.path.join(base, "uploads"),
        MAX_CONTENT_LENGTH=5 * 1024 * 1024,
    )
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    CORS(app, origins=[o.strip() for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")])
    db.init_app(app)
    jwt = JWTManager(app)

    @jwt.unauthorized_loader
    def _u(m): return jsonify({"error": "Please log in to continue."}), 401
    @jwt.invalid_token_loader
    def _i(m): return jsonify({"error": "Your session is invalid. Please log in again."}), 401
    @jwt.expired_token_loader
    def _e(h, p): return jsonify({"error": "Your session expired. Please log in again."}), 401

    from .routes import bp
    app.register_blueprint(bp)

    @app.errorhandler(404)
    def nf(e): return jsonify({"error": "Not found."}), 404
    @app.errorhandler(413)
    def big(e): return jsonify({"error": "File too large (max 5 MB)."}), 413
    @app.errorhandler(Exception)
    def boom(e):
        app.logger.exception(e)
        return jsonify({"error": "Something went wrong on the server. Please try again."}), 500

    with app.app_context():
        db.create_all()
        if User.query.count() == 0:
            from seed import seed_data
            seed_data()
    return app
