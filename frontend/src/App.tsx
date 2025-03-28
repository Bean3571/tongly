import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { I18nProvider } from './contexts/I18nContext';
import { TranslationLoader } from './components/TranslationLoader';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import TutorProfile from './pages/TutorProfile';
import TutorSearch from './pages/TutorSearch';
import { Lessons } from './pages/Lessons';
import { Wallet } from './pages/Wallet';
import { useAuth } from './contexts/AuthContext';
import { BookLesson } from './pages/BookLesson';
import { TeachingProfile } from './pages/TeachingProfile';
import { PlatformEarnings } from './pages/admin/PlatformEarnings';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (role && user.credentials.role !== role) {
        return <Navigate to="/" />;
    }
    return <>{children}</>;
};

const AppRoutes = () => {
    const { user } = useAuth();
    const defaultRoute = user?.credentials.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';

    return (
        <div className="min-h-screen flex flex-col bg-surface text-text-primary">
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Common Protected Routes */}
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/wallet" element={
                        <PrivateRoute>
                            <Wallet />
                        </PrivateRoute>
                    } />

                    {/* Student Routes */}
                    <Route path="/student/dashboard" element={
                        <PrivateRoute role="student">
                            <StudentDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/tutors" element={
                        <PrivateRoute role="student">
                            <TutorSearch />
                        </PrivateRoute>
                    } />
                    <Route path="/tutors/:id" element={
                        <PrivateRoute role="student">
                            <TutorProfile />
                        </PrivateRoute>
                    } />
                    <Route path="/tutors/:id/book" element={
                        <PrivateRoute role="student">
                            <BookLesson />
                        </PrivateRoute>
                    } />

                    {/* Tutor Routes */}
                    <Route path="/tutor/dashboard" element={
                        <PrivateRoute role="tutor">
                            <TutorDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/tutor/profile" element={
                        <PrivateRoute role="tutor">
                            <TeachingProfile />
                        </PrivateRoute>
                    } />

                    {/* Lesson Routes */}
                    <Route path="/lessons" element={
                        <PrivateRoute>
                            <Lessons />
                        </PrivateRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin/earnings" element={
                        <PrivateRoute role="admin">
                            <PlatformEarnings />
                        </PrivateRoute>
                    } />

                    {/* Default Route */}
                    <Route path="/" element={<Navigate to={defaultRoute} replace />} />
                    <Route path="*" element={<Navigate to={defaultRoute} replace />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <NotificationProvider>
                        <I18nProvider>
                            <TranslationLoader>
                                <AuthProvider>
                                    <AppRoutes />
                                </AuthProvider>
                            </TranslationLoader>
                        </I18nProvider>
                    </NotificationProvider>
                </Router>
            </QueryClientProvider>
        </ThemeProvider>
    );
};

export default App;