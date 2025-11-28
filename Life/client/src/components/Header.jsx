import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="font-cursive text-3xl font-bold text-primary-green">LifeLink</span>
          </Link>
        </div>
        
        {/* Added items-center to ensure vertical alignment of buttons */}
        <div className="flex gap-x-12 items-center">
          <Link to="/find-match" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
            Find Donor
          </Link>
          <Link to="/emergency-request" className="text-sm font-semibold leading-6 text-red-600 hover:text-red-800">
            Need Blood
          </Link>

          {/* LOGIC START: Conditional rendering based on login status */}
          {user ? (
            <>
              {/* Features Links */}
              <Link to="/gamification" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
                Rewards
              </Link>
              <Link to="/predictions" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
                AI Insights
              </Link>

              {/* Show these only when logged in */}
              <Link to="/donor-dashboard" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green flex items-center gap-1">
                My Impact 
              </Link>
              
              {/* Admin Link - Visible to all logged in users now */}
              <Link to="/admin" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
                Admin
              </Link>

              {/* User Profile & Logout Section */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm font-medium text-gray-500">Hi, {user.name}</span>
                <button 
                  onClick={logout} 
                  className="text-sm font-semibold leading-6 text-red-600 hover:text-red-800"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Show these only when logged out */}
              <Link to="/register-donor" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
                Register
              </Link>
              
              {/* Login / Signup Buttons */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
                  Log in
                </Link>
                <Link to="/signup" className="rounded-md bg-primary-green px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-green">
                  Sign up
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}