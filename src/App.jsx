// App.jsx (Main Application)
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import Login from './components/Login/Login';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard/PatientDashboard';
import Loading from './components/Loading/Loading';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState(null); // admin, doctor, patient

  useEffect(() => {
    const currentDoctor = localStorage.getItem('currentDoctor');
    const currentPatient = localStorage.getItem('currentPatient');

    if (currentDoctor) setUserType('doctor');
    else if (currentPatient) setUserType('patient');

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserType('admin');
      setIsLoading(false);
    });

    // stop loading if no auth change occurs
    setIsLoading(false);
    return () => unsubscribe();
  }, []);

  const handleLogin = (type) => {
    setUserType(type);
  };

  const handleLogout = async () => {
    localStorage.removeItem('currentDoctor');
    localStorage.removeItem('currentPatient');

    if (userType === 'admin') {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }

    setUserType(null);
  };

  if (isLoading) return <Loading />;

  if (!userType) return <Login onLogin={handleLogin} />;

  if (userType === 'admin') return <AdminDashboard onLogout={handleLogout} />;
  if (userType === 'doctor') return <DoctorDashboard onLogout={handleLogout} />;
  if (userType === 'patient') return <PatientDashboard onLogout={handleLogout} />;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Unable to determine user type</h2>
        <p className="text-gray-600 mb-4">Please contact support or try logging out and back in.</p>
        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;