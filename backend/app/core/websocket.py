"""
WebSocket Connection Manager

Handles WebSocket connections for real-time features including:
- Connection lifecycle management
- Message broadcasting to connected clients
- User-based connection registry
- Permission-based message filtering
"""

import json
import logging
from typing import Dict, List, Set, Optional, Any
from datetime import datetime, timezone

try:
    from fastapi import WebSocket, WebSocketDisconnect
    from fastapi.websockets import WebSocketState
except ImportError:
    # For testing without FastAPI
    WebSocket = None
    WebSocketDisconnect = Exception
    WebSocketState = None

from app.core.auth import verify_token, AuthenticationError
from app.models.user import UserRole

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""

    def __init__(self):
        # Active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}

        # User connections: {user_id: Set[connection_id]}
        self.user_connections: Dict[str, Set[str]] = {}

        # Connection metadata: {connection_id: user_info}
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}

        # Business unit connections: {business_unit: Set[connection_id]}
        self.business_unit_connections: Dict[str, Set[str]] = {}

        # Role-based connections: {role: Set[connection_id]}
        self.role_connections: Dict[str, Set[str]] = {}

    def _generate_connection_id(self, websocket: WebSocket) -> str:
        """Generate a unique connection ID."""
        return f"conn_{id(websocket)}_{datetime.now(timezone.utc).timestamp()}"

    async def connect(self, websocket: WebSocket, token: Optional[str] = None) -> str:
        """Accept a WebSocket connection and authenticate the user."""
        await websocket.accept()
        connection_id = self._generate_connection_id(websocket)

        # Authenticate user if token provided
        user_info = None
        if token:
            try:
                payload = verify_token(token)
                user_info = {
                    "id": payload.get("sub"),
                    "email": payload.get("email"),
                    "name": payload.get("name"),
                    "role": payload.get("role"),
                    "business_unit": payload.get("business_unit"),
                }
                logger.info(f"WebSocket user authenticated User_Id: {user_info['id']} Connection_Id: {connection_id}")
            except AuthenticationError:
                logger.warning(f"WebSocket authentication failed Connection_Id: {connection_id}")
                user_info = None

        # Store connection
        self.active_connections[connection_id] = websocket
        self.connection_metadata[connection_id] = user_info or {}

        # Index by user
        if user_info and user_info.get("id"):
            user_id = user_info["id"]
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(connection_id)

            # Index by business unit
            business_unit = user_info.get("business_unit")
            if business_unit:
                if business_unit not in self.business_unit_connections:
                    self.business_unit_connections[business_unit] = set()
                self.business_unit_connections[business_unit].add(connection_id)

            # Index by role
            role = user_info.get("role")
            if role:
                if role not in self.role_connections:
                    self.role_connections[role] = set()
                self.role_connections[role].add(connection_id)

        logger.info(f"WebSocket connection established Connection_Id: {connection_id} Total_Connections: {len(self.active_connections)}")
        return connection_id

    def disconnect(self, connection_id: str):
        """Remove a WebSocket connection."""
        if connection_id not in self.active_connections:
            return

        # Get user info before removing
        user_info = self.connection_metadata.get(connection_id, {})
        user_id = user_info.get("id")
        business_unit = user_info.get("business_unit")
        role = user_info.get("role")

        # Remove from active connections
        del self.active_connections[connection_id]
        del self.connection_metadata[connection_id]

        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        # Remove from business unit connections
        if business_unit and business_unit in self.business_unit_connections:
            self.business_unit_connections[business_unit].discard(connection_id)
            if not self.business_unit_connections[business_unit]:
                del self.business_unit_connections[business_unit]

        # Remove from role connections
        if role and role in self.role_connections:
            self.role_connections[role].discard(connection_id)
            if not self.role_connections[role]:
                del self.role_connections[role]

        logger.info(f"WebSocket connection closed Connection_Id: {connection_id} Total_Connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], connection_id: str):
        """Send a message to a specific connection."""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                await websocket.send_text(json.dumps(message))
                logger.debug(f"Message sent to connection Connection_Id: {connection_id} Message_Type: {message.get('type')}")
            except Exception as e:
                logger.error(f"Failed to send message to connection Connection_Id: {connection_id} Error: {str(e)}")
                self.disconnect(connection_id)

    async def send_to_user(self, message: Dict[str, Any], user_id: str):
        """Send a message to all connections of a specific user."""
        if user_id in self.user_connections:
            connection_ids = list(
                self.user_connections[user_id]
            )  # Copy to avoid modification during iteration
            for connection_id in connection_ids:
                await self.send_personal_message(message, connection_id)

    async def send_to_business_unit(self, message: Dict[str, Any], business_unit: str):
        """Send a message to all connections in a business unit."""
        if business_unit in self.business_unit_connections:
            connection_ids = list(self.business_unit_connections[business_unit])
            for connection_id in connection_ids:
                await self.send_personal_message(message, connection_id)

    async def send_to_role(self, message: Dict[str, Any], role: str):
        """Send a message to all connections with a specific role."""
        if role in self.role_connections:
            connection_ids = list(self.role_connections[role])
            for connection_id in connection_ids:
                await self.send_personal_message(message, connection_id)

    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        if not self.active_connections:
            return

        connection_ids = list(
            self.active_connections.keys()
        )  # Copy to avoid modification during iteration
        for connection_id in connection_ids:
            await self.send_personal_message(message, connection_id)

        logger.info(f"Message broadcast to all connections Message_Type: {message.get('type')} Connection_Count: {len(connection_ids)}")

    async def broadcast_to_admins(self, message: Dict[str, Any]):
        """Broadcast a message to all admin users."""
        await self.send_to_role(message, UserRole.ADMIN.value)

    async def broadcast_to_managers_and_admins(self, message: Dict[str, Any]):
        """Broadcast a message to managers and admins."""
        await self.send_to_role(message, UserRole.ADMIN.value)
        await self.send_to_role(message, UserRole.BU_MANAGER.value)

    def get_connection_count(self) -> int:
        """Get the total number of active connections."""
        return len(self.active_connections)

    def get_user_connection_count(self, user_id: str) -> int:
        """Get the number of connections for a specific user."""
        return len(self.user_connections.get(user_id, set()))

    def get_business_unit_connection_count(self, business_unit: str) -> int:
        """Get the number of connections for a specific business unit."""
        return len(self.business_unit_connections.get(business_unit, set()))

    def is_user_connected(self, user_id: str) -> bool:
        """Check if a user has any active connections."""
        return (
            user_id in self.user_connections and len(self.user_connections[user_id]) > 0
        )

    def get_connection_info(self) -> Dict[str, Any]:
        """Get information about all active connections."""
        return {
            "total_connections": len(self.active_connections),
            "users_connected": len(self.user_connections),
            "business_units": list(self.business_unit_connections.keys()),
            "roles": list(self.role_connections.keys()),
            "connections": [
                {
                    "connection_id": conn_id,
                    "user_info": self.connection_metadata.get(conn_id, {}),
                }
                for conn_id in self.active_connections.keys()
            ],
        }


# Global connection manager instance
connection_manager = ConnectionManager()


# Message type constants for real-time events
class MessageType:
    """Constants for WebSocket message types."""

    # Alert-related messages
    ALERT_CREATED = "alert_created"
    ALERT_UPDATED = "alert_updated"
    ALERT_ACKNOWLEDGED = "alert_acknowledged"
    ALERT_RESOLVED = "alert_resolved"

    # Case-related messages
    CASE_CREATED = "case_created"
    CASE_UPDATED = "case_updated"
    CASE_ASSIGNED = "case_assigned"
    CASE_STATUS_CHANGED = "case_status_changed"

    # Feed-related messages
    FEED_ITEM_CREATED = "feed_item_created"
    FEED_ITEM_UPDATED = "feed_item_updated"

    # Upload-related messages
    UPLOAD_STARTED = "upload_started"
    UPLOAD_PROGRESS = "upload_progress"
    UPLOAD_COMPLETED = "upload_completed"
    UPLOAD_FAILED = "upload_failed"

    # System messages
    SYSTEM_NOTIFICATION = "system_notification"
    MAINTENANCE_MODE = "maintenance_mode"

    # Chat messages
    CHAT_MESSAGE = "chat_message"

    # Connection events
    CONNECTION_ESTABLISHED = "connection_established"
    CONNECTION_ERROR = "connection_error"


def create_message(
    message_type: str, data: Dict[str, Any], user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a standardized WebSocket message."""
    return {
        "type": message_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "user_id": user_id,
    }


async def notify_alert_created(alert_data: Dict[str, Any]):
    """Notify relevant users about a new alert."""
    message = create_message(MessageType.ALERT_CREATED, alert_data)

    # Notify admins and managers
    await connection_manager.broadcast_to_managers_and_admins(message)

    # Notify users in the same business unit
    business_unit = alert_data.get("business_unit")
    if business_unit:
        await connection_manager.send_to_business_unit(message, business_unit)


async def notify_case_assigned(case_data: Dict[str, Any], assigned_to: str):
    """Notify a user about case assignment."""
    message = create_message(MessageType.CASE_ASSIGNED, case_data, assigned_to)
    await connection_manager.send_to_user(message, assigned_to)


async def notify_upload_progress(upload_data: Dict[str, Any], user_id: str):
    """Notify a user about upload progress."""
    message = create_message(MessageType.UPLOAD_PROGRESS, upload_data, user_id)
    await connection_manager.send_to_user(message, user_id)


async def broadcast_system_notification(notification_data: Dict[str, Any]):
    """Broadcast a system notification to all users."""
    message = create_message(MessageType.SYSTEM_NOTIFICATION, notification_data)
    await connection_manager.broadcast_to_all(message)
