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
- [ ] Create `/uploads` route
- [ ] Build file upload interface
- [ ] Add drag-and-drop zone
- [ ] Show upload history list
- [ ] Display upload instructions

### 8.2 Build CSV Upload Component
- [ ] Create FileUpload component
- [ ] Accept CSV files only
- [ ] Show file preview (first 5 rows)
- [ ] Display detected columns
- [ ] Add "Upload" and "Cancel" buttons

### 8.3 Implement CSV Parser
- [ ] Create `lib/csvParser.ts`
- [ ] Parse CSV with header detection
- [ ] Map columns to case fields:
  - caseNumber (required)
  - createdAt (required)
  - bu (required)
  - channel (required)
  - category
  - severity
  - summary
  - description
- [ ] Validate data types
- [ ] Handle encoding issues (UTF-8)

### 8.4 Build Validation Engine
- [ ] Validate required fields present
- [ ] Validate field formats:
  - Date format validation
  - Enum values (BU, channel, severity)
  - String length limits
- [ ] Collect all errors (don't stop at first)
- [ ] Generate error report

### 8.5 Create Error Display
- [ ] Create UploadErrors component
- [ ] Display errors in table format:
  - Row number
  - Column name
  - Error reason
  - Suggested fix
- [ ] Highlight errors by severity
- [ ] Allow downloading error report

### 8.6 Implement Upload Processing
- [ ] Create upload API endpoint
- [ ] Insert valid rows to database
- [ ] Track upload batch (batch ID, timestamp, count)
- [ ] Return success/error summary

### 8.7 Create Feed Item on Upload
- [ ] After successful upload, create feed item:
  - Type: "upload"
  - Title: "New batch uploaded"
  - Content: "X new cases added"
  - Metadata: batch ID, file name, count
- [ ] Feed item links to uploaded cases

### 8.8 Trigger Recomputation
- [ ] After upload, queue alert recomputation
- [ ] After upload, queue trending recomputation
- [ ] Show "Processing..." status
- [ ] Update status when complete
- [ ] (Simulated async for prototype)

### 8.9 Implement Export Functionality
- [ ] Add Export button to cases list
- [ ] Create ExportModal component
- [ ] Allow format selection: CSV, XLSX
- [ ] Include current filters in export
- [ ] Generate file with proper headers
- [ ] Trigger browser download

### 8.10 Build Export Service
- [ ] Create `lib/export.ts`
- [ ] Implement CSV generation
- [ ] Implement XLSX generation (using xlsx library)
- [ ] Apply filters to export query
- [ ] Limit export size (e.g., 10k rows max)

### 8.11 Create API Routes
- [ ] `POST /api/upload` - Upload CSV file
- [ ] `GET /api/uploads` - List upload history
- [ ] `GET /api/uploads/[id]` - Get upload details
- [ ] `GET /api/export` - Export filtered cases
- [ ] `POST /api/upload/template` - Download CSV template

### 8.12 Create CSV Template
- [ ] Generate template CSV with headers
- [ ] Include example rows
- [ ] Add instructions row (commented)
- [ ] Provide download link on upload page

## Acceptance Criteria
- [ ] CSV upload accepts valid files
- [ ] Invalid rows show detailed errors
- [ ] Error report includes row, column, reason, fix
- [ ] Successful upload creates feed item
- [ ] Alerts/trending recompute after upload
- [ ] Export produces valid CSV file
- [ ] Export produces valid XLSX file
- [ ] Export respects current filters

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
