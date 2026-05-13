---
STATUS: PLANNING STAGE - DRAFT
LAST UPDATED: 2026-05-12
---

## Overview
This document will specify the core feature of the app: the highly customizable DBT diary card engine. It will detail how data models are structured so that forms can be generated dynamically, allowing patients to track specific emotions, urges, and behaviors. It will also cover the logic for versioning templates (handling diffs if a template changes from one day to the next) and how patients input and edit past daily entries.

## Implementation Details

### 1. Template Schema Definition & Storage
To achieve a highly customizable engine, diary cards are driven by a structured JSON schema defining flexible "widgets" (scales, booleans, text).
- **Storage Location:** `/users/{uid}/templates/{templateId}`. A user can author multiple templates and mark one as `active`.
- **Structure:**
  - `id`: Unique identifier.
  - `name`: E.g., "Standard Adult DBT".
  - `version`: Integer tracking the template version.
  - `sections`: An array defining the card layout (Emotions, Urges, Behaviors, Skills).
  - Each item defines its UI widget. Example: A skill can be configured to use a `boolean` (checked if used) or a `scale` (rating effectiveness 0-5), providing maximum flexibility.

### 2. Form Generation & Schema Versioning
- **Dynamic Rendering:** The frontend iterates through the active template's `sections`, mapping each `type` to a specific React UI component. 
- **Tracking Versions:** When a patient begins an entry, we store the `templateId`, `templateVersion`, and a `schemaSnapshot` in the diary entry itself. 
- **Viewing Past Entries:** 
  - For any given journal entry, the system renders it based on the *ACTIVE* schema. 
  - The *only* exception is if the entry was created with a legacy schema version. In that case, the UI relies on the `schemaSnapshot` embedded in the document to render accurately.

### 3. Handling Schema Changes in Clinician View
When a clinician views a week of data, the schema may have changed mid-week (e.g., a new emotion was added on Wednesday).
- **Union Rendering:** The clinician dashboard will perform a "union" of all tracking fields present in the selected date range. 
- **Null Handling:** If "Anxiety" was added on Wednesday, the data grid for Monday and Tuesday will simply display as null/empty, ensuring a unified, continuous table view.

### 4. Diary Entry Data Model & Dates
- **Location:** `/users/{patientId}/diaryCards/{logicalDate}`
- **Logical Date IDs:** The document ID is a logical local date string (e.g., `"2026-05-12"`). This ensures "Monday" is treated as Monday for the patient, regardless of if they are logging at 12:30 AM Tuesday.
- **Date Editing:** Patients can actively edit the date of an entry (e.g., moving an accidentally saved Tuesday entry back to Monday). This will migrate the payload to the appropriate logical date document.
- **Payload Structure:**
  ```json
  {
    "logicalDate": "2026-05-12",
    "templateId": "tmpl_123",
    "templateVersion": 2,
    "schemaSnapshot": { /* Copied at creation */ },
    "responses": { "sadness": 4, "wise_mind": true },
    "status": "draft", 
    "lastModified": "timestamp"
  }
  ```

### 5. Paginating Drafts & Submission
- **Draft Saves:** The diary card form is paginated. As the patient clicks through pages (Next/Back), the document is automatically saved to Firestore with a `status: "draft"`.
- **Finalizing:** On the final page, clicking "Complete" transitions the status to `"submitted"`. 
- **Unlimited Edits:** There is no "locking" mechanism. Patients can edit historical entries infinitely. The clinician dashboard easily queries the last 7 days of entries (excluding the current day).

---
*STATUS: Scoped and Initial Questions Resolved*
