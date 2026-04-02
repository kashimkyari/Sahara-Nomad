from typing import List, Dict, Optional

# Popular markets data gathered from public info
CITY_MARKETS: Dict[str, List[str]] = {
    "Lagos": ["Balogun Market", "Computer Village", "Mile 12 Market", "Oshodi Market", "Tejuosho Market", "Alaba International"],
    "Abuja": ["Wuse Market", "Garki International Market", "Utako Market", "Karmo Market", "Kado Fish Market"],
    "Port Harcourt": ["Oil Mill Market", "Mile 1 Market", "Mile 3 Market", "Choba Market", "Rumuokoro Market", "Creek Road Market"],
    "Ibadan": ["Bodija Market", "New Gbagi Market", "Dugbe Market", "Ogunpa Market", "Aleshinloye Market"],
    "Kano": ["Kantin Kwari Market", "Kurmi Market", "Kofar Wambai Market"],
    "Enugu": ["Ogbete Main Market", "Aria New Market", "Old Artisan Market", "Gariki Market"],
    "Benin City": ["Oba Market", "New Benin Market", "Uselu Market", "Oliha Market"],
    "Kaduna": ["Central Market", "Kasuwar Barci Market", "Panteka Market", "Tudun Wada Market"]
}

class MarketService:
    @staticmethod
    def get_popular_markets(city: Optional[str]) -> List[str]:
        if not city:
            return CITY_MARKETS["Lagos"] # Fallback to Lagos
        
        # Match city (case insensitive and partial)
        for c, markets in CITY_MARKETS.items():
            if city.lower() in c.lower() or c.lower() in city.lower():
                return markets
                
        return CITY_MARKETS["Lagos"] # Default fallback
