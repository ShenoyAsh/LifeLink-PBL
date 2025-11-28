import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Award, Droplet, Star, Shield, Zap, Activity, LayoutDashboard } from 'lucide-react';
import { toast } from 'react-toastify';

// Import the missing features
import GamificationDashboard from './gamification/GamificationDashboard';
import HealthTracker from './health/HealthTracker';

// Badge Configuration (Visuals)
const BADGE_ICONS = {
  'First Saver': { icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-100', desc: 'Completed your first donation!' },
  'High Five Hero': { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100', desc: 'Donated 5 times. You are a star!' },
  'Legend': { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-100', desc: 'Earned 500+ points. A true legend.' },
  'LifeLink Hero': { icon: Zap, color: 'text-red-500', bg: 'bg-red-100', desc: 'Answered an emergency call.' }
};

export default function DonorDashboard() {
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // Added state for tabs

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

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* 1. Login / Search Section */}
        {!profile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-xl mx-auto"
          >
            <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <Award className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Donor Impact Dashboard</h2>
            <p className="text-gray-600 mb-8">Enter your registered email to view your badges, points, and donation history.</p>
            
            <form onSubmit={handleSearch} className="relative">
              <input
                type="email"
                required
                className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all pl-12"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Search className="absolute left-4 top-5 text-gray-400 h-6 w-6" />
              <button 
                type="submit" 
                disabled={loading}
                className="mt-4 w-full bg-primary-green text-white py-3 px-6 rounded-xl font-bold text-lg hover:bg-dark-green transition-colors shadow-lg disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'View My Impact'}
              </button>
            </form>
          </motion.div>
        )}

        {/* 2. Profile Section (Visible after search) */}
        {profile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary-green to-emerald-600 h-32"></div>
              <div className="px-8 pb-8 relative">
                <div className="absolute -top-12 left-8 h-24 w-24 bg-white rounded-full p-2 shadow-lg">
                  <div className="h-full w-full bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400 uppercase">
                    {profile.name.charAt(0)}
                  </div>
                </div>
                <div className="pt-14 flex justify-between items-end flex-wrap">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                    <p className="text-gray-500 flex items-center mt-1">
                       <span className="font-semibold text-red-500 mr-2">{profile.bloodType}</span> 
                       • {profile.location}
                    </p>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-4 sm:mt-0">
                    {[
                      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                      { id: 'achievements', label: 'Achievements', icon: Award },
                      { id: 'health', label: 'Health Tracker', icon: Activity }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          activeTab === tab.id 
                            ? 'bg-white text-primary-green shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[400px]">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Total Points</h3>
                        <Star className="text-blue-500 h-6 w-6" />
                      </div>
                      <p className="text-4xl font-bold text-gray-800">{profile.points}</p>
                      <p className="text-sm text-gray-400 mt-2">Earn +50 per donation</p>
                    </motion.div>

                    <motion.div 
                       whileHover={{ y: -5 }}
                       className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-red-500"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Donations</h3>
                        <Droplet className="text-red-500 h-6 w-6" />
                      </div>
                      <p className="text-4xl font-bold text-gray-800">{profile.donationCount}</p>
                      <p className="text-sm text-gray-400 mt-2">Lives impacted</p>
                    </motion.div>

                    <motion.div 
                       whileHover={{ y: -5 }}
                       className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-green-500"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 font-medium">Badges</h3>
                        <Award className="text-green-500 h-6 w-6" />
                      </div>
                      <p className="text-4xl font-bold text-gray-800">{profile.badges.length}</p>
                      <p className="text-sm text-gray-400 mt-2">Achievements unlocked</p>
                    </motion.div>
                  </div>

                  {/* Badge Case */}
                  <div className="bg-white rounded-2xl shadow-md p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Award className="mr-2 text-primary-green" /> Trophy Case
                    </h3>
                    
                    {profile.badges.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {profile.badges.map((badgeName, i) => {
                          const badgeInfo = BADGE_ICONS[badgeName] || BADGE_ICONS['LifeLink Hero'];
                          const Icon = badgeInfo.icon;
                          return (
                            <div key={i} className={`${badgeInfo.bg} p-4 rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 cursor-pointer`}>
                              <div className={`h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 ${badgeInfo.color}`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <p className="font-bold text-gray-800 text-sm">{badgeName}</p>
                              <p className="text-xs text-gray-500 mt-1">{badgeInfo.desc}</p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No badges yet. Complete your first donation to unlock!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Advanced Features Tabs */}
              {activeTab === 'achievements' && (
                <GamificationDashboard />
              )}

              {activeTab === 'health' && (
                <HealthTracker userId={profile._id} />
              )}
            </div>
            
            <div className="text-center pt-8">
                <button onClick={() => { setProfile(null); setActiveTab('overview'); }} className="text-gray-500 hover:text-gray-800 underline">
                    Search another email
                </button>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}