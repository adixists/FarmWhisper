import os
import time
import base64
import requests
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()
api_key = os.getenv("GOOGLE_GEMINI_API_KEY")

img = Image.open("../docs/screenshot.png")
buf = io.BytesIO()
img.convert("RGB").save(buf, format="JPEG", quality=80)
b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

print(f"Testing with image, size: {len(b64)} chars")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

for budget in [0, 1024, None]:
    start = time.time()
    gen_config = {
        "response_mime_type": "application/json",
        "temperature": 0.2
    }
    if budget is not None:
        gen_config["thinkingConfig"] = {"thinkingBudget": budget}
        
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Analyze this crop image. Return JSON with is_agricultural, crop_identified, issue_detected, confidence_score, treatment_plan (fault_description, immediate_remedy, pesticides_fertilizers_required, preventative_care)."},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64}}
                ]
            }
        ],
        "generationConfig": gen_config
    }
    
    try:
        resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
        elapsed = time.time() - start
        print(f"Budget: {budget} -> Status: {resp.status_code}, Elapsed: {elapsed:.2f}s")
        if resp.status_code == 200:
            print("Response:", resp.json()["candidates"][0]["content"]["parts"][0]["text"][:150])
        else:
            print("Error:", resp.text[:200])
    except Exception as e:
        print("Failed:", e)
