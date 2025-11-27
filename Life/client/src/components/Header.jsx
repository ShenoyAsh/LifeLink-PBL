// src/components/Header.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
                <div className="w-full py-6 flex items-center justify-between border-b border-red-100 lg:border-none">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <span className="text-2xl font-bold text-red-600">LifeLink</span>
                        </Link>
                        <div className="hidden ml-10 space-x-8 lg:block">
                            <Link to="/find-match" className="text-base font-medium text-gray-700 hover:text-red-600">
                                Find Donors
                            </Link>
                            <Link to="/about" className="text-base font-medium text-gray-700 hover:text-red-600">
                                About
                            </Link>
                            <Link to="/how-it-works" className="text-base font-medium text-gray-700 hover:text-red-600">
                                How It Works
                            </Link>
                            <Link to="/contact" className="text-base font-medium text-gray-700 hover:text-red-600">
                                Contact
                            </Link>
                        </div>
                    </div>
                    <div className="ml-10 space-x-4 flex items-center">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-red-600 focus:outline-none"
                                >
                                    <span>{user.name || 'My Account'}</span>
                                    <svg
                                        className="h-5 w-5 text-gray-500"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>

                                {isMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                        <div className="py-1" role="none">
                                            <Link
                                                to="/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                My Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-block bg-red-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-red-700"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="py-4 flex flex-wrap justify-center space-x-6 lg:hidden">
                    <Link to="/find-match" className="text-base font-medium text-gray-700 hover:text-red-600">
                        Find Donors
                    </Link>
                    <Link to="/about" className="text-base font-medium text-gray-700 hover:text-red-600">
                        About
                    </Link>
                    <Link to="/how-it-works" className="text-base font-medium text-gray-700 hover:text-red-600">
                        How It Works
                    </Link>
                    <Link to="/contact" className="text-base font-medium text-gray-700 hover:text-red-600">
                        Contact
                    </Link>
                </div>
            </nav>
        </header>
    );
};

export default Header;