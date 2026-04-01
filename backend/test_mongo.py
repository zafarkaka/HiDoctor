import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    print("Testing connection to Atlas...")
    url = "mongodb+srv://zafukaka_db_user:ykxIa4hrUOBBLfKs@ac-fh3vtag.kqi4fdu.mongodb.net/hidoctor_db?retryWrites=true&w=majority"
    client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
    db = client.get_database('hidoctor_db')
    try:
        res = await db.command('ping')
        print("SUCCESS! Ping response:", res)
    except Exception as e:
        print("FAILED! Exception:", type(e).__name__, ":", e)

if __name__ == '__main__':
    asyncio.run(test())
