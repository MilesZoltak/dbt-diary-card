---
STATUS: PLANNING STAGE - DRAFT
LAST UPDATED: 2026-05-12
---

## Overview
This document will detail the clinician-facing interface. It will cover the workflows for clinicians to build custom diary card templates, send them to specific patients for acceptance, and the dashboard required to view a patient's historical data side-by-side (weekly view) for collaborative review during sessions.

## Implementation Details

### 1. Patient Roster & Onboarding Workflow
- **The Roster View:** Clinicians will have a primary dashboard displaying all patients in their `/users/{uid}/roster/` subcollection. The table will show basic identifiers, the currently assigned template, and a quick "Last Logged" timestamp indicator.
- **Invitation System (Web Flow):** 
  - Clinicians generate a unique invite link (e.g., `app.com/register?invite=XYZ`).
  - When the patient clicks the link and creates an account, the system reads the invite code from the URL and securely binds the patient's ID into the clinician's roster.

### 2. The DBT Template Builder
- **Visual Schema Editor:** A visual builder that compiles down to the JSON schema defined in Spec 02.
- **Clinician Control First:** The base experience places the clinician in full control of building and dictating the template, minimizing cognitive burden on the patient.
- **Template Assignment:** Clinicians select a patient from their roster and assign an active template. The new template becomes active **immediately** upon assignment; the patient does not need to explicitly "accept" it.

### 3. The Weekly Dashboard (The "Session View")
The core requirement for DBT is reviewing the diary card collaboratively during a session.
- **Data Fetching:** Queries `/users/{patientId}/diaryCards` for the most recent 7 days.
- **Union Rendering Matrix:** 
  - The dashboard will render a matrix **respecting the existing layout logic currently implemented in the codebase**.
  - Rows represent specific tracked items, columns represent logical dates.
  - If a schema changed mid-week, the matrix gracefully unions all data points, displaying `null` or a blank cell where a field wasn't present on a specific day.
- **Synchronous Review:** Clinicians are expected to review this data synchronously during a session or when they manually log in. There are no proactive alerts or emails sent to the clinician for high-distress logs.

### 4. Exporting Data
- **Exporting:** Clinicians will need to export data to attach to their formal Electronic Health Records (EHR). The dashboard will feature an "Export PDF" or "Export CSV" function for a selected date range.

---
*STATUS: Scoped and Initial Questions Resolved. Charting, Alerting, and Annotations have been moved to Phase 2 (see Spec 07).*
