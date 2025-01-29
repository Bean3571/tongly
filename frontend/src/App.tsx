import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import { PrivateRoute } from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import TutorRegistration from './pages/TutorRegistration';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <ThemeProvider>
                    <NotificationProvider>
                        <AuthProvider>
                            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                                <Navbar />
                                <main className="container mx-auto px-4 py-8">
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/register" element={<Register />} />
                                        <Route path="/profile" element={
                                            <PrivateRoute>
                                                <Profile />
                                            </PrivateRoute>
                                        } />
                                        <Route path="/tutor/register" element={
                                            <PrivateRoute>
                                                <TutorRegistration />
                                            </PrivateRoute>
                                        } />
                                    </Routes>
                                </main>
                                <Notification />
                            </div>
                        </AuthProvider>
                    </NotificationProvider>
                </ThemeProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;