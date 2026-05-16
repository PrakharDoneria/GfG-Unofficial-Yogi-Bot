import json
from sarvamai import SarvamAI
from gfg_search import GFGSearchClient, GFGSearchHTTPError, GFGSearchParsingError
from config import SARVAM_API_KEY, SYSTEM_PROMPT, FAST_MODEL, REASONING_MODEL

sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
gfg_client = GFGSearchClient(timeout=10)

def fetch_gfg_references(query):
    gfg_links = []
    try:
        gfg_results = gfg_client.search(query, max_results=3)
        for res in gfg_results:
            gfg_links.append({"title": res.title, "link": res.link})
    except (GFGSearchHTTPError, GFGSearchParsingError):
        pass
    return gfg_links

def generate_fast_stream(messages, gfg_links):
    try:
        fast_prompt = SYSTEM_PROMPT + "\n\nCRITICAL INSTRUCTION: You MUST directly answer the user's question without any internal monologue, thinking steps, or chain-of-thought. Do NOT use phrases like 'Let me think', 'Okay', or 'First, I should'. Output ONLY the final answer."
        
        # Prepare full history for the API
        full_messages = [{"role": "system", "content": fast_prompt}] + messages

        response = sarvam_client.chat.completions(
            model=FAST_MODEL,
            messages=full_messages,
            temperature=0.3,
            top_p=1,
            max_tokens=1000,
            reasoning_effort=None,
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

def generate_reasoning_stream(messages, gfg_links):
    try:
        # Prepare full history for the API
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        stream = sarvam_client.chat.completions(
            model=REASONING_MODEL,
            messages=full_messages,
            temperature=0.7,
            max_tokens=4096,
            stream=True,
        )

        for chunk in stream:
            if chunk.choices:
                delta = chunk.choices[0].delta
                if delta.reasoning_content:
                    yield f"data: {json.dumps({'type': 'thinking', 'content': delta.reasoning_content})}\n\n"
                if delta.content:
                    yield f"data: {json.dumps({'type': 'answer', 'content': delta.content})}\n\n"

        if gfg_links:
            yield f"data: {json.dumps({'type': 'references', 'links': gfg_links})}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
