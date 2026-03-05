import re

with open("d:/Harman Data-2025/Harman Data/DOCTOR/archive/backend/server.py", "r", encoding="utf-8") as f:
    content = f.read()

# The specific routes to move
my_schedule_block = """@api_router.get("/doctors/my-schedule")
async def get_my_schedule(current_user: dict = Depends(get_doctor_user)):
    schedule = await db.doctor_schedules.find_one({"doctor_id": current_user["id"]}, {"_id": 0})
    blocked_dates = await db.availability.find(
        {"doctor_id": current_user["id"], "is_blocked": True},
        {"_id": 0}
    ).to_list(100)
    return {"schedule": schedule, "blocked_dates": blocked_dates}"""

availability_block = """@api_router.post("/doctors/availability/block")
async def block_availability(dates: List[str], current_user: dict = Depends(get_doctor_user)):
    \"\"\"Block specific dates (vacation, etc.)\"\"\"
    for date in dates:
        await db.availability.update_one(
            {"doctor_id": current_user["id"], "date": date},
            {"$set": {"doctor_id": current_user["id"], "date": date, "slots": [], "is_blocked": True}},
            upsert=True
        )
    return {"message": f"Blocked {len(dates)} dates"}"""

# Step 1: Remove them from their current location
if my_schedule_block in content and availability_block in content:
    content = content.replace(my_schedule_block, "")
    content = content.replace(availability_block, "")

    # Step 2: Insert them BEFORE @api_router.get("/doctors/{doctor_id}/schedule")
    insert_target = """@api_router.get("/doctors/{doctor_id}/schedule")"""

    insertion_code = f"{my_schedule_block}\n\n{availability_block}\n\n{insert_target}"
    content = content.replace(insert_target, insertion_code)

    with open("d:/Harman Data-2025/Harman Data/DOCTOR/archive/backend/server.py", "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

    print("Routes moved successfully.")
else:
    print("Blocks not found. Already moved or modified.")
