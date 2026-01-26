# Task 08: Upload & Export

## Overview
Implement CSV upload for new cases and export functionality for filtered case data.

## Priority
**8** (Data management features)

## Dependencies
- Task 01: Project Setup (database)
- Task 02: Cases Module (case list)
- Task 03: Alerts Module (alert recomputation)
- Task 04: Live Feed (upload cards)

## Functional Requirements Covered
- **FR46**: Upload case data via CSV file
- **FR47**: After upload, create "New batch uploaded" feed item
- **FR48**: After upload, recompute alerts and trending (simulated async)
- **FR49**: Upload errors include: row number, column, reason, suggested fix
- **FR50**: Export filtered cases to CSV and XLSX formats

## Tasks

### 8.1 Create Upload Page
- [x] Create `/uploads` route
- [x] Build file upload interface
- [x] Add drag-and-drop zone
- [x] Show upload history list
- [x] Display upload instructions

### 8.2 Build CSV Upload Component
- [x] Create FileUpload component
- [x] Accept CSV files only
- [x] Show file preview (first 5 rows)
- [x] Display detected columns
- [x] Add "Upload" and "Cancel" buttons

### 8.3 Implement CSV Parser
- [x] Create `lib/csvParser.ts`
- [x] Parse CSV with header detection
- [x] Map columns to case fields:
  - caseNumber (required)
  - createdAt (required)
  - bu (required)
  - channel (required)
  - category
  - severity
  - summary
  - description
- [x] Validate data types
- [x] Handle encoding issues (UTF-8)

### 8.4 Build Validation Engine
- [x] Validate required fields present
- [x] Validate field formats:
  - Date format validation
  - Enum values (BU, channel, severity)
  - String length limits
- [x] Collect all errors (don't stop at first)
- [x] Generate error report

### 8.5 Create Error Display
- [x] Create UploadErrors component
- [x] Display errors in table format:
  - Row number
  - Column name
  - Error reason
  - Suggested fix
- [x] Highlight errors by severity
- [x] Allow downloading error report

### 8.6 Implement Upload Processing
- [x] Create upload API endpoint
- [x] Insert valid rows to database
- [x] Track upload batch (batch ID, timestamp, count)
- [x] Return success/error summary

### 8.7 Create Feed Item on Upload
- [x] After successful upload, create feed item:
  - Type: "upload"
  - Title: "New batch uploaded"
  - Content: "X new cases added"
  - Metadata: batch ID, file name, count
- [x] Feed item links to uploaded cases

### 8.8 Trigger Recomputation
- [x] After upload, queue alert recomputation
- [x] After upload, queue trending recomputation
- [x] Show "Processing..." status
- [x] Update status when complete
- [x] (Simulated async for prototype)

### 8.9 Implement Export Functionality
- [x] Add Export button to cases list
- [x] Create ExportModal component
- [x] Allow format selection: CSV, XLSX
- [x] Include current filters in export
- [x] Generate file with proper headers
- [x] Trigger browser download

### 8.10 Build Export Service
- [x] Create `lib/export.ts`
- [x] Implement CSV generation
- [x] Implement XLSX generation (using xlsx library)
- [x] Apply filters to export query
- [x] Limit export size (e.g., 10k rows max)

### 8.11 Create API Routes
- [x] `POST /api/upload` - Upload CSV file
- [x] `GET /api/uploads` - List upload history
- [x] `GET /api/uploads/[id]` - Get upload details
- [x] `GET /api/export` - Export filtered cases
- [x] `GET /api/upload/template` - Download CSV template

### 8.12 Create CSV Template
- [x] Generate template CSV with headers
- [x] Include example rows
- [x] Add instructions row (commented)
- [x] Provide download link on upload page

## Acceptance Criteria
- [x] CSV upload accepts valid files
- [x] Invalid rows show detailed errors
- [x] Error report includes row, column, reason, fix
- [x] Successful upload creates feed item
- [x] Alerts/trending recompute after upload
- [x] Export produces valid CSV file
- [x] Export produces valid XLSX file
- [x] Export respects current filters

## Estimated Complexity
Medium

## Files to Create
```
app/
  uploads/
    page.tsx
components/
  upload/
    FileUpload.tsx
    UploadPreview.tsx
    UploadErrors.tsx
    UploadHistory.tsx
  export/
    ExportModal.tsx
lib/
  csvParser.ts
  export.ts
  upload.ts
app/api/
  upload/
    route.ts
    template/
      route.ts
  uploads/
    route.ts
    [id]/
      route.ts
  export/
    route.ts
```
