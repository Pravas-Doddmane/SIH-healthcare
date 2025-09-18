import React, { useState, useEffect } from 'react';
import { Hospital, Search, Plus, LogOut, Trash2, X, User, Phone, Key, BookOpen, RefreshCw } from 'lucide-react';
import { auth, db } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ 
    doctorId: '', 
    name: '', 
    phone: '', 
    password : '',
    specialization: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'doctors'),
        where('hospitalId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const doctorsList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      alert('Error fetching doctors: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const email = `${newDoctor.phone}@doctor.com`;
      
      await addDoc(collection(db, 'doctors'), {
        ...newDoctor,
        email,
        hospitalId: auth.currentUser.uid,
        createdAt: new Date(),
        role: 'doctor',
        status: 'active'
      });
      
      setNewDoctor({ doctorId: '', name: '', phone: '', password : '', specialization: '' });
      setShowAddForm(false);
      fetchDoctors();
      alert('Doctor added successfully! Doctors can login using their phone number and password.');
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Error adding doctor: ' + error.message);
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await deleteDoc(doc(db, 'doctors', doctorId));
        fetchDoctors();
        alert('Doctor deleted successfully!');
      } catch (error) {
        alert('Error deleting doctor: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.doctorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.phone?.includes(searchTerm) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <Hospital className="header-icon" />
            <div>
              <h1 className="header-title">Hospital Management</h1>
              <p className="header-subtitle">Admin Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut className="btn-icon" />
            Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon doctors">
              <User size={24} />
            </div>
            <div className="stat-info">
              <h3>{doctors.length}</h3>
              <p>Total Doctors</p>
            </div>
          </div>
        </div>

        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search doctors by name, ID, phone, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={() => setShowAddForm(true)} className="add-doctor-btn">
            <Plus className="btn-icon" />
            Add New Doctor
          </button>
        </div>

        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">Add New Doctor</h2>
                <button onClick={() => setShowAddForm(false)} className="close-btn">
                  <X className="close-icon" />
                </button>
              </div>
              <form onSubmit={handleAddDoctor} className="modal-form">
                <div className="input-group">
                  <User className="input-icon" />
                  <input
                    type="text"
                    placeholder="Doctor ID *"
                    value={newDoctor.doctorId}
                    onChange={(e) => setNewDoctor({...newDoctor, doctorId: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <User className="input-icon" />
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <Phone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <BookOpen className="input-icon" />
                  <input
                    type="text"
                    placeholder="Specialization *"
                    value={newDoctor.specialization}
                    onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <Key className="input-icon" />
              <input
  type="password"
  placeholder="Password or Doctor ID *"
  value={newDoctor.password_or_doctorid}
  onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
  className="form-input"
  required
/>


                </div>
                
                <div className="form-note">
                  * Doctor will login using phone number and this password
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Add Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="doctors-table-container">
          <div className="table-header">
            <h2 className="table-title">Doctors List</h2>
            <div className="table-actions">
              <span className="doctors-count">{doctors.length} doctors</span>
              <button onClick={fetchDoctors} className="refresh-btn">
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading doctors...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="no-data">
              <User size={48} className="no-data-icon" />
              <p>No doctors found. {searchTerm ? 'Try a different search.' : 'Add your first doctor!'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="doctors-table">
                <thead>
                  <tr>
                    <th>Doctor ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td className="doctor-id">{doctor.doctorId}</td>
                      <td>
                        <div className="doctor-info">
                          <User size={16} className="doctor-avatar" />
                          {doctor.name}
                        </div>
                      </td>
                      <td>{doctor.phone}</td>
                      <td>{doctor.specialization}</td>
                      <td>
                        <span className={`status-badge ${doctor.status || 'active'}`}>
                          {doctor.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteDoctor(doctor.id)}
                          className="delete-btn"
                          title="Delete Doctor"
                        >
                          <Trash2 className="btn-icon" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;