import os
import json
from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from sarvamai import SarvamAI
from gfg_search import GFGSearchClient, GFGSearchHTTPError, GFGSearchParsingError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Initialize Sarvam AI Client
SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY")
sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

# Initialize GfG Search Client
gfg_client = GFGSearchClient(timeout=10)

SYSTEM_PROMPT = (
    "You are 'Unofficial Yogi Bot', a wise, calm, and technically brilliant assistant built "
    "for GeeksforGeeks enthusiasts. You provide clear, accurate, and helpful answers about "
    "data structures, algorithms, programming, and computer science. "
    "Your tone is like a modern tech-guru: patient, knowledgeable, and slightly philosophical. "
    "Always maintain a helpful and encouraging attitude."
)

# Models supported
REASONING_MODEL = "sarvam-30b"   # Reasoning – streaming, CoT
FAST_MODEL      = "sarvam-m"     # Fast – non-streaming, quick


@app.route("/")
@app.route("/c/<chat_id>")
def index(chat_id=None):
    return render_template("index.html")

@app.route("/widget")
def widget():
    return render_template("widget.html")


@app.route("/chat", methods=["POST"])
def chat():
    data         = request.json
    user_message = data.get("message", "").strip()
    model        = data.get("model", FAST_MODEL) # Default to Fast mode

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    # Validate model choice
    if model not in (REASONING_MODEL, FAST_MODEL):
        model = FAST_MODEL

    # Fetch GfG references (quick, done before any streaming)
    gfg_links = []
    try:
        gfg_results = gfg_client.search(user_message, max_results=3)
        for res in gfg_results:
            gfg_links.append({"title": res.title, "link": res.link})
    except (GFGSearchHTTPError, GFGSearchParsingError):
        pass

    # ── Fast mode (sarvam-m): non-streaming, single SSE answer ──
    if model == FAST_MODEL:
        def generate_fast():
            try:
                # Add a stricter instruction for the fast model to be direct
                fast_prompt = SYSTEM_PROMPT + "\n\nCRITICAL INSTRUCTION: You MUST directly answer the user's question without any internal monologue, thinking steps, or chain-of-thought. Do NOT use phrases like 'Let me think', 'Okay', or 'First, I should'. Output ONLY the final answer."
                
                response = sarvam_client.chat.completions(
                    model=FAST_MODEL,
                    messages=[
                        {"role": "system", "content": fast_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    temperature=0.3, # Lower temperature for more directness
                    top_p=1,
                    max_tokens=1000,
                    reasoning_effort=None, # Explicitly disable reasoning for fast mode
                )
                content = ""
                if response.choices:
                    content = response.choices[0].message.content or ""

                yield f"data: {json.dumps({'type': 'answer', 'content': content})}\n\n"
                
                if gfg_links:
                    yield f"data: {json.dumps({'type': 'references', 'links': gfg_links})}\n\n"
                    
                yield "data: [DONE]\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
                yield "data: [DONE]\n\n"

        return Response(stream_with_context(generate_fast()), mimetype="text/event-stream")

    # ── Reasoning mode (sarvam-30b): streaming with CoT ──
    def generate_reasoning():
        try:
            # sarvam-30b is a reasoning model: it first emits reasoning_content (CoT)
            # then emits the actual answer via content. Needs large max_tokens for both.
            stream = sarvam_client.chat.completions(
                model=REASONING_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=4096,
                stream=True,
            )

            for chunk in stream:
                if chunk.choices:
                    delta = chunk.choices[0].delta
                    # Reasoning / thinking phase (chain-of-thought)
                    if delta.reasoning_content:
                        yield f"data: {json.dumps({'type': 'thinking', 'content': delta.reasoning_content})}\n\n"
                    # Final answer phase
                    if delta.content:
                        yield f"data: {json.dumps({'type': 'answer', 'content': delta.content})}\n\n"

            # Send GfG references as a separate event
            if gfg_links:
                yield f"data: {json.dumps({'type': 'references', 'links': gfg_links})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate_reasoning()), mimetype="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
