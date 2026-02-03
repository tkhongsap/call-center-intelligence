"""
API Routes Module

Centralizes all API route definitions and provides the main API router.
"""

from fastapi import APIRouter

from app.api.routes import (
    alerts,
    cases,
    feed,
    search,
    uploads,
    trending,
    chat,
    events,
    export,
    inbox,
    predictions,
    pulse,
    shares,
    debug,
    websocket,
    auth,
    rag,
    incidents,
    metrics,
)

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(feed.router, prefix="/feed", tags=["feed"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(trending.router, prefix="/trending", tags=["trending"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(inbox.router, prefix="/inbox", tags=["inbox"])
api_router.include_router(
    predictions.router, prefix="/predictions", tags=["predictions"]
)
api_router.include_router(pulse.router, prefix="/pulse", tags=["pulse"])
api_router.include_router(shares.router, prefix="/shares", tags=["shares"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])

# Include upload route (separate from uploads for file handling)
api_router.include_router(uploads.upload_router, prefix="/upload", tags=["upload"])

# Include WebSocket routes
if websocket.router:
    api_router.include_router(websocket.router, tags=["websocket"])

# Include debug routes only in development
from app.core.config import get_settings

settings = get_settings()
if settings.DEBUG:
    api_router.include_router(debug.router, prefix="/debug-db", tags=["debug"])
