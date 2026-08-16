import os
import io
import json
import traceback
from PIL import Image
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv
from app.schemas.crop import AnalysisResponse

# Load environment variables
load_dotenv()

# Configure Google Gemini API
GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class VisionService:
    @staticmethod
    def analyze_crop_image(image_bytes: bytes) -> AnalysisResponse:
        """
        Analyzes an image using a strict multi-step reasoning pipeline to identify
        crops and diagnose pathologies without hallucination.
        """
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")

        try:
            # Open image with PIL
            img = Image.open(io.BytesIO(image_bytes))
            
            # Use the latest Gemini Flash model which supports multimodal input
            model = genai.GenerativeModel('gemini-flash-latest')
            
            prompt = """
            You are a strict, expert agricultural computer vision AI and crop doctor. Follow this pipeline:
            
            Step 1: VALIDATION
            Examine the image carefully. Does it contain agricultural content such as a plant, crop, vegetable, fruit, grain, ear of wheat/rice, leaf, soil, field, farm pest, or farm produce?
            - Set `is_agricultural` to True if it depicts any plant, leaf, crop, grain, harvest, agricultural field, farm pest, or farm scene.
            - Set `is_agricultural` to False ONLY if it is completely non-agricultural (e.g. a vehicle, electronic gadget, indoor furniture, human portrait, or a blank/solid color image).
            
            Step 2: IDENTIFICATION
            If agricultural, identify the exact crop species, plant name, or soil type in both English and Hindi (e.g. 'Wheat (गेहूँ)', 'Chilli / Pepper (मिर्च)', 'Tomato (टमाटर)').
            
            Step 3: PATHOLOGY & HEALTH DIAGNOSIS
            Analyze visual symptoms: pests (aphids, borers, etc.), fungal/bacterial spots, rust, blight, leaf curl, wilting, chlorosis/yellowing, nutrient deficiency, or confirm if the plant is healthy and maturing.
            
            Step 4: STRUCTURED SOLUTION
            Provide a realistic treatment and care plan:
            - fault_description: clear diagnosis based on the visual evidence in English and Hindi.
            - immediate_remedy: immediate actionable steps.
            - pesticides_fertilizers_required: specific brand names, active chemicals, or organic fertilizers with dosage.
            - preventative_care: best cultural practices and prevention.
            
            Return the output adhering strictly to the JSON schema.
            """
            
            # Use the response_schema to enforce strictly typed JSON output
            # Implement retry logic for free tier rate limits (429 ResourceExhausted)
            import time
            from google.api_core import exceptions as google_exceptions
            
            max_retries = 3
            retry_delay = 5
            response = None
            
            for attempt in range(max_retries):
                try:
                    response = model.generate_content(
                        [prompt, img],
                        generation_config=genai.GenerationConfig(
                            response_mime_type="application/json",
                            response_schema=AnalysisResponse
                        )
                    )
                    break # Success, exit retry loop
                except google_exceptions.ResourceExhausted as e:
                    if attempt < max_retries - 1:
                        print(f"Rate limit hit. Retrying in {retry_delay} seconds (Attempt {attempt+1}/{max_retries})...")
                        time.sleep(retry_delay)
                        retry_delay *= 2 # Exponential backoff
                    else:
                        raise HTTPException(
                            status_code=429, 
                            detail="Our AI service is currently busy due to high demand. Please try uploading the image again in about 15 seconds."
                        )
            
            # The response text is guaranteed to be a valid JSON matching the Pydantic schema
            response_json = json.loads(response.text)
            analysis = AnalysisResponse(**response_json)
            
            # Handle validation rejection cleanly
            if not analysis.is_agricultural:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid image detected. Please upload a clear picture of a crop, leaf, or soil."
                )
                
            return analysis
            
        except HTTPException:
            raise
        except json.JSONDecodeError as e:
            print(f"JSON Parsing Error: {e}")
            raise HTTPException(status_code=500, detail="AI returned malformed data.")
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Vision processing failed: {str(e)}")
