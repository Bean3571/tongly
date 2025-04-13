import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { envConfig } from '../config/env';

const DEFAULT_AVATAR = envConfig.defaultAvatar;

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { t, formatCurrency } = useTranslation();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const getNavLinks = () => {
        if (!user) return [];

        const navItems = [
            { to: '/search-tutors', label: t('pages.search_tutor.title'), visibleTo: 'student' },
            { to: '/lessons', label: t('pages.my_lessons.title'), visibleTo: 'all' },
            { to: '/tutor-schedule', label: t('pages.tutor_schedule.title'), visibleTo: 'tutor' },
            { to: '/tutor-settings', label: t('navbar.tutor_settings'), visibleTo: 'tutor' },
            { to: '/preferences', label: t('navbar.preferences'), visibleTo: 'all' },
        ];

        return navItems.filter(item => 
            item.visibleTo === 'all' || 
            (user.role === item.visibleTo)
        );
    };

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="bg-surface border-b border-border sticky top-0 z-sticky">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/home" className="text-2xl font-bold text-accent-primary">
                            Языкус
                        </Link>
                        
                        <div className="hidden md:flex ml-10 space-x-8">
                            {getNavLinks().map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`text-text-secondary hover:text-text-primary transition-colors
                                        ${isActive(link.to) ? 'text-accent-primary font-medium' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Mobile menu button */}
                        <button 
                            className="md:hidden p-2 rounded-md hover:bg-overlay-light transition-colors focus:outline-none"
                            onClick={toggleMobileMenu}
                            aria-expanded={mobileMenuOpen}
                        >
                            <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                            {/* Hamburger icon */}
                            {!mobileMenuOpen ? (
                                <svg className="h-6 w-6 text-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6 text-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>

                        <LanguageSwitcher />

                        {user ? (
                            <div className="flex items-center space-x-4">
                                <div className="relative group">
                                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-overlay-light transition-colors">
                                        <img
                                            src={user.profile_picture_url || DEFAULT_AVATAR}
                                            alt={user.username}
                                            className="h-8 w-8 rounded-full object-cover border-2 border-border"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                        <span className="text-text-primary font-medium hidden sm:inline">
                                            {user.username}
                                        </span>
                                    </button>
                                    <div className="absolute right-0 w-48 mt-2 py-2 bg-surface rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <Link
                                            to="/settings"
                                            className="block px-4 py-2 text-sm text-text-secondary hover:bg-overlay-light hover:text-text-primary w-full text-left"
                                        >
                                            {t('navbar.account_settings')}
                                        </Link>
                                        <button
                                            onClick={logout}
                                            className="block px-4 py-2 text-sm text-error hover:bg-overlay-light w-full text-left"
                                        >
                                            {t('auth.logout')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-accent-primary hover:text-accent-primary-hover font-medium transition-colors"
                                >
                                    {t('auth.login')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium transition-colors"
                                >
                                    {t('auth.register')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Mobile menu, show/hide based on menu state */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-2 border-t border-border">
                        {getNavLinks().length > 0 && (
                            <div className="px-2 pt-2 pb-4 space-y-1">
                                {getNavLinks().map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors
                                            ${isActive(link.to) 
                                                ? 'bg-overlay-light text-accent-primary' 
                                                : 'text-text-secondary hover:bg-overlay-light hover:text-text-primary'
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                        
                        {!user && (
                            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
                                <Link
                                    to="/login"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-accent-primary hover:bg-overlay-light transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t('auth.login')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-3 py-2 rounded-md text-base font-medium bg-accent-primary hover:bg-accent-primary-hover text-white transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t('auth.register')}
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}; 