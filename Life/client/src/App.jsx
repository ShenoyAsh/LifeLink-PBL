import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import FeatureCards from './components/FeatureCards';
import StatsSection from './components/StatsSection';
import RegisterDonor from './components/RegisterDonor';
import AdminDashboard from './components/AdminDashboard';
import FindMatch from './components/FindMatch';
import EmergencyRequestForm from './components/EmergencyRequestForm';
import EmergencyDashboard from './components/EmergencyDashboard';
import DonorDashboard from './components/DonorDashboard';

// Import Auth Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <FeatureCards />
    </>
  );
}

function App() {
  return (
    <div className="App min-h-screen font-sans text-gray-800 bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<RegisterForm />} />
          
          <Route path="/register-donor" element={<RegisterDonor />} />
          <Route path="/emergency-request" element={<EmergencyRequestForm />} />
          <Route path="/find-match" element={<FindMatch />} />
          
          {/* Protected/Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/emergency-dashboard" element={<EmergencyDashboard />} />
          <Route path="/donor-dashboard" element={<DonorDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;