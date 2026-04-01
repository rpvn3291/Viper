# Upgrading to a Multi-User System

This plan outlines the architectural changes required to transform the AI-Powered Personalized Task Scheduler from a single-user prototype into a production-ready, multi-user application using **React** and **Firebase**. 

We will focus purely on the backend structure, data partition, and application flow, ignoring the UI implementation as requested.

## User Review Required

> [!WARNING]
> Because we are introducing multiple users, we need to restructure the Firestore database completely. This means any existing data might be lost or will need a manual migration script. Also, API keys for the AI engine must no longer be exposed on the frontend.

## Proposed Changes

### 1. Authentication (Firebase Auth)
To support multiple users, we must identify each person uniquely.
*   **Setup:** Enable Firebase Authentication (Email/Password & Google Sign-In are recommended).
*   **React Context:** Create an `AuthContext` in React to listen to `onAuthStateChanged`. This will provide the current user's `uid` to the rest of the application.
*   **Protected Routes:** Implement routing (e.g., via React Router) to ensure that only authenticated users can access the dashboard, questionnaire, and tasks. Unauthenticated users should be redirected to a Login/Signup page.

### 2. Database Redesign (Firestore)
Currently, data entities like `userProfile`, `tasks`, and `history` seem to be flat or stored locally. We need to nest all user-specific data under their unique Firebase `uid`.

**New Hierarchical Structure:**
*   `users/{userId}/profile/config`
    *   Stores `startTime`, `peakTime`, `preference`, `availableHours`, `blockedTime`.
*   `users/{userId}/tasks/{taskId}`
    *   Stores individual tasks (`task`, `priority`, `createdAt`, `status`).
*   `users/{userId}/schedule/{date}`
    *   Stores the AI-generated schedule for a specific day.
*   `users/{userId}/history/{historyId}`
    *   Stores past performance (`task`, `status`, `date`).

*By nesting data under `users/{userId}`, queries automatically scale and naturally isolate one user's data from another.*

### 3. Application Flow Updates
The introduction of users changes the onboarding flow:
1.  **Authentication:** User Signs Up / Logs In.
2.  **State Check:** App queries `users/{uid}/profile/config`.
3.  **Onboarding Routing:**
    *   *If no profile exists:* Route user to the **Questionnaire**.
    *   *If profile exists:* Route user to the **Main Dashboard**.
4.  **AI Invocation:** When generating a schedule, the app fetches *only* the current user's active tasks, profile config, and history to send to the AI engine.

### 4. Security
*   **Hackathon Mode:** We will skip complex Firebase Security Rules for speed. We will just ensure the basic structure works locally.

### 5. UI Requirements (New)
*   **Calendar View:** A full daily/weekly time blocked calendar view (similar to Google Calendar) for the desktop web view.
*   It will have a timeline (e.g. 1 AM - 11 PM) on the left and vertical columns for days.
*   Scheduled tasks will be rendered as blocks spanning their allocated time duration.
*   A "Recalculate" or "Generate Schedule" button will be prominent, as per your reference app.

## Decisions Made
1. **Authentication:** Google Sign-In. A separate dashboard/document architecture will be created individually for every user.
2. **AI Execution:** Run AI integration entirely client-side. The API Key will be exposed in the frontend environment but since it's running exclusively on localhost, this is not an issue.
3. **Data:** We will start entirely fresh with the new Multi-User Database Structure outlined below.
4. **Security:** No Firebase rules needed; keeping it simple for the hackathon.
5. **UI:** Implementing a desktop-friendly calendar grid view with a time axis to visualize the AI schedule.

## Verification Plan

### Automated Tests
*   **Firebase Emulators:** Run the Firestore emulator with the new Security Rules to verify that `User A` cannot read or write `User B`'s tasks.

### Manual Verification
*   **Auth Flow:** Register two separate accounts.
*   **Data Isolation:** Add a task in Account A. Log out, log into Account B, and verify the task does not appear. Verify the AI generates differing schedules based on their separate profiles.
