import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';

// Layouts
import { PrincipalLayout } from './layouts/PrincipalLayout';
import { TeacherLayout } from './layouts/TeacherLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/principal/Dashboard';
import { LiveTimetable } from './pages/principal/LiveTimetable';
import { WeeklyTimetable } from './pages/principal/WeeklyTimetable';
import { TimetablePage } from './pages/principal/TimetablePage';
import { SubstitutionCenter } from './pages/principal/SubstitutionCenter';
import { AbsencePage } from './pages/principal/AbsencePage';
import { TeachersPage } from './pages/principal/TeachersPage';
import { ClassesPage } from './pages/principal/ClassesPage';
import { SubjectsPage } from './pages/principal/SubjectsPage';
import { ReportsPage } from './pages/principal/ReportsPage';
import { SettingsPage } from './pages/principal/SettingsPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherTimetable } from './pages/teacher/TeacherTimetable';
import { TeacherSubstitutions } from './pages/teacher/TeacherSubstitutions';
import { TeacherNotifications } from './pages/teacher/TeacherNotifications';

// Attendance Pages
import { ClassAttendance } from './pages/principal/ClassAttendance';
import { CategoryReport } from './pages/principal/CategoryReport';
import { AttendanceReports } from './pages/principal/AttendanceReports';
import { MarkAttendance } from './pages/teacher/MarkAttendance';
import { AttendanceHistory } from './pages/teacher/AttendanceHistory';
import { TeacherCategoryStrength } from './pages/teacher/TeacherCategoryStrength';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LanguageProvider>
            <Router>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Principal Routes */}
              <Route path="/principal" element={<PrincipalLayout />}>
                <Route index element={<Navigate to="/principal/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Timetable subroutes */}
                <Route path="timetable" element={<TimetablePage />} />
                <Route path="timetable/today" element={<Dashboard />} />
                <Route path="timetable/class" element={<Dashboard />} />
                <Route path="timetable/period" element={<Dashboard />} />
                <Route path="timetable/teacher" element={<Dashboard />} />
                <Route path="timetable/weekly" element={<WeeklyTimetable />} />
                <Route path="timetable/live" element={<LiveTimetable />} />

                {/* Attendance subroutes */}
                <Route path="attendance" element={<ClassAttendance />} />
                <Route path="attendance/category-report" element={<CategoryReport />} />
                <Route path="attendance/reports" element={<AttendanceReports />} />

                {/* Management Routes */}
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="classes" element={<ClassesPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                
                {/* Absence & Substitution Routes */}
                <Route path="absences" element={<AbsencePage />} />
                <Route path="substitutions" element={<SubstitutionCenter />} />

                {/* Reports & Settings */}
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Teacher Routes */}
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="timetable" element={<TeacherTimetable />} />
                <Route path="substitutions" element={<TeacherSubstitutions />} />
                
                {/* Attendance subroutes */}
                <Route path="attendance/mark" element={<MarkAttendance />} />
                <Route path="attendance/history" element={<AttendanceHistory />} />
                <Route path="category-strength" element={<TeacherCategoryStrength />} />

                <Route path="notifications" element={<TeacherNotifications />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </LanguageProvider>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
