# Feed Metadata Validation Error Analysis

## Error Description

The feed API is failing with the following validation error:

```
2026-01-27 03:14:33,977 INFO sqlalchemy.engine.Engine ROLLBACK
{
  "error": "Unexpected database session error: Failed to retrieve feed items: 1 validation error for FeedItemResponse\nmetadata\n  Input should be a valid dictionary [type=dict_type, input_value=MetaData(), input_type=MetaData]\n    For further information visit https://errors.pydantic.dev/2.5/v/dict_type",
  "path": "/api/feed/",
  "event": "Database error occurred",
  "logger": "app.main",
  "level": "error",
  "timestamp": "2026-01-26T20:14:33.977540Z"
}
```

## Root Cause Analysis

### 1. Field Mapping Mismatch

**SQLAlchemy Model (FeedItem):**

```python
class FeedItem(Base, CreatedAtMixin):
    # ...
    item_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONType, name="metadata"
    )
```

**Pydantic Schema (FeedItemResponse):**

```python
class FeedItemResponse(FeedItemBase, ...):
    # ...
    item_metadata: Optional[Dict[str, Any]] = Field(
        None, alias="metadata", description="Additional metadata"
    )
    # ...
    model_config = ConfigDict(from_attributes=True, ...)
```

### 2. The Problem

When `FeedItemResponse.model_validate(feed_item)` is called with `from_attributes=True`:

1. Pydantic looks for the `metadata` attribute on the SQLAlchemy object (due to the alias)
2. SQLAlchemy objects inherit from `Base`, which has a `metadata` attribute
3. `Base.metadata` is a SQLAlchemy `MetaData()` object, not a dictionary
4. Pydantic tries to validate `MetaData()` as a dictionary and fails

### 3. Evidence

The error message shows:

- `input_value=MetaData()` - This is SQLAlchemy's MetaData object
- `input_type=MetaData` - Confirms it's the SQLAlchemy MetaData class
- Expected: `dict_type` - Pydantic expects a dictionary

### 4. Current Code Location

The validation failure occurs in:

- **File**: `backend/app/api/routes/feed.py`
- **Line**: `return FeedListResponse(items=[FeedItemResponse.model_validate(item) for item in feed_items], pagination=pagination)`
- **Function**: `get_feed()`

## Exact Error Conditions

1. **Trigger**: Any call to `GET /api/feed` endpoint
2. **Failure Point**: `FeedItemResponse.model_validate(item)` where `item` is a SQLAlchemy `FeedItem` object
3. **Field**: The `metadata` field validation
4. **Data Types Involved**:
   - Expected: `Optional[Dict[str, Any]]`
   - Received: `sqlalchemy.MetaData` object

## Impact

- Feed API returns 500 errors
- Users cannot access their feed data
- Frontend feed functionality is completely broken
- Database rollback occurs on every feed request

## Solution Requirements

1. Fix the field mapping between SQLAlchemy `item_metadata` and Pydantic `metadata` alias
2. Ensure Pydantic validation finds the correct attribute
3. Maintain backward compatibility with existing API responses
4. Preserve the alias for JSON serialization (API response should still use "metadata" key)
