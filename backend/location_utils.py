
import re

def extract_location_from_address(address: str) -> str:
    """
    Extracts a city or area tag from a full address string.
    Supports formats like:
    - "Vaniyambadi, Tamil Nadu" -> "Vaniyambadi"
    - "No. 123, Anna Salai, Chennai, TN" -> "Chennai"
    - "Opp to Railway Station, Vellore" -> "Vellore"
    """
    if not address:
        return ""
        
    # Standard cleanup
    address = address.strip()
    
    # Famous South Indian cities handling (Exact match/partial)
    cities = [
        'Bangalore', 'Bengaluru', 'Chennai', 'Madras', 'Hyderabad', 
        'Kochi', 'Cochin', 'Coimbatore', 'Madurai', 'Mysore', 'Mysuru', 
        'Vaniyambadi', 'Vellore', 'Salem', 'Trichy', 'Tiruchirappalli',
        'Pondicherry', 'Puducherry', 'Hosur', 'Ambur'
    ]
    
    # Try to find an exact city name in the comma-separated parts (right to left typically)
    parts = [p.strip() for p in address.split(',')]
    
    for city in cities:
        for part in reversed(parts):
            if city.lower() in part.lower():
                # Return standardized name
                if city in ['Bengaluru', 'Bangalore']: return 'Bangalore'
                if city in ['Madras', 'Chennai']: return 'Chennai'
                if city in ['Cochin', 'Kochi']: return 'Kochi'
                if city in ['Mysore', 'Mysuru']: return 'Mysore'
                if city in ['Tiruchirappalli', 'Trichy']: return 'Trichy'
                if city in ['Puducherry', 'Pondicherry']: return 'Pondicherry'
                return city

    # Fallback: return the last part that isn't a PIN code or state
    states = ['Tamil Nadu', 'TN', 'Karnataka', 'KA', 'Kerala', 'KL', 'Andhra Pradesh', 'AP', 'Telangana', 'TS']
    
    for part in reversed(parts):
        # Ignore PIN codes (6 digits)
        if re.search(r'\d{6}', part):
            continue
        # Ignore states
        if any(state.lower() in part.lower() for state in states):
            continue
        # If it's a short part (likely city), return it
        if len(part) < 25:
            return part
            
    return parts[-1] if parts else ""
