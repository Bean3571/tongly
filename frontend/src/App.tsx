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
import { UserSettings } from './pages/UserSettings';
import SearchTutors from './pages/SearchTutors';
import { MyLessons } from './pages/MyLessons';
import { useAuth } from './contexts/AuthContext';
import { ScheduleLesson } from './pages/ScheduleLesson';
import { StudentSettings } from './pages/StudentSettings';
import { TutorSettings } from './pages/TutorSettings';
import { Home } from './pages/Home';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (!user.credentials) return <Navigate to="/login" />;
    if (role && user.credentials.role !== role) {
        return <Navigate to="/" />;
    }
    return <>{children}</>;
};

const AppRoutes = () => {
    const { user } = useAuth();
    const defaultRoute = user && user.credentials 
        ? (user.credentials.role === 'tutor' 
            ? '/lessons' 
            : '/tutors') 
        : '/home';

    return (
        <div className="min-h-screen flex flex-col bg-surface text-text-primary">
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Home />} />

                    {/* Common Protected Routes */}
                    <Route path="/settings" element={
                        <PrivateRoute>
                            <UserSettings />
                        </PrivateRoute>
                    } />

                    {/* Student Settings */}
                    <Route path="/student-settings" element={
                        <PrivateRoute role="student">
                            <StudentSettings />
                        </PrivateRoute>
                    } />

                    {/* Tutor Settings */}
                    <Route path="/tutor-settings" element={
                        <PrivateRoute role="tutor">
                            <TutorSettings />
                        </PrivateRoute>
                    } />

                    <Route path="/tutors" element={
                        <PrivateRoute role="student">
                            <SearchTutors />
                        </PrivateRoute>
                    } />

                    <Route path="/tutors/:id/book" element={
                        <PrivateRoute role="student">
                            <ScheduleLesson />
                        </PrivateRoute>
                    } />

                    {/* Lesson Routes */}
                    <Route path="/lessons" element={
                        <PrivateRoute>
                            <MyLessons />
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