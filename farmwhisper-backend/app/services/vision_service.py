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
            You are a strict, expert agricultural computer vision AI. You must follow this multi-step pipeline exactly:
            
            Step 1: VALIDATION
            Examine the image. Does it clearly show a plant, crop, leaf, soil, or agricultural field? 
            If it is a blank image, a random object (like a car), or a person, set `is_agricultural` to False.
            
            Step 2: IDENTIFICATION
            If agricultural, identify the exact crop species or soil type.
            
            Step 3: PATHOLOGY DIAGNOSIS
            Analyze the visual evidence ONLY. Do you see spots, yellowing, wilting, insects, or fungal growth? 
            Do not guess diseases that are not visually supported by the image.
            
            Step 4: STRUCTURED SOLUTION
            Based on Steps 2 and 3, formulate a treatment plan. Include specific names of pesticides/fertilizers and dosages.
            
            Respond strictly in English and Hindi for text fields where applicable to assist Indian farmers.
            Return the output adhering exactly to the provided JSON schema.
            """
            
            # Use the response_schema to enforce strictly typed JSON output
            # Note: response_schema is passed to generation_config
            response = model.generate_content(
                [prompt, img],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=AnalysisResponse
                )
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
