import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Navbar } from './components/Layout/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Survey } from './pages/Survey';
import Dashboard from './pages/Dashboard';
import { useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <>{children}</>;
};

const SurveyRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (!user.survey_complete) return <Navigate to="/survey" />;
    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/survey"
                        element={
                            <PrivateRoute>
                                <Survey />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <SurveyRoute>
                                <Profile />
                            </SurveyRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <SurveyRoute>
                                <Dashboard />
                            </SurveyRoute>
                        }
                    />
                </Routes>
            </main>
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