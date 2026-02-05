"""
One-time script to create alerts for existing HIGH and MEDIUM priority incidents.
"""

import asyncio
import uuid
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
import app.core.database as db_module

from app.models.incident import Incident, PriorityLevel
from app.models.alert import Alert
from app.models.base import AlertType, Severity, AlertStatus


async def create_alerts_for_existing_incidents():
    """Create alerts for existing HIGH and MEDIUM priority incidents."""
    
    # Initialize database
    await db_module.init_db()
    
    # Create session using the global async_session_maker
    async with db_module.async_session_maker() as db:
        # Query for HIGH and MEDIUM priority incidents
        result = await db.execute(
            select(Incident).where(
                Incident.priority.in_([PriorityLevel.HIGH, PriorityLevel.MEDIUM])
            )
        )
        incidents = result.scalars().all()
        
        print(f"Found {len(incidents)} HIGH/MEDIUM priority incidents")
        
        alerts_created = 0
        
        for incident in incidents:
            try:
                # Map priority to severity
                severity = Severity.high if incident.priority == PriorityLevel.HIGH else Severity.medium
                
                # Get current timestamp
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                
                # Create alert
                alert = Alert(
                    id=str(uuid.uuid4()),
                    type=AlertType.threshold,
                    severity=severity,
                    title=f"Incident {incident.incident_number} - {incident.priority.value.upper()} Priority",
                    description=incident.summary or (incident.details[:200] if incident.details else "No description available"),
                    status=AlertStatus.active,
                    business_unit=incident.product_group,
                    category=incident.issue_type,
                    channel=incident.contact_channel,
                    created_at=now,
                    updated_at=now
                )
                
                db.add(alert)
                alerts_created += 1
                print(f"Created alert for incident {incident.incident_number} ({incident.priority.value})")
                
            except Exception as e:
                print(f"Error creating alert for incident {incident.incident_number}: {str(e)}")
        
        # Commit all alerts
        if alerts_created > 0:
            await db.commit()
            print(f"\n✅ Successfully created {alerts_created} alerts")
        else:
            print("\n⚠️ No alerts created")


if __name__ == "__main__":
    asyncio.run(create_alerts_for_existing_incidents())
