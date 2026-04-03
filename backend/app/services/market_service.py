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

# Popular supermarkets
CITY_SUPERMARKETS: Dict[str, List[str]] = {
    "Lagos": ["Shoprite", "Spar", "Prince Ebeano", "Hubmart", "Market Square", "Addide", "Justrite"],
    "Abuja": ["Shoprite", "Sahad Stores", "H-Medix", "Spar", "Exclusive Supermarket", "Next Cash 'n' Carry"],
    "Port Harcourt": ["Shoprite", "Spar", "Market Square", "Next Cash 'n' Carry"],
    "Ibadan": ["Shoprite", "Foodco", "Ventura Mall", "Spar"],
    "Kano": ["Shoprite", "Sahad Stores", "Al-Mansur"],
    "Enugu": ["Shoprite", "Spar", "Market Square"],
    "Benin City": ["Market Square", "Shoprite", "Hallmark"],
    "Kaduna": ["Shoprite", "Sahad Stores"]
}

class MarketService:
    @staticmethod
    def get_popular_markets(city: Optional[str]) -> List[str]:
        if not city:
            return CITY_MARKETS["Lagos"] + CITY_SUPERMARKETS["Lagos"]
        
        # Match city (case insensitive and partial)
        for c, markets in CITY_MARKETS.items():
            if city.lower() in c.lower() or c.lower() in city.lower():
                supermarkets = CITY_SUPERMARKETS.get(c, [])
                return markets + supermarkets
                
        return CITY_MARKETS["Lagos"] + CITY_SUPERMARKETS["Lagos"]
