from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from config import FAST_MODEL, REASONING_MODEL
from services import fetch_gfg_references, generate_fast_stream, generate_reasoning_stream

app = Flask(__name__)

@app.route("/")
@app.route("/c/<chat_id>")
def index(chat_id=None):
    return render_template("index.html")

@app.route("/widget")
def widget():
    return render_template("widget.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
    model = data.get("model", FAST_MODEL)
    history = data.get("history", [])

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    if model not in (REASONING_MODEL, FAST_MODEL):
        model = FAST_MODEL

    gfg_links = fetch_gfg_references(user_message)

    if model == FAST_MODEL:
        return Response(stream_with_context(generate_fast_stream(history, gfg_links)), mimetype="text/event-stream")

    return Response(stream_with_context(generate_reasoning_stream(history, gfg_links)), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
