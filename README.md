# EduTime — School Smart Timetable & Substitute Management System

A production-grade, full-stack **MERN** web application engineered for school principals and faculty. Built with React.js, Vite, Tailwind CSS, Node.js, Express.js, and MongoDB.

---

## 🚀 Key Features

1. **Master Timetable Scheduling & Matrix Visualizations**:
   - **Class View**: Comprehensive matrix of grade divisions against 8 daily class periods.
   - **Period View**: Instant school-wide classroom inspection during any period slot.
   - **Teacher View**: Individual faculty schedules with highlighted **FREE periods** for substitution availability.
   - **Weekly Timetable**: 5-day academic grid filterable by Class or Teacher.
   - **Live School Timetable (`/principal/timetable/live`)**: Real-time on-air period tracker, live clock, and current classroom statuses.

2. **Absence & Coverage Management**:
   - Multi-step **Mark Teacher Absent** workflow with period selection chips (`[P1]` through `[P8]`).
   - Instant calculation of affected timetable periods and automatic generation of substitution coverage tickets.

3. **Smart Multi-Criteria Substitute Matching Algorithm**:
   - **Conflict Elimination**: Strict filtering out of teachers with existing scheduled lectures, overlapping substitutions, or active leaves during that period.
   - **Transparent Weighted Scoring**:
     - *Free during Period*: `+50 pts`
     - *Subject Specialization Match*: `+30 pts`
     - *Grade / Class Familiarity*: `+10 pts`
     - *Balanced Daily Workload*: `+10 pts` (≤ 3 periods today) / `-20 pts` (≥ 6 periods today)
   - Detailed reason breakdown pills (`✓ Free during Period 1`, `✓ Specialist in Mathematics`, `✓ Low workload today`).
   - `⭐ BEST MATCH` top candidate badge and one-click atomic assignment.

4. **Double-Booking & Conflict Prevention**:
   - Enforced at both Frontend and Backend database query levels.
   - Prevents classroom collisions, teacher overlaps, and substitute double assignments.

5. **Role-Based Portals (Principal & Teacher)**:
   - **Principal Portal**: Full school control, KPI cards, timetable builder, absence logging, substitution delegation, Recharts workload reports.
   - **Teacher Portal**: "Next Upcoming Lecture" countdown card, daily timeline, assigned substitution alerts with "Mark Completed" button, and notification feed.

6. **Design & Aesthetics**:
   - Styled with Tailwind CSS in an elegant Deep Indigo & Slate palette.
   - Dark Mode support with persistence (`localStorage`).
   - Mobile and tablet responsive navigation (collapsible sidebar and drawer overlay).

---

## 📁 Project Structure

```text
Teacher-timetable/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # StatCard
│   │   │   ├── layout/             # Sidebar, TopNavbar
│   │   │   ├── substitutions/      # AbsenceDrawer, CandidateCard, ConfirmAssignModal
│   │   │   ├── timetable/          # ClassView, PeriodView, TeacherView, TimetableCell, TimetableBuilderModal
│   │   │   └── ui/                 # Button, Card, Badge, Modal, Drawer, SearchInput, Skeleton, EmptyState, ConfirmDialog
│   │   ├── constants/              # Period timings (P1-P8), Days of week, Roles
│   │   ├── context/                # AuthContext, ThemeContext, ToastContext
│   │   ├── layouts/                # PrincipalLayout, TeacherLayout
│   │   ├── pages/
│   │   │   ├── principal/          # Dashboard, LiveTimetable, WeeklyTimetable, TimetablePage, SubstitutionCenter, AbsencePage, TeachersPage, ClassesPage, SubjectsPage, ReportsPage, SettingsPage
│   │   │   ├── teacher/            # TeacherDashboard, TeacherTimetable, TeacherSubstitutions, TeacherNotifications
│   │   │   └── LoginPage.jsx
│   │   ├── services/api.js         # Axios client with JWT interceptors
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── backend/
│   ├── config/db.js                # MongoDB connection
│   ├── controllers/                # auth, teacher, class, subject, timetable, absence, substitution, report, notification
│   ├── middleware/                 # protect, authorize, errorHandler
│   ├── models/                     # User, Teacher, Class, Subject, Timetable, TeacherAbsence, Substitution, Notification
│   ├── routes/                     # Express REST endpoints
│   ├── services/
│   │   ├── conflictService.js      # Timetable and substitution conflict validators
│   │   └── substituteService.js    # Automatic multi-criteria ranking algorithm
│   ├── seed/seed.js                # Rich seed script with 1 Principal, 15 Teachers, 8 Classes, 10 Subjects, 320 Timetables
│   ├── server.js                   # Express server entry point
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017`

### 2. Backend Setup
```bash
cd backend
npm install
node seed/seed.js   # Populates database with teachers, classes, subjects, timetables
npm start          # Runs Express API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Launches Vite development server on http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Details |
|---|---|---|---|
| **Principal** | `admin@school.com` | `Admin@123` | Full admin authority, timetable scheduling, substitute assignment |
| **Teacher (Mr. More)** | `more@school.com` | `Teacher@123` | Science & Math faculty; assigned substitute duties |
| **Teacher (Mr. Patil)** | `patil@school.com` | `Teacher@123` | Mathematics faculty; marked absent for demo |
| **Teacher (Mrs. Joshi)** | `joshi@school.com` | `Teacher@123` | English & Marathi faculty |

*(The login page includes one-click profile cards for frictionless instant login).*

---

## 🔌 API Overview

### Authentication
- `POST /api/auth/login`: Authenticate user and issue JWT
- `GET /api/auth/me`: Retrieve current profile & role details

### Timetable
- `GET /api/timetable`: Query entries by day, class, teacher, period
- `GET /api/timetable/today`: Returns today's master timetable overlaid with active absences and substitutions
- `GET /api/timetable/live`: Returns live status across all classrooms for current period
- `GET /api/timetable/weekly`: Returns 5-day grid by class or teacher
- `POST /api/timetable`: Create slot with pre-save double-booking prevention

### Absences & Substitutions
- `GET /api/absences`: List teacher absences
- `POST /api/absences`: Mark teacher absent, automatically queuing required substitution slots
- `DELETE /api/absences/:id`: Cancel absence and clean up pending substitution requests
- `GET /api/substitutions`: List substitutions with status and date filters
- `GET /api/substitutions/candidates`: Evaluate and rank available substitute candidates
- `POST /api/substitutions/assign`: Atomically assign substitute and notify teacher

### Reports & Analytics
- `GET /api/reports/kpis`: Total teachers, classes, absent today, pending subs, assigned subs, free teachers
- `GET /api/reports/analytics`: Workload distribution, absence frequency, substitution status breakdown

---

## 🧠 Substitute Recommendation Algorithm

The recommendation engine in `backend/services/substituteService.js` follows a 5-stage pipeline:

1. **Cohort Gathering**: Retrieves all active faculty members excluding the absent teacher.
2. **Conflict Filtering**:
   - Excludes teachers marked absent on the target date covering the period.
   - Excludes teachers with scheduled lectures during this period on this weekday.
   - Excludes teachers already committed to another substitution assignment during this period.
3. **Multi-Factor Scoring**:
   - **Base Availability**: `+50` points.
   - **Subject Competence**: `+30` points if faculty teaches the target subject.
   - **Class / Grade Experience**: `+10` points if faculty teaches this class or grade level.
   - **Workload Balancing**: `+10` points if teacher has $\le 3$ periods today; `-20` points if teacher has $\ge 6$ periods today.
4. **Transparent Tagging**: Generates explanatory reason statements explaining to the principal *why* the teacher is ranked at this level.
5. **Ranking**: Candidates are sorted descending by score, with the top candidate awarded the `⭐ Best Match` recommendation.
