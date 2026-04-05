import random

class SurgeMetrics:
    def __init__(self, multiplier: float, reason: str):
        self.multiplier = multiplier
        self.reason = reason

def calculate_environmental_surge(lat: float, lng: float) -> SurgeMetrics:
    """
    Mock service to calculate surge pricing based on environmental factors 
    like heavy rain (Monsoon Modifiers) or high traffic.
    In production, this would poll a Weather API or Google Maps Traffic API.
    """
    # Deterministic mock based on location simply for demonstration
    # In a real app, this would use live data
    
    # 20% chance of rain
    is_raining = random.random() < 0.20
    # 30% chance of heavy traffic
    heavy_traffic = random.random() < 0.30
    
    multiplier = 1.0
    reasons = []
    
    if is_raining:
        multiplier += 0.5 # 1.5x for rain
        reasons.append("Heavy Rain")
        
    if heavy_traffic:
        multiplier += 0.25 # 1.25x for traffic
        reasons.append("High Traffic")
        
    if not reasons:
        return SurgeMetrics(1.0, "Normal Conditions")
        
    return SurgeMetrics(multiplier, " + ".join(reasons))
