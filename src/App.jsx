  import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
  import { AnimatePresence } from 'framer-motion';
  import InstallPrompt from './components/ui/InstallPrompt.jsx';
  import { useAuth } from './context/AuthContext.jsx';
  import { FullScreenLoader } from './components/ui/Spinner.jsx';

  // Student
  import StudentDashboard from './pages/StudentDashboard.jsx';
  import MyResultsPage from './pages/student/MyResultsPage.jsx';
  import ExamRunnerPage from './pages/student/ExamRunnerPage.jsx';
  import StudentNotesPage from './pages/student/NotesPage.jsx';
  import StudentReportCardsPage from './pages/student/ReportCardsPage.jsx';

  // Teacher
  import TeacherDashboard from './pages/TeacherDashboard.jsx';
  import QuestionBankPage from './pages/teacher/QuestionBankPage.jsx';
  import ExamsListPage from './pages/teacher/ExamsListPage.jsx';
  import LiveMonitorPage from './pages/teacher/LiveMonitorPage.jsx';
  import ResultsPage from './pages/teacher/ResultsPage.jsx';
  import StudentManagementPage from './pages/teacher/StudentManagementPage.jsx';
  import NotesPage from './pages/teacher/NotesPage.jsx';
  import ReportCardsPage from './pages/teacher/ReportCardsPage.jsx';
  import AnnouncementsPage from './pages/teacher/AnnouncementsPage.jsx';
  import ClassesPage from './pages/teacher/ClassesPage.jsx';
  import TimetablePage from './pages/teacher/TimetablePage.jsx';
  import AttendancePage from './pages/teacher/AttendancePage.jsx';
  import AttendanceReportPage from './pages/teacher/AttendanceReportPage.jsx';

  // Admin
  import UsersPage from './pages/admin/UsersPage.jsx';

  // Misc
  import Login from './pages/Login.jsx';
  import NotFound from './pages/NotFound.jsx';

  function PrivateRoute({ children, allowRoles }) {
    const { user, profile, role, loading } = useAuth();
    if (loading) return <FullScreenLoader />;
    if (!user) return <Navigate to="/login" replace />;
    if (!profile) return <FullScreenLoader label="Loading profile…" />;
    if (allowRoles && role && !allowRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  function HomeRedirect() {
    const { user, profile, role, loading } = useAuth();
    if (loading) return <FullScreenLoader />;
    if (!user) return <Navigate to="/login" replace />;
    if (!profile) return <FullScreenLoader label="Loading profile…" />;
    if (role === 'teacher' || role === 'admin') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  export default function App() {
    const location = useLocation();

    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* ---------- Student ---------- */}
          <Route
            path="/student"
            element={
              <PrivateRoute allowRoles={['student', 'teacher', 'admin']}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <PrivateRoute allowRoles={['student', 'teacher', 'admin']}>
                <MyResultsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/notes"
            element={
              <PrivateRoute allowRoles={['student', 'teacher', 'admin']}>
                <StudentNotesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/reports"
            element={
              <PrivateRoute allowRoles={['student', 'teacher', 'admin']}>
                <StudentReportCardsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/exam/:examId"
            element={
              <PrivateRoute allowRoles={['student', 'teacher', 'admin']}>
                <ExamRunnerPage />
              </PrivateRoute>
            }
          />

          {/* ---------- Teacher ---------- */}
          <Route
            path="/teacher"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/questions"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <QuestionBankPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/exams"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <ExamsListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/exams/:examId/monitor"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <LiveMonitorPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/exams/:examId/results"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <ResultsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <StudentManagementPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/notes"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <NotesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/reports"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <ReportCardsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/announcements"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <AnnouncementsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/classes"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <ClassesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/timetable"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <TimetablePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <AttendancePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/attendance/report"
            element={
              <PrivateRoute allowRoles={['teacher', 'admin']}>
                <AttendanceReportPage />
              </PrivateRoute>
            }
          />

          {/* ---------- Admin ---------- */}
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowRoles={['admin']}>
                <UsersPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    );
  }