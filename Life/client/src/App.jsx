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
import { ClerkProvider, SignedIn, SignIn, SignUp } from '@clerk/clerk-react';

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
    <ClerkProvider publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}>
      <div className="App min-h-screen font-sans text-gray-800 bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<SignIn routing="path" path="/login" />} />
            <Route path="/signup" element={<SignUp routing="path" path="/signup" />} />
            <Route path="/register-donor" element={<RegisterDonor />} />
            <Route path="/emergency-request" element={<EmergencyRequestForm />} />
            <Route path="/find-match" element={<FindMatch />} />
            <Route path="/admin" element={<SignedIn><AdminDashboard /></SignedIn>} />
            <Route path="/admin/emergency-dashboard" element={<SignedIn><EmergencyDashboard /></SignedIn>} />
            <Route path="/donor-dashboard" element={<SignedIn><DonorDashboard /></SignedIn>} />
          </Routes>
        </main>
      </div>
    </ClerkProvider>
  );
}

export default App;