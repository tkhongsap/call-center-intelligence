"""
Script to check incidents in the database
"""
import asyncio
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.incident import Incident

async def check_incidents():
    async for db in get_db():
        try:
            # Count incidents
            count_query = select(func.count(Incident.id))
            result = await db.execute(count_query)
            count = result.scalar()
            print(f'Total incidents in database: {count}')
            
            # Get a few sample incidents
            if count > 0:
                query = select(Incident).limit(5)
                result = await db.execute(query)
                incidents = result.scalars().all()
                print('\nSample incidents:')
                for inc in incidents:
                    print(f'  - {inc.incident_number}: {inc.subject or inc.issue_type}')
                    print(f'    Status: {inc.status}, Customer: {inc.customer_name}')
                    print(f'    Province: {inc.province}, Date: {inc.received_date}')
            break
        except Exception as e:
            print(f'Error: {e}')
            import traceback
            traceback.print_exc()
            break

if __name__ == "__main__":
    asyncio.run(check_incidents())
