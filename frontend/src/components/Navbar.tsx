import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

const DEFAULT_AVATAR = 'https://secure.gravatar.com/avatar/default?s=200&d=mp';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { t, formatCurrency } = useTranslation();
    const location = useLocation();

    const getNavLinks = () => {
        if (!user) return [];

        const commonLinks = [
            { to: '/home', label: t('navbar.home') },
        ];

        return commonLinks;
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
                        <LanguageSwitcher />

                        {user ? (
                            <div className="flex items-center space-x-4">
                                <div className="relative group">
                                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-overlay-light transition-colors">
                                        <img
                                            src={user.profilePictureUrl || DEFAULT_AVATAR}
                                            alt={user.username}
                                            className="h-8 w-8 rounded-full object-cover border-2 border-border"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                        <span className="text-text-primary font-medium">
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
                            <div className="flex items-center space-x-4">
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
            </div>
        </nav>
    );
}; 