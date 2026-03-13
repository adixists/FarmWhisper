from transformers import pipeline, set_seed
from app.models.models import AdvisoryResponse, CropHealthAnalysis
import random

# Initialize text generation pipeline with a lightweight model
# Using gpt2 as an example - in practice, you might use a model fine-tuned for agricultural advice
generator = pipeline('text-generation', model='gpt2', tokenizer='gpt2')

# Set seed for reproducible results
set_seed(42)

def generate_poetic_advice(crop_type: str, analysis_result: CropHealthAnalysis) -> AdvisoryResponse:
    """
    Generate poetic advisory based on crop type and analysis result.
    """
    try:
        # Create a prompt based on the analysis
        issues = ", ".join(analysis_result.issues) if analysis_result.issues else "good health"
        
        # Different prompts based on the issues
        if "yellow leaves" in analysis_result.issues:
            prompt = f"In the poetic voice of nature, advise a farmer about {crop_type} showing yellow leaves"
        elif "low moisture" in analysis_result.issues:
            prompt = f"In the style of ancient farming wisdom, counsel a farmer on {crop_type} needing water"
        elif "pest damage" in analysis_result.issues:
            prompt = f"Using metaphorical language, guide a farmer whose {crop_type} suffers from pests"
        else:
            prompt = f"Share uplifting agricultural wisdom about healthy {crop_type}"
        
        # Generate text with the prompt
        # Limit the length to keep it concise
        generated = generator(
            prompt,
            max_length=80,
            num_return_sequences=1,
            truncation=True,
            pad_token_id=50256  # GPT2 specific
        )
        
        # Extract the generated text and clean it up
        story = generated[0]['generated_text']
        
        # Remove the prompt from the beginning if it's included
        if story.startswith(prompt):
            story = story[len(prompt):].strip()
        
        # Ensure it starts with a capital letter
        if story:
            story = story[0].upper() + story[1:]
        
        # If generation failed or is too short, provide a fallback
        if len(story) < 10:
            story = generate_fallback_advice(crop_type, analysis_result)
        
        # Generate practical tips based on the analysis
        tips = analysis_result.recommendations if analysis_result.recommendations else ["Continue current care routine"]
        
        return AdvisoryResponse(
            story=story,
            tips=tips
        )
    
    except Exception as e:
        # Fallback in case of any error
        story = generate_fallback_advice(crop_type, analysis_result)
        tips = analysis_result.recommendations if analysis_result.recommendations else ["Continue current care routine"]
        
        return AdvisoryResponse(
            story=story,
            tips=tips
        )

def generate_fallback_advice(crop_type: str, analysis_result: CropHealthAnalysis) -> str:
    """
    Generate fallback advice when the model fails.
    """
    # Predefined poetic advice templates
    templates = [
        f"The {crop_type} whispers of {', '.join(analysis_result.issues) if analysis_result.issues else 'prosperity'} - heed its call with {', '.join(analysis_result.recommendations[:1]) if analysis_result.recommendations else 'careful attention'}.",
        f"In the ancient dance of earth and sky, your {crop_type} seeks {', '.join(analysis_result.recommendations[:1]) if analysis_result.recommendations else 'balance'}.",
        f"The soil speaks through your {crop_type}: {', '.join(analysis_result.issues) if analysis_result.issues else 'all is well'} calls for {', '.join(analysis_result.recommendations[:1]) if analysis_result.recommendations else 'continued stewardship'}.",
        f"Like a wise elder, your {crop_type} shows signs of {', '.join(analysis_result.issues) if analysis_result.issues else 'vitality'} - respond with {', '.join(analysis_result.recommendations[:1]) if analysis_result.recommendations else 'gentle wisdom'}."
    ]
    
    # Return a random template
    return random.choice(templates)