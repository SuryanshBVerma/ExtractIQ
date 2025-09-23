# config/cors_config.py

# This configuration file is intended to be imported by the backend server to enable CORS.

from flask_cors import CORS

def init_cors(app):
    """
    Initialize CORS for the given Flask app.
    """
    CORS(app, resources={r"/*": {"origins": "*"}})
