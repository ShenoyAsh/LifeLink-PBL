import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="font-cursive text-3xl font-bold text-primary-green">LifeLink</span>
          </Link>
        </div>
        <div className="flex gap-x-12">
          <Link to="/find-match" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
            Find Donor
          </Link>
          <Link to="/emergency-request" className="text-sm font-semibold leading-6 text-red-600 hover:text-red-800">
            Need Blood
          </Link>
          <Link to="/register-donor" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
            Register
          </Link>
          {/* NEW LINK */}
          <Link to="/donor-dashboard" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green flex items-center gap-1">
            My Impact 
          </Link>
          <Link to="/admin" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-green">
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}