import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import Dashboard from './pages/Dashboard';
import { Tutors } from './pages/Tutors';
import { TutorProfile } from './pages/TutorProfile';
import TutorDashboard from './pages/TutorDashboard';
import { Lessons } from './pages/Lessons';
import { Wallet } from './pages/Wallet';
import { Challenges } from './pages/Challenges';
import { Leaderboard } from './pages/Leaderboard';
import { useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (role && user.credentials.role !== role) {
        return <Navigate to={`/${user.credentials.role}/dashboard`} />;
    }
    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Protected Routes */}
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <Profile />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/student/dashboard"
                        element={
                            <PrivateRoute role="student">
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/tutors"
                        element={
                            <PrivateRoute role="student">
                                <Tutors />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/tutors/:id"
                        element={
                            <PrivateRoute role="student">
                                <TutorProfile />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/tutor/dashboard"
                        element={
                            <PrivateRoute role="tutor">
                                <TutorDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/lessons"
                        element={
                            <PrivateRoute>
                                <Lessons />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/wallet"
                        element={
                            <PrivateRoute>
                                <Wallet />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/challenges"
                        element={
                            <PrivateRoute role="student">
                                <Challenges />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/leaderboard"
                        element={
                            <PrivateRoute role="student">
                                <Leaderboard />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <ThemeProvider>
                    <NotificationProvider>
                        <AuthProvider>
                            <AppRoutes />
                        </AuthProvider>
                    </NotificationProvider>
                </ThemeProvider>
            </Router>
        </QueryClientProvider>
    );
};

export default App;