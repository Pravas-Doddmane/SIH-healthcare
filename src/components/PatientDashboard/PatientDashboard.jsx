import React, { useState, useEffect } from 'react';
import { User, LogOut, Clock, Pill, MessageCircle, FileText, Calendar } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { callGeminiAPI } from '../../services/gemini';
import './PatientDashboard.css';

const PatientDashboard = ({ onLogout }) => {
  const [reports, setReports] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('reports');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const getCurrentPatient = () => {
    const currentPatient = localStorage.getItem('currentPatient');
    return currentPatient ? JSON.parse(currentPatient) : null;
  };

  useEffect(() => {
    const currentPatient = getCurrentPatient();
    if (!currentPatient) return;

    const patientId = currentPatient.id;

    // Set up real-time listeners for patient data
    const unsubscribeReports = onSnapshot(
      query(collection(db, 'reports'), 
      where('patientId', '==', patientId), 
      orderBy('createdAt', 'desc')),
      (snapshot) => {
        setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubscribeReminders = onSnapshot(
      query(collection(db, 'reminders'), 
      where('patientId', '==', patientId), 
      orderBy('date', 'asc')),
      (snapshot) => {
        setReminders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubscribePrescriptions = onSnapshot(
      query(collection(db, 'prescriptions'), 
      where('patientId', '==', patientId), 
      orderBy('createdAt', 'desc')),
      (snapshot) => {
        setPrescriptions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    // Clean up listeners on unmount
    return () => {
      unsubscribeReports();
      unsubscribeReminders();
      unsubscribePrescriptions();
    };
  }, []);

  const handleReportSummary = async (report) => {
    setSelectedReport(report);
    setLoadingSummary(true);
    try {
      const reportData = `
        Blood Pressure: ${report.bp || 'Not recorded'}
        Blood Sugar: ${report.sugar || 'Not recorded'} mg/dL
        Weight: ${report.weight || 'Not recorded'} kg
        Temperature: ${report.temperature || 'Not recorded'} °F
        RBC Count: ${report.rbc || 'Not recorded'}
        WBC Count: ${report.wbc || 'Not recorded'}
        Platelets: ${report.platelets || 'Not recorded'}
        Additional Notes: ${report.additionalNotes || 'None'}
        Date: ${report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
      `;

      const prompt = `Please explain this medical report in simple, patient-friendly language. Highlight any concerning values and suggest what the patient should do next:\n\n${reportData}`;

      const summary = await callGeminiAPI(prompt);
      setAiSummary(summary);
    } catch (error) {
      alert('Error getting AI summary: ' + error.message);
      setAiSummary('Unable to generate summary at this time. Please try again later.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = { type: 'user', content: newMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      const prompt = `As a medical AI assistant, provide helpful and accurate information about: ${newMessage}. Keep responses clear, concise, and patient-friendly. If it's a serious medical concern, advise to consult a doctor immediately.`;
      const response = await callGeminiAPI(prompt);
      const aiMessage = { type: 'ai', content: response, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentPatient');
    onLogout();
  };

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <User className="header-icon" />
            <h1 className="header-title">Patient Portal</h1>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut className="btn-icon" />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="tab-navigation">
          {['reports', 'reminders', 'prescriptions', 'ai-chat'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'ai-chat' ? 'AI Chat' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'reports' && (
          <div className="tab-content">
            {selectedReport && (
              <div className="ai-summary-card">
                <h3 className="ai-summary-title">
                  <FileText className="icon-sm" />
                  AI Summary for {selectedReport.createdAt?.toDate ? selectedReport.createdAt.toDate().toLocaleDateString() : 'Report'}
                </h3>
                {loadingSummary ? (
                  <div className="loading-summary">Generating summary...</div>
                ) : (
                  <div className="ai-summary-content">
                    <p>{aiSummary}</p>
                    <div className="summary-actions">
                      <button onClick={() => setSelectedReport(null)} className="close-summary-btn">
                        Close Summary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">My Medical Reports</h3>
                <p className="card-subtitle">Click on any report to get an AI explanation</p>
              </div>
              <div className="card-body">
                {reports.length === 0 ? (
                  <div className="no-data">
                    <FileText className="icon-lg" />
                    <p>No medical reports available yet.</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="report-item">
                      <div className="report-content">
                        <div className="report-header">
                          <span className="report-date">
                            <Calendar className="icon-sm" />
                            {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                          </span>
                          <span className="report-doctor">By Dr. {report.doctorName || report.doctorId}</span>
                        </div>
                        <div className="report-details">
                          {report.bp && <span>BP: {report.bp}</span>}
                          {report.sugar && <span>Sugar: {report.sugar} mg/dL</span>}
                          {report.weight && <span>Weight: {report.weight} kg</span>}
                          {report.temperature && <span>Temp: {report.temperature}°F</span>}
                          {report.additionalNotes && (
                            <p className="report-notes">Notes: {report.additionalNotes}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleReportSummary(report)}
                        className="summary-btn"
                        disabled={loadingSummary}
                      >
                        {loadingSummary && selectedReport?.id === report.id ? '...' : 'Explain'}
                      </button>
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
              <div className="card-header">
                <h3 className="card-title">My Reminders & Appointments</h3>
              </div>
              <div className="card-body">
                {reminders.length === 0 ? (
                  <div className="no-data">
                    <Clock className="icon-lg" />
                    <p>No reminders scheduled.</p>
                  </div>
                ) : (
                  reminders.map((reminder) => (
                    <div key={reminder.id} className="reminder-item">
                      <div className="reminder-icon-container">
                        <Clock className="reminder-icon" />
                      </div>
                      <div className="reminder-content">
                        <h4>{reminder.title}</h4>
                        <p>{reminder.description}</p>
                        <div className="reminder-date">
                          <Calendar className="icon-sm" />
                          {reminder.date} at {reminder.time}
                        </div>
                        <div className="reminder-doctor">
                          Set by Dr. {reminder.doctorName}
                        </div>
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
              <div className="card-header">
                <h3 className="card-title">My Prescriptions</h3>
              </div>
              <div className="card-body">
                {prescriptions.length === 0 ? (
                  <div className="no-data">
                    <Pill className="icon-lg" />
                    <p>No active prescriptions.</p>
                  </div>
                ) : (
                  prescriptions.map((prescription) => (
                    <div key={prescription.id} className="prescription-item">
                      <div className="prescription-icon-container">
                        <Pill className="prescription-icon" />
                      </div>
                      <div className="prescription-details">
                        <h4>{prescription.medicine}</h4>
                        <div className="prescription-info">
                          <span><strong>Dosage:</strong> {prescription.dosage}</span>
                          <span><strong>Frequency:</strong> {prescription.frequency}</span>
                          <span><strong>Timing:</strong> {prescription.timing}</span>
                          {prescription.duration && <span><strong>Duration:</strong> {prescription.duration}</span>}
                          {prescription.beforeAfterFood && (
                            <span><strong>Take:</strong> {prescription.beforeAfterFood}</span>
                          )}
                          {prescription.instructions && (
                            <p className="prescription-instructions">
                              <strong>Instructions:</strong> {prescription.instructions}
                            </p>
                          )}
                        </div>
                        <div className="prescription-doctor">
                          Prescribed by Dr. {prescription.doctorName}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-chat' && (
          <div className="tab-content">
            <div className="card chat-card">
              <div className="card-header">
                <h3 className="card-title">
                  <MessageCircle className="icon-sm" />
                  AI Health Assistant
                </h3>
                <p className="card-subtitle">Ask any health-related questions</p>
              </div>
              <div className="card-body">
                <div className="chat-container">
                  {chatMessages.length === 0 ? (
                    <div className="chat-placeholder">
                      <MessageCircle className="icon-lg" />
                      <p>Hello! I'm your AI health assistant. How can I help you today?</p>
                      <div className="chat-suggestions">
                        <button onClick={() => setNewMessage('What are the symptoms of common cold?')}>
                          Common cold symptoms
                        </button>
                        <button onClick={() => setNewMessage('How to maintain a healthy diet?')}>
                          Healthy diet tips
                        </button>
                        <button onClick={() => setNewMessage('When should I see a doctor for fever?')}>
                          When to see doctor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-messages">
                      {chatMessages.map((message, index) => (
                        <div key={index} className={`chat-message ${message.type}-message`}>
                          <div className="message-content">
                            <p>{message.content}</p>
                            <span className="message-time">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <form onSubmit={handleChatMessage} className="chat-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your health question here..."
                    className="chat-input"
                  />
                  <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                    <MessageCircle className="btn-icon" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;