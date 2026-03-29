
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from location_utils import extract_location_from_address

async def test_extraction():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Test 1: Utility check
    addr = "No. 123, Anna Salai, Chennai, TN 600002"
    loc = extract_location_from_address(addr)
    print(f"Extraction Test: '{addr}' -> '{loc}'")
    assert loc == "Chennai"
    
    # Test 2: Vaniyambadi
    addr2 = "Opp to Railway Station, Vaniyambadi 635751"
    loc2 = extract_location_from_address(addr2)
    print(f"Extraction Test: '{addr2}' -> '{loc2}'")
    assert loc2 == "Vaniyambadi"
    
    print("All extraction tests PASSED")

if __name__ == '__main__':
    asyncio.run(test_extraction())
