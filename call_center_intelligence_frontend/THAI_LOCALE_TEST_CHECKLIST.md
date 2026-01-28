# Thai Locale Implementation - Manual Test Checklist

## Prerequisites
1. Start the dev server: `npm run dev`
2. Open browser to `http://localhost:3000`

---

## Test 1: Language Switcher
**Location:** Top navigation bar (all pages)

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 1.1 | Go to `/en/home` | Page loads in English | |
| 1.2 | Find language switcher (EN/TH button) | Switcher is visible | |
| 1.3 | Click to switch to Thai | URL changes to `/th/home` | |
| 1.4 | Verify navigation menu | Menu items in Thai (หน้าหลัก, การแจ้งเตือน, เคส, etc.) | |
| 1.5 | Click to switch back to English | URL changes to `/en/home`, menu in English | |

---

## Test 2: Home Page - Pulse Sidebar
**Location:** `/th/home` → Right sidebar

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 2.1 | Go to `/th/home` | Page loads | |
| 2.2 | Look at "What's happening" section | Topic counts show Thai number format | |
| 2.3 | Check "Teams to watch" section | Case counts formatted in Thai locale | |
| 2.4 | Compare with `/en/home` | English shows "1,234" format | |

---

## Test 3: Cases List Page
**Location:** `/th/cases`

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 3.1 | Go to `/th/cases` | Cases list loads | |
| 3.2 | Check "Date" column | Dates show Thai format: `22 ม.ค. 2569` | |
| 3.3 | Check mobile card view (resize browser) | Date shows Thai format | |
| 3.4 | Compare with `/en/cases` | Dates show English: `Jan 22, 2026` | |

**Thai month abbreviations to look for:**
- ม.ค. (January)
- ก.พ. (February)
- มี.ค. (March)
- เม.ย. (April)
- พ.ค. (May)
- มิ.ย. (June)
- ก.ค. (July)
- ส.ค. (August)
- ก.ย. (September)
- ต.ค. (October)
- พ.ย. (November)
- ธ.ค. (December)

---

## Test 4: Case Detail Page
**Location:** `/th/cases/{case-id}` (click any case)

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 4.1 | Click on any case from list | Detail page loads | |
| 4.2 | Check "Created" field | Shows Thai date format: `22 ม.ค. 2569, 16:02` | |
| 4.3 | Check Timeline section | All timestamps in Thai format | |
| 4.4 | Labels should be Thai | "สร้างเมื่อ", "ไทม์ไลน์", etc. | |

---

## Test 5: Case Timeline
**Location:** `/th/cases/{case-id}` → Timeline section

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 5.1 | Look at timeline events | Each event shows Thai datetime | |
| 5.2 | Format should be | `22 ม.ค. 2569, 14:30` | |

---

## Test 6: Alerts List Page
**Location:** `/th/alerts`

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 6.1 | Go to `/th/alerts` | Alerts list loads | |
| 6.2 | Check alert cards | Dates/times in Thai format | |
| 6.3 | Check relative times | "2 ชั่วโมงที่แล้ว" or fallback to Thai date | |

---

## Test 7: Alert Detail Page
**Location:** `/th/alerts/{alert-id}` (click any alert)

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 7.1 | Click on any alert | Detail page loads | |
| 7.2 | Check "Created" field | Thai date format | |
| 7.3 | Check "Contributing Cases" table | Created dates in Thai format | |
| 7.4 | Relative times column | Shows Thai format or relative time | |

---

## Test 8: Uploads Page
**Location:** `/th/uploads`

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 8.1 | Go to `/th/uploads` | Page loads | |
| 8.2 | Check upload history (if any) | Dates in Thai format: `22 ม.ค. 2569, 14:30` | |
| 8.3 | If no uploads, upload a test CSV | New upload shows Thai date | |

---

## Test 9: Inbox Page
**Location:** `/th/inbox`

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 9.1 | Go to `/th/inbox` | Page loads | |
| 9.2 | Check shared/escalated items | Timestamps in Thai format | |
| 9.3 | Relative times | "5 นาทีที่แล้ว" or Thai date | |

---

## Test 10: Trending Page
**Location:** `/th/trending`

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 10.1 | Go to `/th/trending` | Page loads | |
| 10.2 | Check trend charts | X-axis month labels in Thai (ม.ค., ก.พ.) | |
| 10.3 | Check date labels | Format: `ม.ค. 22` | |

---

## Test 11: Chat Assistant
**Location:** `/th/home` → Chat button (bottom right)

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 11.1 | Open chat drawer | Chat opens | |
| 11.2 | Send a message | Message appears | |
| 11.3 | Check message timestamp | Time in Thai format: `14:30` or `บ่าย 2:30` | |
| 11.4 | Check assistant response | Response timestamp in Thai | |

---

## Test 12: Export Modal
**Location:** `/th/cases` → Export button

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 12.1 | Go to `/th/cases` | Page loads | |
| 12.2 | Click "Export" button | Modal opens | |
| 12.3 | Check case count display | Number formatted: `2,139` (Thai uses same format) | |
| 12.4 | Check "limited to X rows" text | Number properly formatted | |

---

## Test 13: Real-time Relative Times
**Location:** `/th/home` → Feed cards

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 13.1 | Go to `/th/home` | Page loads | |
| 13.2 | Check "Updated X ago" text | Shows relative time | |
| 13.3 | Wait 10 seconds | Time updates automatically | |
| 13.4 | Old items (>7 days) | Show Thai date format | |

---

## Test 14: Search Page
**Location:** `/th/search?q=billing`

| Step | Action | Expected Result | ✅/❌ |
|------|--------|-----------------|-------|
| 14.1 | Search for something | Results appear | |
| 14.2 | Check result dates | Thai date format | |

---

## Summary

| Section | Tests | Passed | Failed |
|---------|-------|--------|--------|
| Language Switcher | 5 | | |
| Home/Pulse Sidebar | 4 | | |
| Cases List | 4 | | |
| Case Detail | 4 | | |
| Case Timeline | 2 | | |
| Alerts List | 3 | | |
| Alert Detail | 4 | | |
| Uploads | 3 | | |
| Inbox | 3 | | |
| Trending | 3 | | |
| Chat | 4 | | |
| Export Modal | 4 | | |
| Relative Times | 4 | | |
| Search | 2 | | |
| **TOTAL** | **49** | | |

---

## Notes

**Date Format Reference:**
- English: `Jan 22, 2026, 2:30 PM`
- Thai: `22 ม.ค. 2569, 14:30`

**Thai Buddhist Year:**
- Thai calendar is 543 years ahead
- 2026 CE = 2569 BE (พ.ศ.)

**If a test fails:**
1. Note the component and expected vs actual
2. Check browser console for errors
3. Verify the page URL has `/th/` prefix
