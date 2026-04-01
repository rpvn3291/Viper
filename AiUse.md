🔥 Where AI is Used
1️⃣ Task Understanding & Prioritization

AI analyzes:

Task descriptions
User preferences (from questionnaire)
User history (completed vs missed tasks)
Output:
Priority → high / medium / low
Estimated duration (in hours)

👉 This replaces hardcoded logic with context-aware decision making

2️⃣ Personalization

AI uses user profile data:

Peak productivity time
Work preference (hard-first / easy-first)
Available hours

👉 Example:

If user is morning-focused → AI prioritizes hard tasks early
If user prefers easy-first → AI adjusts ordering
3️⃣ Behavior-Based Adaptation

AI learns from past performance:

Tasks frequently missed → lower priority
Tasks consistently completed → higher priority

👉 This makes the system adaptive over time

4️⃣ Constraint Awareness

AI considers real-world constraints:

Blocked time (work / college hours)

👉 Ensures:

No tasks scheduled during unavailable time
More realistic planning
5️⃣ Dynamic Decision Making

Instead of static rules, AI:

Balances urgency + difficulty + user behavior
Produces a structured plan ready for scheduling
🧾 AI Input Structure
{
  "tasks": ["Study DSA", "Gym"],
  "userProfile": {
    "startTime": 9,
    "peakTime": "morning",
    "preference": "hard-first",
    "availableHours": 6
  },
  "history": [
    { "task": "Gym", "status": "missed" },
    { "task": "Study DSA", "status": "completed" }
  ]
}
📤 AI Output Structure
[
  { "task": "Study DSA", "priority": "high", "duration": 2 },
  { "task": "Gym", "priority": "low", "duration": 1 }
]