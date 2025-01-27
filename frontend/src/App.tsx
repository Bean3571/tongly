import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Layout/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Home } from './pages/Home';
import { PrivateRoute } from './components/PrivateRoute';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                            <Navbar />
                            <main className="container mx-auto px-4 py-8">
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route
                                        path="/profile"
                                        element={
                                            <PrivateRoute>
                                                <Profile />
                                            </PrivateRoute>
                                        }
                                    />
                                </Routes>
                            </main>
                        </div>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;