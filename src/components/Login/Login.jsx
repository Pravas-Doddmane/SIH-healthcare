import React, { useState } from 'react';
import { User, Hospital, Stethoscope } from 'lucide-react';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState('admin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userType === 'admin') {
        // Admins use Firebase Auth
        const email = `${phone}@healthcare.com`;

        if (isNewUser) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const userId = userCredential.user.uid;

          await addDoc(collection(db, 'admins'), {
            phone,
            name,
            hospitalName,
            email,
            userId,
            createdAt: new Date(),
            role: 'admin'
          });

          alert('Admin account created successfully!');
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }

        onLogin('admin');
      }

      if (userType === 'doctor') {
        // Doctors are checked directly from Firestore
        const q = query(collection(db, 'doctors'), where('phone', '==', phone));
        const snapshot = await getDocs(q);

        if (snapshot.empty) throw new Error('Doctor not found');

        const doctor = snapshot.docs[0].data();
        if (doctor.password !== password) throw new Error('Invalid password');

        localStorage.setItem('currentDoctor', JSON.stringify({
          id: snapshot.docs[0].id,
          ...doctor
        }));

        onLogin('doctor');
      }

      if (userType === 'patient') {
        // Patients are checked directly from Firestore
        const q = query(collection(db, 'patients'), where('phone', '==', phone));
        const snapshot = await getDocs(q);

        if (snapshot.empty) throw new Error('Patient not found');

        const patient = snapshot.docs[0].data();
        if (patient.password !== password) throw new Error('Invalid password');

        localStorage.setItem('currentPatient', JSON.stringify({
          id: snapshot.docs[0].id,
          ...patient
        }));

        onLogin('patient');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Hospital className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Healthcare Management System</h1>
          <p className="text-gray-600 mt-2">Secure access for medical professionals and patients</p>
        </div>

        {/* User Type Tabs */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setUserType('admin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              userType === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600'
            }`}
          >
            <Hospital className="w-4 h-4 inline mr-2" /> Admin
          </button>
          <button
            onClick={() => setUserType('doctor')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              userType === 'doctor' ? 'bg-blue-600 text-white' : 'text-gray-600'
            }`}
          >
            <Stethoscope className="w-4 h-4 inline mr-2" /> Doctor
          </button>
          <button
            onClick={() => setUserType('patient')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              userType === 'patient' ? 'bg-blue-600 text-white' : 'text-gray-600'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" /> Patient
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your registered phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Extra fields only for Admin Registration */}
          {isNewUser && userType === 'admin' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                <input
                  type="text"
                  placeholder="Enter hospital name"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isNewUser ? 'Register Hospital' : 'Login')}
          </button>
        </form>

        {userType === 'admin' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsNewUser(!isNewUser)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isNewUser ? 'Already have an account? Login here' : 'New hospital? Register here'}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
          <p><strong>Note for Doctors:</strong> Your account must be created by hospital administration first.</p>
          <p><strong>Note for Patients:</strong> Your doctor will provide your login credentials.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
