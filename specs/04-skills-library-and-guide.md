---
STATUS: PLANNING STAGE - DRAFT
LAST UPDATED: 2026-05-12
---

## Overview
This document will outline the patient-facing DBT skills reference library. It will detail the data structure for storing modules (Mindfulness, Distress Tolerance, etc.) and the logic for an interactive, wizard-like flowchart that guides a patient to the appropriate skill based on their current state, including links to practice exercises.

## Implementation Details

### 1. The Skills Data Architecture
The skills library will be a repository of standard DBT skills, categorized by the four core modules. Since this content is static and universally applicable, it will be bundled directly into the frontend codebase as a static JSON file. This completely eliminates database read costs and reduces complexity.
- **Data Structure (Local JSON):**
  ```json
  {
    "id": "tipp",
    "module": "Distress Tolerance",
    "name": "TIPP",
    "acronymMeaning": "Temperature, Intense Exercise, Paced Breathing, Paired Muscle Relaxation",
    "description": "Used to quickly change your body chemistry when emotional arousal is very high.",
    "stepsToPractice": ["Get a bowl of ice water...", "Do jumping jacks..."],
    "whenToUse": "When you are at your breaking point and cannot think clearly."
  }
  ```

### 2. The Reference Library UI
- **Browsable Directory:** A static tab in the patient interface displaying the 4 core modules (Mindfulness, Distress Tolerance, Emotion Regulation, Interpersonal Effectiveness).
- **Detail View:** Clicking a skill opens a clean, readable modal or page displaying the `description`, `acronymMeaning`, and `stepsToPractice`.

### 3. The Interactive Skill Wizard (Crisis Flowchart)
When patients are in high distress, cognitive load is high, and they often cannot remember *which* skill to use. We will implement an interactive "Skill Coach".
- **Decision Tree Logic:** A simple, hardcoded state-machine in the frontend (3-to-4 question depth for the MVP).
  - *Prompt 1:* "Are you in a crisis or experiencing overwhelming urges right now?" 
    - *Yes* -> Branch to Distress Tolerance.
    - *No* -> *Prompt 2:* "What are you trying to accomplish?" (Understand my feelings / Interpersonal / Be present).
  - *Prompt 1.1 (Crisis branch):* "Is your physical arousal very high (heart racing, panic)?"
    - *Yes* -> Suggest **TIPP**.
    - *No* -> Suggest **STOP** or **ACCEPTS**.
- **The Output:** The wizard lands on a specific skill page and provides a prominent "Review & Practice" view.

---
*STATUS: Scoped and Initial Questions Resolved. Diary Card Auto-Logging moved to Phase 2 (see Spec 07).*
