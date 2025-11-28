import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, Droplet, Star, Shield, Zap, Activity, LayoutDashboard, 
  Calendar, Users, LogOut, Plus, AlertTriangle, X, Menu, Mail,
  CheckCircle, History, AlertOctagon, MapPin, Clock, HeartPulse
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './common';

// Theme configuration - used in styles below
const theme = {
  primary: '#E53E3E',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1A202C',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E2E8F0'
};

// Navigation items - used in the sidebar
const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/donor-dashboard' },
  { name: 'Appointments', icon: Calendar, path: '/appointments' },
  { name: 'Health Tracker', icon: Activity, path: '/health' },
  { name: 'Donation History', icon: History, path: '/donations' },
  { name: 'Emergency Alerts', icon: AlertOctagon, path: '/emergency' },
  { name: 'Find Donors', icon: Users, path: '/find-donors' },
  { name: 'Achievements', icon: Award, path: '/achievements' },
];

// Quick Stats Cards
const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    className={`bg-white rounded-xl p-6 shadow-sm border-t-4 border-${color}-500`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
    {change && (
      <p className={`text-sm mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
      </p>
    )}
  </motion.div>
);

// Badge Configuration (Visuals)
const BADGE_ICONS = {
  'First Saver': { icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-100', desc: 'Completed your first donation!' },
  'High Five Hero': { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100', desc: 'Donated 5 times. You are a star!' },
  'Legend': { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-100', desc: 'Earned 500+ points. A true legend.' },
  'LifeLink Hero': { icon: Zap, color: 'text-red-500', bg: 'bg-red-100', desc: 'Answered an emergency call.' }
};

export default function DonorDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [email, setEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  // Dashboard data
  const stats = {
    totalDonations: 12,
    livesImpacted: 36,
    badgesEarned: 8,
    points: 1250,
    lastDonation: '2023-11-15',
    nextEligible: '2024-01-15'
  };
  
  const emergencyAlerts = [
    { id: 1, type: 'urgent', bloodType: 'B+', location: 'City General Hospital', time: '2 hours ago', distance: '3.2 km' },
    { id: 2, type: 'critical', bloodType: 'O-', location: 'Red Cross Center', time: '5 hours ago', distance: '5.7 km' },
  ];

  // Update profile if user changes (e.g. direct login)
  useEffect(() => {
    if (user) setProfile(user);
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    const cleanEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      const res = await fetch(`${API_URL}/api/donors/profile/${encodeURIComponent(cleanEmail)}`);
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text(); 
        console.error("Server returned non-JSON:", text);
        throw new Error("Server Error: API endpoint not found. Please check backend logs.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Donor not found');
      }
      
      setProfile(data);
      toast.success(`Welcome back, ${data.name}!`);
    } catch (err) {
      console.error("Search Error:", err);
      toast.error(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30 lg:static lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b">
            <div className="flex items-center">
              <Droplet className="h-8 w-8 text-red-500" />
              <span className="ml-2 text-xl font-bold text-gray-800">LifeLink</span>
            </div>
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* User Profile */}
          {profile && (
            <div className="px-6 py-4 border-b">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{profile.name || 'User'}</p>
                  <p className="text-xs text-gray-500">Donor</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                icon={item.icon}
                label={item.name}
                path={item.path}
                isActive={activeTab === item.name.toLowerCase().replace(' ', '-')}
                onClick={() => {
                  setActiveTab(item.name.toLowerCase().replace(' ', '-'));
                  setSidebarOpen(false);
                }}
              />
            ))}
          </nav>
          
          {/* Bottom Section */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button 
                className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
                onClick={toggleSidebar}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {navItems.find(item => `/${activeTab}` === item.path)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                {emergencyAlerts.length > 0 && (
                  <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <div className="relative">
                <button className="flex items-center text-sm rounded-full focus:outline-none">
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50 p-6">
          {/* 1. Login / Search Section - Only show if not logged in via Context */}
          {!profile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-xl mx-auto"
            >
              <div className="mx-auto h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <Droplet className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to LifeLink</h2>
              <p className="text-gray-600 mb-6">Sign in to access your donor dashboard, track donations, and save lives.</p>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : 'Sign in'}
                </button>
              </form>
              
              <p className="mt-4 text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-red-600 hover:text-red-500">
                  Sign up
                </Link>
              </p>
            </motion.div>
          )}

          {/* 2. Dashboard Content (Visible after login) */}
          {profile && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile.name?.split(' ')[0]}!</h1>
                  <p className="text-gray-500 mt-1">Here's what's happening with your donations.</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Plus}
                    onClick={() => navigate('/donate-now')}
                    className="w-full md:w-auto"
                  >
                    Donate Now
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={Droplet} 
                  title="Total Donations" 
                  value={stats.totalDonations} 
                  change={12} 
                  color="red"
                />
                <StatCard 
                  icon={Users} 
                  title="Lives Impacted" 
                  value={stats.livesImpacted} 
                  change={8} 
                  color="green"
                />
                <StatCard 
                  icon={Award} 
                  title="Badges Earned" 
                  value={stats.badgesEarned} 
                  change={2} 
                  color="yellow"
                />
                <StatCard 
                  icon={BarChart2} 
                  title="Total Points" 
                  value={stats.points} 
                  change={15} 
                  color="blue"
                />
              </div>

              {/* Main Content Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Emergency Alerts */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                          Emergency Alerts
                        </h3>
                        <button className="text-sm font-medium text-red-600 hover:text-red-500">
                          View all
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {emergencyAlerts.length > 0 ? (
                        emergencyAlerts.map((alert) => (
                          <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {alert.bloodType} Blood Needed
                                  </p>
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                    {alert.type === 'urgent' ? 'Urgent' : 'Critical'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {alert.location} • {alert.distance} away
                                </p>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{alert.time}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex space-x-3">
                              <Button variant="primary" size="sm">
                                I Can Help
                              </Button>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center">
                          <Shield className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No active emergency alerts in your area.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next Appointment */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                      <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      Upcoming Appointment
                    </h3>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-blue-800">JAN</div>
                            <div className="text-2xl font-bold text-blue-600">15</div>
                            <div className="text-xs text-gray-500">2024</div>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="font-medium text-gray-900">Blood Donation Appointment</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 inline-block mr-1" />
                            City Blood Center, 123 Health St.
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            <Clock className="h-4 w-4 inline-block mr-1" />
                            10:00 AM - 11:00 AM
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="primary" size="sm" className="flex-1">
                          View Details
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" size="sm" icon={Calendar}>
                          Schedule New
                        </Button>
                        <Button variant="secondary" size="sm" icon={History}>
                          View History
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Donation Eligibility */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      Donation Eligibility
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                          <span>Next Eligible Donation</span>
                          <span className="text-green-600">Available Now</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          You can donate again starting {formatDate(stats.nextEligible)}
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Health Check</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Last donation: {formatDate(stats.lastDonation)}</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Eligible to donate: Yes</span>
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span>Health status: Good</span>
                          </li>
                        </ul>
                      </div>
                      
                      <Button variant="primary" className="w-full mt-2">
                        Complete Health Check
                      </Button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                      <ActivitySquare className="h-5 w-5 text-purple-500 mr-2" />
                      Recent Activity
                    </h3>
                    
                    <div className="space-y-4">
                      {[
                        { id: 1, type: 'donation', title: 'Donation Completed', date: '2 days ago', points: 50 },
                        { id: 2, type: 'badge', title: 'Earned Badge: First Donation', date: '1 week ago', points: 100 },
                        { id: 3, type: 'appointment', title: 'Appointment Scheduled', date: 'Jan 10, 2024', points: 10 },
                      ].map((activity) => (
                        <div key={activity.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activity.type === 'donation' ? 'bg-red-100 text-red-600' :
                            activity.type === 'badge' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {activity.type === 'donation' && <Droplet className="h-4 w-4" />}
                            {activity.type === 'badge' && <Award className="h-4 w-4" />}
                            {activity.type === 'appointment' && <Calendar className="h-4 w-4" />}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{activity.date}</p>
                          </div>
                          {activity.points > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              +{activity.points} pts
                            </span>
                          )}
                        </div>
                      ))}
                      
                      <Button variant="link" className="w-full mt-2 text-sm">
                        View All Activity
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gamification Section */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="md:flex md:items-center md:justify-between">
                    <div className="md:w-1/2">
                      <h2 className="text-2xl font-bold text-white">Your Donor Level</h2>
                      <p className="mt-2 text-indigo-100">Keep donating to unlock exclusive rewards and recognition!</p>
                      
                      <div className="mt-6">
                        <div className="flex items-center justify-between text-sm font-medium text-white mb-1">
                          <span>Bronze Donor</span>
                          <span>250 / 500 pts</span>
                        </div>
                        <div className="w-full bg-indigo-400 bg-opacity-30 rounded-full h-3">
                          <div 
                            className="bg-white h-3 rounded-full" 
                            style={{ width: '50%' }}
                          ></div>
                        </div>
                        <p className="mt-2 text-xs text-indigo-200">250 points to next level</p>
                      </div>
                      
                      <Button 
                        variant="white" 
                        size="lg" 
                        className="mt-6 w-full md:w-auto"
                        onClick={() => setActiveTab('achievements')}
                      >
                        View All Achievements
                      </Button>
                    </div>
                    
                    <div className="hidden md:block md:w-1/2 md:pl-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20" style={{ top: '10%', left: '10%', width: '80%', height: '80%' }}></div>
                        <div className="absolute inset-0 bg-indigo-400 rounded-full opacity-30" style={{ top: '5%', left: '5%', width: '90%', height: '90%' }}></div>
                        <div className="relative bg-white rounded-full p-6 w-48 h-48 mx-auto flex flex-col items-center justify-center shadow-lg">
                          <Award className="h-12 w-12 text-yellow-500 mb-2" />
                          <span className="text-sm font-medium text-gray-500">Current Level</span>
                          <span className="text-2xl font-bold text-gray-900">Bronze</span>
                          <span className="text-xs text-gray-500">2/5 badges</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Tracker Preview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 text-green-500 mr-2" />
                    Health Tracker
                  </h3>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setActiveTab('health')}
                  >
                    View All
                  </Button>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Hemoglobin', value: '14.2', unit: 'g/dL', status: 'good' },
                      { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'normal' },
                      { label: 'Pulse', value: '72', unit: 'bpm', status: 'normal' },
                      { label: 'Weight', value: '68', unit: 'kg', status: 'good' },
                    ].map((metric, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-500">{metric.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value} 
                          <span className="text-sm font-normal text-gray-500">{metric.unit}</span>
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                          metric.status === 'good' ? 'bg-green-100 text-green-800' :
                          metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {metric.status === 'good' ? 'Good' : metric.status === 'warning' ? 'Warning' : 'Normal'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('health')}
                  >
                    Log New Health Data
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}