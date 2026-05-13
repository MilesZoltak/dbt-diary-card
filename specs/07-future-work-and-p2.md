---
STATUS: PLANNING STAGE - DRAFT
LAST UPDATED: 2026-05-12
---

## Overview
This document serves as the repository for Phase 2 (P2) features and future enhancements. These are features that have been discussed and scoped out of the initial MVP to ensure a focused, rapid initial release.

## Future Work & Phase 2 Features

### 1. Advanced Security & Authentication
- **Patient Multi-Factor Authentication (MFA):** While clinicians will have strict access controls, enforcing MFA for patients is currently a P2 item, especially since Google SSO handles substantial security out-of-the-box.

### 2. Patient Autonomy & Template Editing
- **Patient-Owned Templates:** Currently, clinicians dictate templates. A future feature will allow clinicians to grant elevated privileges to specific patients, allowing the patient to co-create or edit their own diary card templates as they progress in treatment and gain autonomy.

### 3. Advanced Clinician Dashboard Features
- **Longitudinal Charting:** Line charts and visual graphs mapping specific variables (e.g., "Anxiety vs. Mindfulness skill usage") over 30, 60, or 90 days.
- **Proactive Alerts & Triage:** A system to proactively flag or send an alert/email to the clinician if a patient logs a critical safety issue (like a high self-harm urge). Currently, review is strictly synchronous.
- **Session Notes/Annotations:** The ability for clinicians to write private session notes directly onto a patient's historical diary card entries within the app. Currently, clinicians will rely on their external EHR for notes.

### 4. Patient Experience & Auto-Logging
- **Diary Card Auto-Logging:** If a patient utilizes the interactive Skill Wizard to practice a specific skill (e.g., TIPP) during the day, the system could automatically check off that skill on their active diary card. This is punted to P2 because it requires complex checks against the patient's active schema to ensure the practiced skill is actually tracked on their current card.

### 5. Telehealth & Secure Messaging
- **In-App Messaging:** Secure, HIPAA-compliant chat between the patient and clinician.
- **Voice/Video Calls:** Direct telehealth integration for remote sessions.

### 6. Reminders & Notifications
- **Push Notifications:** As the MVP is a web application, native push notifications are complex. Phase 2 will introduce PWA (Progressive Web App) service workers or native mobile apps to handle reliable, scheduled push notifications reminding patients to log their diary cards or practice skills.
