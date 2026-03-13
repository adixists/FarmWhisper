import cv2
import numpy as np
from typing import Tuple
from app.models.models import CropHealthAnalysis

def analyze_crop_health(image_path: str) -> CropHealthAnalysis:
    """
    Analyze crop health using computer vision techniques.
    Returns structured analysis of crop health.
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise Exception("Could not read image file")
        
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Define range for green (healthy plants)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # Define range for yellow/brown (unhealthy plants)
        lower_yellow = np.array([15, 40, 40])
        upper_yellow = np.array([35, 255, 255])
        yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
        
        # Calculate percentages
        total_pixels = img.shape[0] * img.shape[1]
        green_pixels = cv2.countNonZero(green_mask)
        yellow_pixels = cv2.countNonZero(yellow_mask)
        
        green_percentage = (green_pixels / total_pixels) * 100
        yellow_percentage = (yellow_pixels / total_pixels) * 100
        
        # Calculate health score (0-100)
        # Higher green percentage = higher health score
        # Higher yellow percentage = lower health score
        health_score = max(0, min(100, int(green_percentage - (yellow_percentage * 1.5))))
        
        # Determine pest risk based on color distribution and texture
        pest_risk = "low"
        issues = []
        recommendations = []
        
        # Check for yellowing (nitrogen deficiency)
        if yellow_percentage > 15:
            issues.append("yellow leaves")
            recommendations.append("Apply nitrogen-rich fertilizer")
            if yellow_percentage > 30:
                pest_risk = "high"
            else:
                pest_risk = "medium"
        
        # Check for moisture stress (dark spots, wilting)
        # Convert to grayscale for edge detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / total_pixels
        
        if edge_density < 0.05:  # Low edge density might indicate wilting
            issues.append("low moisture")
            recommendations.append("Increase watering frequency")
        
        # Check for potential pest damage (irregular spots)
        # Simple blob detection for demonstration
        # In practice, you'd use a trained model
        blurred = cv2.GaussianBlur(gray, (11, 11), 0)
        thresh = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY)[1]
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        spot_count = len(contours)
        if spot_count > 20:  # Arbitrary threshold for demonstration
            issues.append("possible pest damage")
            recommendations.append("Inspect plants for pests")
            if pest_risk == "low":
                pest_risk = "medium"
        
        # If no issues detected but health score is low
        if not issues and health_score < 70:
            issues.append("general stress")
            recommendations.append("Check soil nutrients and watering schedule")
        
        # If no issues and high health score
        if not issues and health_score >= 70:
            recommendations.append("Continue current care routine")
        
        return CropHealthAnalysis(
            health_score=health_score,
            pest_risk=pest_risk,
            issues=issues,
            recommendations=recommendations
        )
    
    except Exception as e:
        raise Exception(f"Crop analysis failed: {str(e)}")

def detect_pests_and_diseases(image_path: str) -> dict:
    """
    Detect pests and diseases in crop images.
    This is a simplified implementation for demonstration.
    In practice, you would use a trained TensorFlow Lite model.
    """
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise Exception("Could not read image file")
        
        # Resize image for consistent processing
        img = cv2.resize(img, (224, 224))
        
        # Convert to HSV for color analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Look for signs of common issues:
        # Brown spots (early blight, late blight)
        lower_brown = np.array([10, 50, 20])
        upper_brown = np.array([20, 255, 200])
        brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
        brown_percentage = (cv2.countNonZero(brown_mask) / (img.shape[0] * img.shape[1])) * 100
        
        # White/gray spots (powdery mildew)
        lower_white = np.array([0, 0, 180])
        upper_white = np.array([180, 30, 255])
        white_mask = cv2.inRange(hsv, lower_white, upper_white)
        white_percentage = (cv2.countNonZero(white_mask) / (img.shape[0] * img.shape[1])) * 100
        
        # Holes in leaves (pest damage)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 30, 100)
        hole_density = np.sum(edges > 0) / (img.shape[0] * img.shape[1])
        
        detections = {}
        
        if brown_percentage > 5:
            detections["early_blight"] = {
                "confidence": min(100, brown_percentage * 2),
                "recommendation": "Apply fungicide and remove affected leaves"
            }
        
        if white_percentage > 3:
            detections["powdery_mildew"] = {
                "confidence": min(100, white_percentage * 3),
                "recommendation": "Spray with baking soda solution or fungicide"
            }
        
        if hole_density > 0.1:
            detections["pest_damage"] = {
                "confidence": min(100, hole_density * 1000),
                "recommendation": "Apply appropriate pesticide and introduce beneficial insects"
            }
        
        return detections
    
    except Exception as e:
        raise Exception(f"Pest/disease detection failed: {str(e)}")