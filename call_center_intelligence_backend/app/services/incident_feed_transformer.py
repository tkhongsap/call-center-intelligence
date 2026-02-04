"""
Incident to Feed Item Transformation Service

Transforms incident data from the database into feed items for display in the news feed.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timezone

from app.models.incident import Incident
from app.models.base import FeedItemType
from app.schemas.feed import FeedItemResponse


def determine_priority(incident: Incident) -> int:
    """
    Map incident status to priority (1-10 scale).
    
    Rules:
    - Status contains 'urgent'/'critical': priority 9
    - Status contains 'open'/'pending': priority 5
    - Status contains 'closed'/'resolved': priority 2
    - Default: priority 5
    
    Args:
        incident: The incident to determine priority for
        
    Returns:
        Priority value between 1 and 10
    """
    if not incident.status:
        return 5
    
    status_lower = incident.status.lower()
    
    if 'urgent' in status_lower or 'critical' in status_lower:
        return 9
    elif 'open' in status_lower or 'pending' in status_lower:
        return 5
    elif 'closed' in status_lower or 'resolved' in status_lower:
        return 2
    
    return 5


def determine_feed_type(incident: Incident) -> FeedItemType:
    """
    Determine feed type based on incident properties.
    
    Rules:
    - 'alert': status contains 'urgent' or 'critical' (case-insensitive)
    - 'trending': issue_type appears frequently (>5 times in recent incidents)
    - 'highlight': default for all other incidents
    
    Note: Trending detection requires database query context, so for now
    we only check status for alert type and default to highlight.
    
    Args:
        incident: The incident to determine feed type for
        
    Returns:
        FeedItemType enum value
    """
    if incident.status:
        status_lower = incident.status.lower()
        if 'urgent' in status_lower or 'critical' in status_lower:
            return FeedItemType.alert
    
    # Default to highlight (trending detection would require DB context)
    return FeedItemType.highlight


def transform_incident_to_feed_item(incident: Incident) -> FeedItemResponse:
    """
    Transform an Incident model instance into a FeedItemResponse.
    
    Maps incident fields to feed item fields:
    - incident_number → id
    - subject/issue_type → title
    - summary/details → content (prioritizes summary)
    - received_date → createdAt
    - Determines type based on status/issue_type
    - Sets priority based on status
    
    Handles null/missing fields with appropriate fallbacks:
    - Title: Use subject if available, otherwise issue_type, then "Untitled Incident"
    - Content: Use summary if available, otherwise details, then "No summary available"
    - Timestamp: Use received_date if available, otherwise created_at
    - Customer name: Display "Unknown" if null
    
    Args:
        incident: The incident to transform
        
    Returns:
        FeedItemResponse with all required fields populated
    """
    # Determine title with fallbacks
    title = incident.subject or incident.issue_type or "Untitled Incident"
    
    # Determine content with fallback - use summary instead of details
    content = incident.summary or incident.details or "No summary available"
    
    # Determine timestamp with fallback
    timestamp = incident.received_date or incident.created_at
    if timestamp:
        # Ensure timezone-aware datetime
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        created_at = timestamp.isoformat().replace("+00:00", "Z")
    else:
        # Fallback to current time if no timestamp available
        created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    # Determine feed type and priority
    feed_type = determine_feed_type(incident)
    priority = determine_priority(incident)
    
    # Build metadata with incident details
    metadata: Dict[str, Any] = {
        "customer_name": incident.customer_name or "Unknown",
        "status": incident.status or "Unknown",
        "issue_type": incident.issue_type or "Unknown",
        "province": incident.province or "Unknown",
        "product_group": incident.product_group or "Unknown",
        "receiver": incident.receiver or "Unknown",
        "incident_number": incident.incident_number,
        "subject": incident.subject or "No subject",
        "priority": incident.priority.value if incident.priority else None,
    }
    
    # Add optional fields if available
    if incident.contact_channel:
        metadata["contact_channel"] = incident.contact_channel
    if incident.product:
        metadata["product"] = incident.product
    if incident.reference_number:
        metadata["reference_number"] = incident.reference_number
    
    # Create and return FeedItemResponse
    return FeedItemResponse(
        id=incident.incident_number,
        type=feed_type,
        title=title,
        content=content,
        priority=priority,
        reference_id=str(incident.id),
        reference_type="incident",
        item_metadata=metadata,
        created_at=created_at,
        expires_at=None,
    )
