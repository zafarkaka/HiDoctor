import httpx
import asyncio
from typing import List, Dict, Any, Optional

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def send_push_notifications(messages: List[Dict[str, Any]]):
    """
    Send push notifications using Expo's HTTP API.
    `messages` should be a list of dictionaries with at least:
    - to: The Expo push token(s)
    - title: The notification title
    - body: The notification body
    - data: Optional dictionary of data payload
    """
    valid_messages = [msg for msg in messages if msg.get("to") and msg["to"].startswith("ExponentPushToken")]
    
    if not valid_messages:
        return
        
    try:
        async with httpx.AsyncClient() as client:
            # Add delivery settings for background/closed app reliability
            for msg in valid_messages:
                if "priority" not in msg:
                    msg["priority"] = "high"
                if "channelId" not in msg:
                    msg["channelId"] = "default"

            response = await client.post(
                EXPO_PUSH_URL,
                json=valid_messages,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                }
            )
            
            if response.status_code != 200:
                print(f"Expo push API error: {response.status_code} - {response.text}")
            else:
                data = response.json()
                if "errors" in data:
                    print(f"Expo push delivery errors: {data['errors']}")
                    
    except Exception as e:
        print(f"Failed to send push notification: {e}")

async def send_chat_notification(app, receiver_id: str, sender_name: str, message_text: str, appointment_id: str):
    """Send a notification to a user about a new chat message."""
    try:
        # Use 'id' field which is a string UUID in this schema, not MongoDB's '_id'
        user = await app.state.db.users.find_one({"id": receiver_id})
        
        if user and user.get("push_token"):
            push_token = user["push_token"]
            
            message_body = message_text
            if not message_body:
                message_body = "Sent an attachment"
                
            await send_push_notifications([{
                "to": push_token,
                "title": f"HiDoctor: New message from {sender_name}",
                "body": message_body,
                "sound": "default",
                "data": {
                    "type": "chat",
                    "appointment_id": appointment_id
                }
            }])
    except Exception as e:
        print(f"Error preparing chat notification: {e}")

async def send_call_notification(app, receiver_id: str, caller_name: str, appointment_id: str, is_video: bool = True):
    """Send a notification to a user about an incoming call."""
    try:
        user = await app.state.db.users.find_one({"id": receiver_id})
        
        if user and user.get("push_token"):
            push_token = user["push_token"]
            
            call_type = "Video call" if is_video else "Audio call"
            
            await send_push_notifications([{
                "to": push_token,
                "title": f"HiDoctor: Incoming {call_type}",
                "body": f"{caller_name} is calling you",
                "sound": "default",
                "data": {
                    "type": "call",
                    "appointment_id": appointment_id,
                    "is_video": is_video
                }
            }])
    except Exception as e:
        print(f"Error preparing call notification: {e}")
async def send_push_notification_to_user(app, user_id: str, title: str, body: str, data: Optional[Dict[str, Any]] = None):
    """Send a generic push notification to a user."""
    try:
        user = await app.state.db.users.find_one({"id": user_id})
        
        if user and user.get("push_token"):
            push_token = user["push_token"]
            
            await send_push_notifications([{
                "to": push_token,
                "title": f"HiDoctor: {title}",
                "body": body,
                "sound": "default",
                "data": data or {}
            }])
    except Exception as e:
        print(f"Error sending push notification to user {user_id}: {e}")
