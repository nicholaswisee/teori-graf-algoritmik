import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory
from flask_cors import CORS

from gui.api.routes.graph import graph_bp
from gui.api.routes.tugas2 import tugas2_bp
from gui.api.routes.tugas3 import tugas3_bp
from gui.api.routes.tugas4 import tugas4_bp
from gui.api.routes.tugas5 import tugas5_bp
from gui.api.routes.algorithms import algorithms_bp


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)

    app.register_blueprint(graph_bp)
    app.register_blueprint(tugas2_bp)
    app.register_blueprint(tugas3_bp)
    app.register_blueprint(tugas4_bp)
    app.register_blueprint(tugas5_bp)
    app.register_blueprint(algorithms_bp)

    frontend_dist = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "frontend",
        "dist",
    )

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        return send_from_directory(frontend_dist, "index.html")

    return app


app = create_app()