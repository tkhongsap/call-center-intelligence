#!/usr/bin/env python3
"""
PostgreSQL Database Seeder

Seeds the PostgreSQL database with sample data for the call center application.
"""

import asyncio
import sys
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

# Add the app directory to Python path
sys.path.insert(0, ".")

from app.core.config import get_settings


async def seed_database():
    """Seed the database with sample data."""
    settings = get_settings()

    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=True,
    )

    # Create session maker
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    print("🌱 Seeding PostgreSQL database with sample data...")

    async with async_session_maker() as session:
        try:
            # Clear existing data
            await session.execute(
                text(
                    "TRUNCATE TABLE shares, cases, alerts, trending_topics, feed_items, users RESTART IDENTITY CASCADE"
                )
            )

            # Sample users
            users_data = [
                (
                    "user-admin-001",
                    "Admin User",
                    "admin@thaibev.com",
                    "admin",
                    "ThaiBev",
                ),
                (
                    "user-agent-001",
                    "Agent Smith",
                    "agent1@thaibev.com",
                    "supervisor",
                    "ThaiBev",
                ),
                (
                    "user-manager-001",
                    "Manager Johnson",
                    "manager@thaibev.com",
                    "bu_manager",
                    "Sermsuk",
                ),
            ]

            for user_id, name, email, role, business_unit in users_data:
                await session.execute(
                    text(
                        """
                    INSERT INTO users (id, name, email, role, business_unit, created_at)
                    VALUES (:id, :name, :email, :role, :business_unit, :created_at)
                """
                    ),
                    {
                        "id": user_id,
                        "name": name,
                        "email": email,
                        "role": role,
                        "business_unit": business_unit,
                        "created_at": datetime.now().isoformat(),
                    },
                )

            print(f"✓ Inserted {len(users_data)} users")

            # Sample cases
            statuses = ["open", "in_progress", "resolved", "closed"]
            severities = ["low", "medium", "high", "critical"]
            categories = [
                "Billing",
                "Technical Support",
                "Product Inquiry",
                "Complaint",
                "Refund Request",
            ]
            channels = ["phone", "email", "line", "web"]
            sentiments = ["positive", "neutral", "negative"]
            business_units = ["ThaiBev", "Sermsuk", "Oishi", "KFC Thailand"]

            cases_data = []
            for i in range(1, 51):  # 50 cases
                created_date = (
                    datetime.now() - timedelta(days=30) + timedelta(days=i * 0.6)
                )
                case_data = {
                    "id": f"case-{i:03d}",
                    "case_number": f"CC-2024-{i:04d}",
                    "channel": channels[i % len(channels)],
                    "status": statuses[i % len(statuses)],
                    "category": categories[i % len(categories)],
                    "sentiment": sentiments[i % len(sentiments)],
                    "severity": severities[i % len(severities)],
                    "risk_flag": i % 5 == 0,  # 20% risk flag
                    "needs_review_flag": i % 4 == 0,  # 25% needs review
                    "business_unit": business_units[i % len(business_units)],
                    "summary": f"Sample case {i} - Customer inquiry about product/service",
                    "customer_name": f"Customer {i}",
                    "agent_id": users_data[i % len(users_data)][0],
                    "created_at": created_date.isoformat(),
                    "updated_at": created_date.isoformat(),
                    "resolved_at": (
                        (created_date + timedelta(hours=24)).isoformat()
                        if i % 2 == 0
                        else None
                    ),
                }
                cases_data.append(case_data)

                await session.execute(
                    text(
                        """
                    INSERT INTO cases (
                        id, case_number, channel, status, category, sentiment, severity,
                        risk_flag, needs_review_flag, business_unit, summary, customer_name,
                        agent_id, created_at, updated_at, resolved_at
                    ) VALUES (
                        :id, :case_number, :channel, :status, :category, :sentiment, :severity,
                        :risk_flag, :needs_review_flag, :business_unit, :summary, :customer_name,
                        :agent_id, :created_at, :updated_at, :resolved_at
                    )
                """
                    ),
                    case_data,
                )

            print(f"✓ Inserted {len(cases_data)} cases")

            # Sample alerts
            alert_types = ["spike", "threshold", "urgency", "misclassification"]
            alert_statuses = ["active", "acknowledged", "resolved"]

            for i in range(1, 21):  # 20 alerts
                created_date = (
                    datetime.now() - timedelta(days=7) + timedelta(hours=i * 8)
                )
                alert_data = {
                    "id": f"alert-{i:03d}",
                    "type": alert_types[i % len(alert_types)],
                    "severity": severities[i % len(severities)],
                    "status": alert_statuses[i % len(alert_statuses)],
                    "title": f"Alert {i}: High volume detected in {categories[i % len(categories)]}",
                    "description": f"Sample alert {i} - Detected unusual pattern in customer interactions",
                    "business_unit": business_units[i % len(business_units)],
                    "category": categories[i % len(categories)],
                    "baseline_value": 10.0 + (i * 2),
                    "current_value": 15.0 + (i * 3),
                    "percentage_change": 25.0 + (i * 1.5),
                    "created_at": created_date.isoformat(),
                    "updated_at": created_date.isoformat(),
                }

                await session.execute(
                    text(
                        """
                    INSERT INTO alerts (
                        id, type, severity, status, title, description, business_unit,
                        category, baseline_value, current_value, percentage_change,
                        created_at, updated_at
                    ) VALUES (
                        :id, :type, :severity, :status, :title, :description, :business_unit,
                        :category, :baseline_value, :current_value, :percentage_change,
                        :created_at, :updated_at
                    )
                """
                    ),
                    alert_data,
                )

            print("✓ Inserted 20 alerts")

            # Sample trending topics
            topics = [
                "Product Quality",
                "Delivery Issues",
                "Payment Problems",
                "Service Complaints",
                "Feature Requests",
            ]
            trends = ["rising", "stable", "declining"]

            for i, topic in enumerate(topics, 1):
                topic_data = {
                    "id": f"topic-{i:03d}",
                    "topic": topic,
                    "trend": trends[i % len(trends)],
                    "case_count": 10 + (i * 5),
                    "baseline_count": 8 + (i * 3),
                    "trend_score": 0.1 + (i * 0.15),
                    "business_unit": business_units[i % len(business_units)],
                    "category": categories[i % len(categories)],
                    "percentage_change": 15.0 + (i * 5),
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                }

                await session.execute(
                    text(
                        """
                    INSERT INTO trending_topics (
                        id, topic, trend, case_count, baseline_count, trend_score,
                        business_unit, category, percentage_change, created_at, updated_at
                    ) VALUES (
                        :id, :topic, :trend, :case_count, :baseline_count, :trend_score,
                        :business_unit, :category, :percentage_change, :created_at, :updated_at
                    )
                """
                    ),
                    topic_data,
                )

            print(f"✓ Inserted {len(topics)} trending topics")

            # Sample feed items
            feed_types = ["alert", "trending", "highlight", "upload"]

            for i in range(1, 16):  # 15 feed items
                created_date = datetime.now() - timedelta(hours=i * 2)
                feed_data = {
                    "id": f"feed-{i:03d}",
                    "type": feed_types[i % len(feed_types)],
                    "title": f"Feed Item {i}: Important Update",
                    "content": f"Sample feed content {i} - This is an important update for the team",
                    "priority": i % 5,
                    "reference_id": f"alert-{(i % 20) + 1:03d}" if i % 4 == 0 else None,
                    "reference_type": "alert" if i % 4 == 0 else None,
                    "created_at": created_date.isoformat(),
                }

                await session.execute(
                    text(
                        """
                    INSERT INTO feed_items (
                        id, type, title, content, priority, reference_id, reference_type, created_at
                    ) VALUES (
                        :id, :type, :title, :content, :priority, :reference_id, :reference_type, :created_at
                    )
                """
                    ),
                    feed_data,
                )

            print("✓ Inserted 15 feed items")

            # Commit all changes
            await session.commit()
            print("🎉 Database seeded successfully!")

        except Exception as e:
            await session.rollback()
            print(f"❌ Error seeding database: {e}")
            raise
        finally:
            await session.close()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
