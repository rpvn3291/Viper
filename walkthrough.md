
Project setup
0:00 – 0:15
⚡
Scaffold with Vite
Run npm create vite@latest → select React + JavaScript. Then npm install and npm run dev to confirm it boots.
📦
Install dependencies
npm i firebase @google/generative-ai tailwindcss — then run npx tailwindcss init and wire up tailwind.config.js + index.css.
🔑
Create .env file
Add VITE_GEMINI_KEY, VITE_FIREBASE_API_KEY, and other Firebase config vars. Never commit this file.
02
Firebase + Firestore setup
0:15 – 0:30
🔥
Create Firebase project
Go to console.firebase.google.com → New project → enable Firestore in test mode → copy the config object.
🗄️
Write src/firebase.js
Initialize app with initializeApp(config), export db = getFirestore(). Create 3 collections: userProfile, tasks, history.
📝
Write src/db.js — CRUD helpers
Wrap addDoc, getDocs, updateDoc, deleteDoc for tasks + history. Keep it simple — no auth for MVP.
03
Gemini AI integration
0:30 – 0:50
🤖
Write src/ai.js
Init GoogleGenerativeAI with your key. Export a single generateSchedule(tasks, profile, history) function that returns parsed JSON.
📋
Build the prompt
Send user profile (peak time, blocked hours, preference) + task list + last 20 history entries. Instruct Gemini to return a JSON array with task, priority, start, end, duration, reason.
🧪
Test in isolation
Console-log the raw Gemini response first. Strip any markdown fences with .replace(/```json|```/g, "") then JSON.parse().
04
UI — 3 screens
On app load, check Firestore for existing profile with getDoc(doc(db, "userProfile", "main")). Skip onboarding if found — jump straight to task input.
06
Polish + deploy
1:50 – 2:00
🚀
Deploy to Firebase Hosting
Run npm run build → firebase init hosting → set public dir to dist → firebase deploy. Live URL in under 2 minutes.
✅
MVP checklist
Profile saved → tasks added → AI schedule generated → tasks marked done/missed → history stored → next schedule uses history. That's the full loop.

---

## 07. Multi-User Workflow Implementation

   - Cloned the `Questionnaire` component into a self-contained `<SettingsPage />` which hydrates itself from `db -> profile -> config`.
   - Users can now alter foundational workflow assumptions (like switching "Hard First" to "Easy First") to continuously fine-tune AI generations.
