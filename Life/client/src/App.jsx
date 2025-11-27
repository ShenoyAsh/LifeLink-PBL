import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import RegisterDonor from './components/RegisterDonor';
import EmergencyRequestForm from './components/EmergencyRequestForm';
import FindMatch from './pages/FindMatch';
import AdminDashboard from './pages/AdminDashboard';
import EmergencyDashboard from './pages/EmergencyDashboard';
import DonorDashboard from './pages/DonorDashboard';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import EmergencyAlert from './components/EmergencyAlert';

function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen font-sans text-gray-800 bg-gray-50">
        <Header />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register-donor" element={<RegisterDonor />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/find-match" element={<FindMatch />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/emergency" element={<EmergencyAlert />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/emergency-dashboard" element={<EmergencyDashboard />} />
              <Route path="/donor-dashboard" element={<DonorDashboard />} />
              <Route path="/emergency-request" element={<EmergencyRequestForm />} />
            </Route>

            {/* Redirect any unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;