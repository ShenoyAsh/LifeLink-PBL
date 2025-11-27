import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { Menu, X, Heart, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth(); // Get user and logout function
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Find Donor', href: '/find-match' },
    { name: 'Donate Blood', href: '/register-donor' },
    { name: 'Emergency', href: '/emergency-request' },
    { name: 'Donor Dashboard', href: '/donor-dashboard' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        {/* Logo Section */}
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2 group">
            <div className="relative">
              <Heart className="h-8 w-8 text-primary-600 fill-primary-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-primary-400 blur-lg opacity-20 rounded-full animate-pulse"></div>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">
              Life<span className="text-primary-600">Link</span>
            </span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-sm font-semibold leading-6 text-gray-700 hover:text-primary-600 transition-colors relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 flex items-center gap-1"
              >
                Log out <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Dialog */}
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-50" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Heart className="h-8 w-8 text-primary-600 fill-primary-600" />
              <span className="font-bold text-xl">LifeLink</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 text-base font-semibold text-gray-900">
                      <User className="h-5 w-5" />
                      {user.name}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-primary-600 hover:bg-gray-50"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}