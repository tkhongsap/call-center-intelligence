# Uploads PRD

## Overview

| Field | Value |
|-------|-------|
| **Route** | `/[locale]/uploads` |
| **Purpose** | Upload case data files, download templates, view upload history with detailed error reporting |
| **User Roles** | PM/PO (Admin) primarily; may be restricted for other roles |
| **Status** | 90% complete |

---

## Requirements from Original PRD

> From `docs/00-call-center-intelligence.md` Section 5.9

### Core Requirements

**Screen:** `/uploads`

### Enhancements (from baseline)
- After successful upload:
  - Create a "New batch uploaded" feed item
  - Recompute alerts/trending (async simulated)
- Provide "Download sample template" button
- Upload errors include:
  - Row number
  - Column
  - Reason
  - Suggested fix

### Supported Formats
- CSV, XLSX, JSON

---

## Implementation Status

| Requirement | Status | Implementation Notes |
|-------------|--------|---------------------|
| File upload (drag-drop) | Done | Drop zone with visual feedback |
| File upload (button) | Done | Standard file picker |
| Supported formats (CSV, XLSX, JSON) | Done | All three formats supported |
| Download sample template | Done | CSV template download |
| Upload history | Done | List of past uploads with status |
| Error reporting - row number | Done | Shown in error details |
| Error reporting - column | Done | Shown in error details |
| Error reporting - reason | Done | Human-readable message |
| Error reporting - suggested fix | Done | Actionable suggestions |
| Feed item after upload | **Partial** | Feed item created, needs verification |
| Alert/trend recomputation | **Partial** | Manual trigger may be needed |

---

## Components & APIs

### Components Used
| Component | Path | Purpose |
|-----------|------|---------|
| UploadZone | `components/uploads/UploadZone.tsx` | Drag-drop upload area |
| UploadHistory | `components/uploads/UploadHistory.tsx` | History list |
| UploadErrorTable | `components/uploads/UploadErrorTable.tsx` | Error details display |
| TemplateDownload | `components/uploads/TemplateDownload.tsx` | Template download button |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/uploads` | POST | Process uploaded file |
| `/api/uploads` | GET | Returns upload history |
| `/api/uploads/template` | GET | Download sample template |

---

## Acceptance Criteria

### Functional
- [x] Drag-drop upload works with visual feedback
- [x] Button upload works via file picker
- [x] Sample template downloads correctly
- [x] Upload history shows past uploads with status
- [x] Errors show row number, column, reason, suggestion
- [x] Successful uploads show in history
- [ ] New feed item appears after successful upload (verify)
- [ ] Alerts/trends update after upload (verify async trigger)

### Performance
- [x] Upload starts processing within 2 seconds
- [x] History loads within 1 second

### Accessibility
- [x] Drop zone is keyboard accessible
- [x] Upload status announced to screen readers
- [x] Error table is navigable

---

## Known Gaps & Recommendations

### Current Gaps

1. **Feed Item Verification Needed**
   - Impact: Users may not see upload notification in feed
   - Recommendation: Verify feed item creation in integration testing

2. **Alert Recomputation Verification Needed**
   - Impact: New data may not trigger new alerts
   - Recommendation: Verify `compute-alerts` is triggered or document manual step

### Future Enhancements

1. **Upload progress indicator**
   - Show percentage for large files
   - Estimated time remaining

2. **Batch upload**
   - Upload multiple files at once
   - Consolidated error report

3. **Upload scheduling**
   - Schedule recurring uploads
   - FTP/SFTP integration placeholder

4. **Rollback capability**
   - Undo recent upload
   - Remove uploaded cases

---

## Related Documents
- [Main PRD](../00-call-center-intelligence.md)
- [Home Feed PRD](./01-home-feed.md) (for feed item integration)
- [Cases PRD](./03-cases.md) (uploaded data appears here)
