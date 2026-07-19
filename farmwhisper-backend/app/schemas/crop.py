from pydantic import BaseModel, Field
from typing import List

class TreatmentPlan(BaseModel):
    fault_description: str = Field(..., description="Detailed description of the issue found in the image based solely on visual evidence.")
    immediate_remedy: str = Field(..., description="The immediate step the farmer should take to mitigate the issue.")
    pesticides_fertilizers_required: List[str] = Field(..., description="List of specific chemical names, brands, or organic treatments required, including exact dosage instructions.")
    preventative_care: str = Field(..., description="Long-term advice to prevent this issue from recurring.")

class AnalysisResponse(BaseModel):
    is_agricultural: bool = Field(..., description="True if the image clearly contains agricultural content (crop, plant, leaf, field, soil). False if it is something else entirely (e.g., a person, car, blank image).")
    crop_identified: str = Field(..., description="The specific type of crop or soil identified, in both English and Hindi. E.g., 'Tomato (टमाटर)'. If not agricultural, return 'INVALID'.")
    issue_detected: str = Field(..., description="The primary disease, pest, or deficiency detected, in English and Hindi. If healthy, state 'Healthy (स्वस्थ)'.")
    confidence_score: float = Field(..., description="Confidence score of the diagnosis from 0.0 to 1.0.")
    treatment_plan: TreatmentPlan = Field(..., description="Structured solution based strictly on visual evidence.")
