"""
WebSocket Routes

Handles WebSocket connections for real-time features.
"""

from typing import Optional
import logging

try:
    from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
except ImportError:
    # For testing without FastAPI
    APIRouter = None
    WebSocket = None
    WebSocketDisconnect = Exception
    Query = None

from app.core.websocket import connection_manager, create_message, MessageType

logger = logging.getLogger(__name__)

router = APIRouter() if APIRouter else None


if router:

    @router.websocket("/ws")
    async def websocket_endpoint(
        websocket: WebSocket,
        token: Optional[str] = Query(None, description="Authentication token"),
    ):
        """WebSocket endpoint for real-time communication."""
        connection_id = None

        try:
            # Connect and authenticate
            connection_id = await connection_manager.connect(websocket, token)

            # Send connection established message
            welcome_message = create_message(
                MessageType.CONNECTION_ESTABLISHED,
                {
                    "connection_id": connection_id,
                    "message": "WebSocket connection established successfully",
                },
            )
            await connection_manager.send_personal_message(
                welcome_message, connection_id
            )

            # Keep connection alive and handle incoming messages
            while True:
                try:
                    # Receive message from client
                    data = await websocket.receive_text()
                    logger.debug(f"Received WebSocket message Connection_Id: {connection_id} Data: {data}")

                    # Echo message back (for testing)
                    # In a real implementation, you would parse and handle different message types
                    echo_message = create_message(
                        "echo",
                        {"original_message": data, "connection_id": connection_id},
                    )
                    await connection_manager.send_personal_message(
                        echo_message, connection_id
                    )

                except WebSocketDisconnect:
                    logger.info(f"WebSocket client disconnected Connection_Id: {connection_id}")
                    break
                except Exception as e:
                    logger.error(f"Error handling WebSocket message Connection_Id: {connection_id} Error: {str(e)}")
                    error_message = create_message(
                        MessageType.CONNECTION_ERROR,
                        {"error": "Failed to process message", "details": str(e)},
                    )
                    await connection_manager.send_personal_message(
                        error_message, connection_id
                    )

        except Exception as e:
            logger.error(f"WebSocket connection error Error: {str(e)}")

        finally:
            # Clean up connection
            if connection_id:
                connection_manager.disconnect(connection_id)

    @router.get("/ws/info")
    async def websocket_info():
        """Get information about active WebSocket connections."""
        return connection_manager.get_connection_info()
