import os
import re

file_path = r"d:/Harman Data-2025/Harman Data/DOCTOR/archive/backend/server.py"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the block
new_func = '''@api_router.get("/doctors/{doctor_id}/available-slots")
async def get_available_slots(doctor_id: str, date: str):
    """Get available time slots for a specific date"""
    from datetime import datetime as dt
    
    # 1. Check if the date is explicitly marked as a holiday
    doctor = await db.doctors.find_one({"user_id": doctor_id}, {"_id": 0, "holidays": 1, "working_hours": 1})
    if not doctor:
        return {"date": date, "slots": []}
        
    if date in doctor.get("holidays", []):
        return {"date": date, "slots": []}
        
    override = await db.availability.find_one({"doctor_id": doctor_id, "date": date}, {"_id": 0})
    if override and override.get("is_blocked"):
        return {"date": date, "slots": []}
    
    # 2. Parse date to get day of week as a lowercase string
    try:
        parsed_date = dt.strptime(date, "%Y-%m-%d")
        day_str = parsed_date.strftime("%A").lower()  # "monday", "tuesday", etc.
    except:
        return {"date": date, "slots": []}
        
    working_hours = doctor.get("working_hours", {})
    
    # 3. If doctor hasn't set any working hours yet, fallback to default 9-17 Mon-Fri slots:
    if not working_hours:
        if parsed_date.weekday() >= 5: # Sat/Sun
            return {"date": date, "slots": []}
            
        slots = []
        for hour in range(9, 17):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                slots.append({"time": time_str, "is_available": True})
    else:
        # Generate slots based on working_hours config
        day_config = working_hours.get(day_str, {})
        if not day_config or not day_config.get("active", False):
            return {"date": date, "slots": []}
            
        slots_list = day_config.get("slots", [])
        slots = []
        
        for slot_block in slots_list:
            try:
                start_h, start_m = map(int, slot_block["start"].split(":"))
                end_h, end_m = map(int, slot_block["end"].split(":"))
                current_time = start_h * 60 + start_m
                end_time = end_h * 60 + end_m
                
                while current_time < end_time:
                    hour = current_time // 60
                    minute = current_time % 60
                    slots.append({"time": f"{hour:02d}:{minute:02d}", "is_available": True})
                    current_time += 30 # default 30 min duration
            except:
                continue

    # 4. Check existing appointments for the date
    existing_appointments = await db.appointments.find(
        {"doctor_id": doctor_id, "appointment_date": date, "status": {"$in": ["pending", "confirmed"]}},
        {"_id": 0, "appointment_time": 1}
    ).to_list(100)
    
    booked_times = {apt["appointment_time"] for apt in existing_appointments}
    
    for slot in slots:
        if slot["time"] in booked_times:
            slot["is_available"] = False
            
    return {"date": date, "slots": slots}'''

content = re.sub(
    r'@api_router\.get\("/doctors/\{doctor_id\}/available-slots"\)\s*async def get_available_slots\(doctor_id: str, date: str\):.*?return \{"date": date, "slots": slots\}',
    new_func,
    content,
    flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement done!")
