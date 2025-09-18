import React, { useState, useEffect } from 'react';
import { Stethoscope, Search, Plus, LogOut, X, Save, Clock, Pill, User, Calendar, FileText, ChevronLeft, Trash2, Edit } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { callGeminiAPI } from '../../services/gemini';
import './DoctorDashboard.css';

const DoctorDashboard = ({ onLogout }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '', phone: '', age: '', gender: '', address: '', password: ''
  });

  // Medical Report State
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    bp: '', sugar: '', weight: '', temperature: '',
    rbc: '', wbc: '', platelets: '', additionalNotes: ''
  });
  const [editingReport, setEditingReport] = useState(null);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Reminders
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({
    title: '', description: '', date: '', time: ''
  });
  const [editingReminder, setEditingReminder] = useState(null);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [newPrescription, setNewPrescription] = useState({
    medicine: '', dosage: '', frequency: '', timing: '', duration: '', instructions: '', beforeAfterFood: ''
  });
  const [editingPrescription, setEditingPrescription] = useState(null);

  const getCurrentDoctor = () => {
    const currentDoctor = localStorage.getItem('currentDoctor');
    return currentDoctor ? JSON.parse(currentDoctor) : null;
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id);
    }
  }, [selectedPatient, activeTab]);

  const fetchPatients = async () => {
    try {
      const currentDoctor = getCurrentDoctor();
      if (!currentDoctor) return;

      // Remove the where clause temporarily to test permissions
      const q = query(collection(db, 'patients'));
      // const q = query(collection(db, 'patients'), where('doctorId', '==', currentDoctor.id));
      
      const querySnapshot = await getDocs(q);
      const patientsList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter locally for now
      const filteredPatients = patientsList.filter(patient => 
        patient.doctorId === currentDoctor.id
      );
      
      setPatients(filteredPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      alert('Error fetching patients: ' + error.message);
    }
  };

  const fetchPatientData = async (patientId) => {
    try {
      console.log('Fetching data for patient:', patientId);
      
      // Fetch reports without where clause first
      const reportsQuery = query(collection(db, 'reports'));
      const reportsSnapshot = await getDocs(reportsQuery);
      const allReports = reportsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter locally
      const patientReports = allReports.filter(report => report.patientId === patientId);
      setReports(patientReports);

      // Fetch reminders
      const remindersQuery = query(collection(db, 'reminders'));
      const remindersSnapshot = await getDocs(remindersQuery);
      const allReminders = remindersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const patientReminders = allReminders.filter(reminder => reminder.patientId === patientId);
      setReminders(patientReminders);

      // Fetch prescriptions
      const prescriptionsQuery = query(collection(db, 'prescriptions'));
      const prescriptionsSnapshot = await getDocs(prescriptionsQuery);
      const allPrescriptions = prescriptionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const patientPrescriptions = allPrescriptions.filter(prescription => prescription.patientId === patientId);
      setPrescriptions(patientPrescriptions);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      alert('Error fetching patient data: ' + error.message);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const currentDoctor = getCurrentDoctor();
      if (!currentDoctor) {
        alert('Unable to identify current doctor');
        return;
      }

      await addDoc(collection(db, 'patients'), {
        ...newPatient,
        doctorId: currentDoctor.id,
        doctorName: currentDoctor.name || '',
        createdAt: serverTimestamp()
      });
      setNewPatient({ name: '', phone: '', age: '', gender: '', address: '', password: '' });
      setShowAddPatient(false);
      fetchPatients();
      alert('Patient added successfully! Patient can login using their phone number and password.');
    } catch (error) {
      alert('Error adding patient: ' + error.message);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const currentDoctor = getCurrentDoctor();
      if (!currentDoctor) {
        alert('Unable to identify current doctor');
        return;
      }

      if (editingReport) {
        // Update existing report
        await updateDoc(doc(db, 'reports', editingReport.id), {
          ...newReport,
          updatedAt: serverTimestamp()
        });
        setEditingReport(null);
        alert('Report updated successfully!');
      } else {
        // Add new report
        await addDoc(collection(db, 'reports'), {
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          doctorId: currentDoctor.id,
          doctorName: currentDoctor.name || '',
          doctorPhone: currentDoctor.phone || '',
          ...newReport,
          createdAt: serverTimestamp()
        });
        alert('Medical report added successfully!');
      }

      setNewReport({
        bp: '', sugar: '', weight: '', temperature: '',
        rbc: '', wbc: '', platelets: '', additionalNotes: ''
      });
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      alert('Error saving report: ' + error.message);
    }
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setNewReport({
      bp: report.bp || '',
      sugar: report.sugar || '',
      weight: report.weight || '',
      temperature: report.temperature || '',
      rbc: report.rbc || '',
      wbc: report.wbc || '',
      platelets: report.platelets || '',
      additionalNotes: report.additionalNotes || ''
    });
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteDoc(doc(db, 'reports', reportId));
        fetchPatientData(selectedPatient.id);
        alert('Report deleted successfully!');
      } catch (error) {
        alert('Error deleting report: ' + error.message);
      }
    }
  };

  const handleAIAnalysis = async () => {
    if (reports.length === 0) {
      alert('No reports available for analysis');
      return;
    }

    setAnalyzing(true);
    try {
      const reportsText = reports.map(r =>
        `Date: ${r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : 'Unknown'}\n` +
        `BP: ${r.bp}, Sugar: ${r.sugar}, Weight: ${r.weight}, Temp: ${r.temperature}\n` +
        `RBC: ${r.rbc}, WBC: ${r.wbc}, Platelets: ${r.platelets}\n` +
        `Notes: ${r.additionalNotes}\n`
      ).join('\n');

      const prompt = `Analyze these medical reports for patient ${selectedPatient.name} and provide insights on progress, trends, and recommendations:\n\n${reportsText}`;
      const analysis = await callGeminiAPI(prompt);
      setAiAnalysis(analysis);
    } catch (error) {
      alert('Error getting AI analysis: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const currentDoctor = getCurrentDoctor();
      if (!currentDoctor) {
        alert('Unable to identify current doctor');
        return;
      }

      if (editingReminder) {
        // Update existing reminder
        await updateDoc(doc(db, 'reminders', editingReminder.id), {
          ...newReminder,
          updatedAt: serverTimestamp()
        });
        setEditingReminder(null);
        alert('Reminder updated successfully!');
      } else {
        // Add new reminder
        await addDoc(collection(db, 'reminders'), {
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          doctorId: currentDoctor.id,
          doctorName: currentDoctor.name || '',
          ...newReminder,
          createdAt: serverTimestamp(),
          completed: false
        });
        alert('Reminder added successfully!');
      }

      setNewReminder({ title: '', description: '', date: '', time: '' });
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      alert('Error saving reminder: ' + error.message);
    }
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      title: reminder.title || '',
      description: reminder.description || '',
      date: reminder.date || '',
      time: reminder.time || ''
    });
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await deleteDoc(doc(db, 'reminders', reminderId));
        fetchPatientData(selectedPatient.id);
        alert('Reminder deleted successfully!');
      } catch (error) {
        alert('Error deleting reminder: ' + error.message);
      }
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const currentDoctor = getCurrentDoctor();
      if (!currentDoctor) {
        alert('Unable to identify current doctor');
        return;
      }

      if (editingPrescription) {
        // Update existing prescription
        await updateDoc(doc(db, 'prescriptions', editingPrescription.id), {
          ...newPrescription,
          updatedAt: serverTimestamp()
        });
        setEditingPrescription(null);
        alert('Prescription updated successfully!');
      } else {
        // Add new prescription
        await addDoc(collection(db, 'prescriptions'), {
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          doctorId: currentDoctor.id,
          doctorName: currentDoctor.name || '',
          ...newPrescription,
          createdAt: serverTimestamp()
        });
        alert('Prescription added successfully!');
      }

      setNewPrescription({
        medicine: '', dosage: '', frequency: '', timing: '',
        duration: '', instructions: '', beforeAfterFood: ''
      });
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      alert('Error saving prescription: ' + error.message);
    }
  };

  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    setNewPrescription({
      medicine: prescription.medicine || '',
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      timing: prescription.timing || '',
      duration: prescription.duration || '',
      instructions: prescription.instructions || '',
      beforeAfterFood: prescription.beforeAfterFood || ''
    });
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        await deleteDoc(doc(db, 'prescriptions', prescriptionId));
        fetchPatientData(selectedPatient.id);
        alert('Prescription deleted successfully!');
      } catch (error) {
        alert('Error deleting prescription: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentDoctor');
    onLogout();
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  if (selectedPatient) {
    return (
      <div className="doctor-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <button onClick={() => {
                setSelectedPatient(null);
                setEditingReport(null);
                setEditingReminder(null);
                setEditingPrescription(null);
                setAiAnalysis('');
              }} className="back-btn">
                <ChevronLeft size={24} />
              </button>
              <Stethoscope className="header-icon" />
              <h1 className="header-title">Patient: {selectedPatient.name}</h1>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut className="btn-icon" />
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="tab-navigation">
            {['reports', 'reminders', 'prescriptions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'reports' && (
            <div className="tab-content">
              <div className="card">
                <h3 className="card-title">
                  {editingReport ? 'Edit Medical Report' : 'Add Medical Report'}
                </h3>
                <form onSubmit={handleAddReport} className="medical-form">
                  <div className="form-row">
                    <input type="text" placeholder="Blood Pressure (e.g., 120/80)" value={newReport.bp}
                      onChange={(e) => setNewReport({ ...newReport, bp: e.target.value })} className="form-input" />
                    <input type="text" placeholder="Blood Sugar (mg/dL)" value={newReport.sugar}
                      onChange={(e) => setNewReport({ ...newReport, sugar: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-row">
                    <input type="text" placeholder="Weight (kg)" value={newReport.weight}
                      onChange={(e) => setNewReport({ ...newReport, weight: e.target.value })} className="form-input" />
                    <input type="text" placeholder="Temperature (°F)" value={newReport.temperature}
                      onChange={(e) => setNewReport({ ...newReport, temperature: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-row">
                    <input type="text" placeholder="RBC Count" value={newReport.rbc}
                      onChange={(e) => setNewReport({ ...newReport, rbc: e.target.value })} className="form-input" />
                    <input type="text" placeholder="WBC Count" value={newReport.wbc}
                      onChange={(e) => setNewReport({ ...newReport, wbc: e.target.value })} className="form-input" />
                    <input type="text" placeholder="Platelets Count" value={newReport.platelets}
                      onChange={(e) => setNewReport({ ...newReport, platelets: e.target.value })} className="form-input" />
                  </div>
                  <textarea placeholder="Additional Notes" value={newReport.additionalNotes}
                    onChange={(e) => setNewReport({ ...newReport, additionalNotes: e.target.value })}
                    className="form-textarea" rows="3" />
                  <div className="button-group">
                    <button type="submit" className="primary-btn">
                      <Save className="btn-icon" />
                      {editingReport ? 'Update Report' : 'Save Report'}
                    </button>
                    {editingReport && (
                      <button type="button" onClick={() => {
                        setEditingReport(null);
                        setNewReport({
                          bp: '', sugar: '', weight: '', temperature: '',
                          rbc: '', wbc: '', platelets: '', additionalNotes: ''
                        });
                      }} className="cancel-btn">
                        Cancel Edit
                      </button>
                    )}
                    <button type="button" onClick={handleAIAnalysis} className="secondary-btn" disabled={analyzing}>
                      {analyzing ? 'Analyzing...' : 'AI Analysis'}
                    </button>
                  </div>
                </form>
              </div>

              {aiAnalysis && (
                <div className="ai-analysis-card">
                  <h3 className="ai-analysis-title">AI Analysis Report</h3>
                  <p className="ai-analysis-content">{aiAnalysis}</p>
                </div>
              )}

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Medical Reports History</h3>
                </div>
                <div className="card-body">
                  {reports.length === 0 ? (
                    <p className="no-data">No medical reports found.</p>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="report-item">
                        <div className="report-header">
                          <span className="report-date">
                            {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                          </span>
                          <span className="report-doctor">By Dr. {report.doctorName || report.doctorId}</span>
                        </div>
                        <div className="report-details">
                          {report.bp && <span>BP: {report.bp}</span>}
                          {report.sugar && <span>Sugar: {report.sugar}</span>}
                          {report.weight && <span>Weight: {report.weight}kg</span>}
                          {report.temperature && <span>Temp: {report.temperature}°F</span>}
                          {report.additionalNotes && <p>Notes: {report.additionalNotes}</p>}
                        </div>
                        <div className="report-actions">
                          <button onClick={() => handleEditReport(report)} className="edit-btn" title="Edit Report">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteReport(report.id)} className="delete-btn" title="Delete Report">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="tab-content">
              <div className="card">
                <h3 className="card-title">
                  {editingReminder ? 'Edit Reminder' : 'Set New Reminder'}
                </h3>
                <form onSubmit={handleAddReminder} className="medical-form">
                  <input type="text" placeholder="Reminder Title" value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })} className="form-input" required />
                  <textarea placeholder="Description" value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    className="form-textarea" rows="2" required />
                  <div className="form-row">
                    <input type="date" value={newReminder.date}
                      onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })} className="form-input" required />
                    <input type="time" value={newReminder.time}
                      onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })} className="form-input" required />
                  </div>
                  <div className="button-group">
                    <button type="submit" className="primary-btn">
                      <Clock className="btn-icon" />
                      {editingReminder ? 'Update Reminder' : 'Set Reminder'}
                    </button>
                    {editingReminder && (
                      <button type="button" onClick={() => {
                        setEditingReminder(null);
                        setNewReminder({ title: '', description: '', date: '', time: '' });
                      }} className="cancel-btn">
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Active Reminders</h3>
                </div>
                <div className="card-body">
                  {reminders.length === 0 ? (
                    <p className="no-data">No reminders set.</p>
                  ) : (
                    reminders.map((reminder) => (
                      <div key={reminder.id} className="reminder-item">
                        <div className="reminder-content">
                          <h4>{reminder.title}</h4>
                          <p>{reminder.description}</p>
                          <span className="reminder-date">
                            <Calendar className="icon-sm" />
                            {reminder.date} at {reminder.time}
                          </span>
                        </div>
                        <div className="reminder-actions">
                          <button onClick={() => handleEditReminder(reminder)} className="edit-btn" title="Edit Reminder">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteReminder(reminder.id)} className="delete-btn" title="Delete Reminder">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="tab-content">
              <div className="card">
                <h3 className="card-title">
                  {editingPrescription ? 'Edit Prescription' : 'Add New Prescription'}
                </h3>
                <form onSubmit={handleAddPrescription} className="medical-form">
                  <div className="form-row">
                    <input type="text" placeholder="Medicine Name" value={newPrescription.medicine}
                      onChange={(e) => setNewPrescription({ ...newPrescription, medicine: e.target.value })}
                      className="form-input" required />
                    <input type="text" placeholder="Dosage (e.g., 500mg)" value={newPrescription.dosage}
                      onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                      className="form-input" required />
                  </div>
                  <div className="form-row">
                    <input type="text" placeholder="Frequency (e.g., Once daily)" value={newPrescription.frequency}
                      onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                      className="form-input" required />
                    <select value={newPrescription.timing}
                      onChange={(e) => setNewPrescription({ ...newPrescription, timing: e.target.value })}
                      className="form-input" required>
                      <option value="">Select Timing</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <input type="text" placeholder="Duration (e.g., 7 days)" value={newPrescription.duration}
                      onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                      className="form-input" required />
                    <select value={newPrescription.beforeAfterFood}
                      onChange={(e) => setNewPrescription({ ...newPrescription, beforeAfterFood: e.target.value })}
                      className="form-input">
                      <option value="">Before/After Food</option>
                      <option value="Before Food">Before Food</option>
                      <option value="After Food">After Food</option>
                      <option value="With Food">With Food</option>
                    </select>
                  </div>
                  <textarea placeholder="Special Instructions" value={newPrescription.instructions}
                    onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                    className="form-textarea" rows="2" />
                  <div className="button-group">
                    <button type="submit" className="primary-btn">
                      <Pill className="btn-icon" />
                      {editingPrescription ? 'Update Prescription' : 'Add Prescription'}
                    </button>
                    {editingPrescription && (
                      <button type="button" onClick={() => {
                        setEditingPrescription(null);
                        setNewPrescription({
                          medicine: '', dosage: '', frequency: '', timing: '',
                          duration: '', instructions: '', beforeAfterFood: ''
                        });
                      }} className="cancel-btn">
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Current Prescriptions</h3>
                </div>
                <div className="card-body">
                  {prescriptions.length === 0 ? (
                    <p className="no-data">No prescriptions available.</p>
                  ) : (
                    prescriptions.map((prescription) => (
                      <div key={prescription.id} className="prescription-item">
                        <div className="prescription-details">
                          <h4>{prescription.medicine}</h4>
                          <div className="prescription-info">
                            <span>Dosage: {prescription.dosage}</span>
                            <span>Frequency: {prescription.frequency}</span>
                            <span>Timing: {prescription.timing}</span>
                            {prescription.duration && <span>Duration: {prescription.duration}</span>}
                            {prescription.beforeAfterFood && <span>Take: {prescription.beforeAfterFood}</span>}
                            {prescription.instructions && <p>Instructions: {prescription.instructions}</p>}
                          </div>
                        </div>
                        <div className="prescription-actions">
                          <button onClick={() => handleEditPrescription(prescription)} className="edit-btn" title="Edit Prescription">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeletePrescription(prescription.id)} className="delete-btn" title="Delete Prescription">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // default doctor view (list of patients)
  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Stethoscope className="header-icon" />
            <h1 className="header-title">Doctor Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut className="btn-icon" />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="search-section">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={() => setShowAddPatient(true)} className="primary-btn">
            <Plus className="btn-icon" />
            Add New Patient
          </button>
        </div>

        {showAddPatient && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">Add New Patient</h2>
                <button onClick={() => setShowAddPatient(false)} className="close-btn">
                  <X className="close-icon" />
                </button>
              </div>
              <form onSubmit={handleAddPatient} className="modal-form">
                <input type="text" placeholder="Patient Name" value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} className="form-input" required />
                <input type="tel" placeholder="Phone Number" value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} className="form-input" required />
                <div className="form-row">
                  <input type="number" placeholder="Age" value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} className="form-input" required />
                  <select value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} className="form-input" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <textarea placeholder="Address" value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} className="form-textarea" rows="2" />
                <input
                  type="password"
                  placeholder="Password for patient login"
                  value={newPatient.password}
                  onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
                  className="form-input"
                  required
                />
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAddPatient(false)} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Add Patient
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="patients-grid">
          {filteredPatients.length === 0 ? (
            <div className="no-data">
              <p>{searchTerm ? 'No patients found matching your search.' : 'No patients yet. Add your first patient!'}</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient.id} onClick={() => setSelectedPatient(patient)} className="patient-card">
                <div className="patient-card-content">
                  <div>
                    <h3 className="patient-name">{patient.name}</h3>
                    <p className="patient-info">Age: {patient.age} | Gender: {patient.gender}</p>
                    <p className="patient-info">Phone: {patient.phone}</p>
                    {patient.address && <p className="patient-info">Address: {patient.address}</p>}
                  </div>
                  <User className="patient-icon" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;