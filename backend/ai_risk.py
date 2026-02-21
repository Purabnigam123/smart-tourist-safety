from datetime import datetime

def calculate_risk(latitude, longitude, in_restricted_zone, sos_triggered=False):
    """Calculate risk level based on multiple factors"""
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        raise ValueError("Latitude and longitude must be numeric values")
    
    if not isinstance(in_restricted_zone, bool) or not isinstance(sos_triggered, bool):
        raise ValueError("Restricted zone and SOS triggered must be boolean values")
    
    risk = 0

    # Night-time risk (local time)
    hour = datetime.now().hour
    
    if hour >= 20 or hour <= 6:
        risk += 30

    # Restricted area risk
    if in_restricted_zone:
        risk += 40

    # SOS history risk
    if sos_triggered:
        risk += 30

    # Determine risk level
    if risk >= 70:
        level = "HIGH"
    elif risk >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "risk_score": risk,
        "risk_level": level
    }
