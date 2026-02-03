
"""
Incident schemas for API validation and serialization.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class IncidentBase(BaseModel):
    """Base incident schema with common fields."""
    incident_number: str = Field(..., description="Unique incident number")
    reference_number: Optional[str] = Field(None, description="Reference number")
    received_date: Optional[datetime] = Field(None, description="Date incident was received")
    closed_date: Optional[datetime] = Field(None, description="Date incident was closed")
    contact_channel: Optional[str] = Field(None, description="Contact channel (phone, email, etc.)")
    customer_name: Optional[str] = Field(None, description="Customer name")
    phone: Optional[str] = Field(None, description="Customer phone number")
    issue_type: Optional[str] = Field(None, description="Primary issue type")
    issue_subtype_1: Optional[str] = Field(None, description="Issue subtype level 1")
    issue_subtype_2: Optional[str] = Field(None, description="Issue subtype level 2")
    product: Optional[str] = Field(None, description="Product name")
    product_group: Optional[str] = Field(None, description="Product group")
    factory: Optional[str] = Field(None, description="Manufacturing factory")
    production_code: Optional[str] = Field(None, description="Production code")
    details: Optional[str] = Field(None, description="Incident details")
    solution: Optional[str] = Field(None, description="Solution provided")
    solution_from_thaibev: Optional[str] = Field(None, description="Solution from ThaiBev")
    subject: Optional[str] = Field(None, description="Incident subject")
    district: Optional[str] = Field(None, description="District")
    province: Optional[str] = Field(None, description="Province")
    order_channel: Optional[str] = Field(None, description="Order channel")
    status: Optional[str] = Field(None, description="Incident status")
    receiver: Optional[str] = Field(None, description="Person who received the incident")
    closer: Optional[str] = Field(None, description="Person who closed the incident")
    sla: Optional[str] = Field(None, description="SLA information")
    upload_id: Optional[str] = Field(None, description="Upload batch ID")


class IncidentCreate(IncidentBase):
    """Schema for creating a new incident."""
    pass


class IncidentUpdate(BaseModel):
    """Schema for updating an incident (all fields optional)."""
    incident_number: Optional[str] = None
    reference_number: Optional[str] = None
    received_date: Optional[datetime] = None
    closed_date: Optional[datetime] = None
    contact_channel: Optional[str] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    issue_type: Optional[str] = None
    issue_subtype_1: Optional[str] = None
    issue_subtype_2: Optional[str] = None
    product: Optional[str] = None
    product_group: Optional[str] = None
    factory: Optional[str] = None
    production_code: Optional[str] = None
    details: Optional[str] = None
    solution: Optional[str] = None
    solution_from_thaibev: Optional[str] = None
    subject: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    order_channel: Optional[str] = None
    status: Optional[str] = None
    receiver: Optional[str] = None
    closer: Optional[str] = None
    sla: Optional[str] = None
    upload_id: Optional[str] = None


class IncidentResponse(IncidentBase):
    """Schema for incident responses."""
    id: int = Field(..., description="Incident ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class IncidentListResponse(BaseModel):
    """Schema for paginated incident list responses."""
    incidents: list[IncidentResponse]
    total: int
    page: int
    page_size: int


class WordRankingItem(BaseModel):
    """Schema for a single word in the ranking."""
    rank: int = Field(..., description="Rank position (1 = most frequent)")
    word: str = Field(..., description="The Thai word")
    count: int = Field(..., description="Number of occurrences")
    percentage: float = Field(..., description="Percentage of total words")


class WordRankingResponse(BaseModel):
    """Schema for word ranking analysis response."""
    total_words: int = Field(..., description="Total number of words analyzed")
    unique_words: int = Field(..., description="Number of unique words")
    top_words: list[WordRankingItem] = Field(..., description="Top ranked words")
