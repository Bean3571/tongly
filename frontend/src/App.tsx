import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { I18nProvider } from './contexts/I18nContext';
import { TranslationLoader } from './components/TranslationLoader';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuth } from './contexts/AuthContext';
import { Home } from './pages/Home';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/home" />;
    return <>{children}</>;
};

const AppRoutes = () => {
    const { user } = useAuth();
    const defaultRoute = '/home';

    return (
        <div className="min-h-screen flex flex-col bg-surface text-text-primary">
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Home />} />


                    {/* Default Route */}
                    <Route path="/" element={<Navigate to={defaultRoute} replace />} />
                    <Route path="*" element={<Navigate to={defaultRoute} replace />} />
                </Routes>
            </main>
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