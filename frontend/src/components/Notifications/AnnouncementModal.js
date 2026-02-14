import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../api/axios';
import './notifications.css';

const AnnouncementModal = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all'); // all | department | individual | team
  const [department, setDepartment] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [allocatedEmployees, setAllocatedEmployees] = useState([]);
  
  const role = localStorage.getItem('role') || 'employee';
  const isHODorDirector = ['hod', 'director'].includes(role);
  const isHRMSorSuperAdmin = ['hrms_handler', 'super_admin', 'admin', 'superadmin'].includes(role);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setMessage('');
    setAudience(isHODorDirector ? 'team' : 'all');
    setDepartment('');
    setSelectedEmployeeIds([]);
  }, [isOpen, isHODorDirector]);

  useEffect(() => {
    if (!isOpen) return;
    // Fetch employees based on role
    const loadEmployees = async () => {
      try {
        const res = await axios.get('/employees');
        const allEmployees = Array.isArray(res.data) ? res.data : [];
        setEmployees(allEmployees);
        
        // For HOD/Director, we'll show all their allocated employees
        if (isHODorDirector) {
          // The backend will filter based on their allocated employees when sending
          setAllocatedEmployees(allEmployees.filter(emp => emp.empStatus === 'W'));
        }
      } catch {
        setEmployees([]);
        setAllocatedEmployees([]);
      }
    };
    loadEmployees();
  }, [isOpen, isHODorDirector]);

  const departments = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => { if (e.department) set.add(e.department); });
    return Array.from(set).sort();
  }, [employees]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        title,
        message,
        audience,
        targetDepartment: audience === 'department' ? department : '',
        targetEmployeeIds: audience === 'individual' ? selectedEmployeeIds : [],
      };
      await axios.post('/notifications', payload);
      if (typeof onCreated === 'function') onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to send notification:', err);
      alert(err.response?.data?.message || 'Failed to send notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeSelection = (empId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(empId)) {
        return prev.filter(id => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="announcement-backdrop" role="dialog" aria-modal="true">
      <div className="announcement-modal">
        <div className="announcement-modal-header">
          <div className="announcement-modal-title">Add Announcement</div>
          <button className="btn btn-muted" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="announcement-body">
          <form className="announcement-form" onSubmit={submit}>
            <div className="form-row">
              <label htmlFor="ann-title">Title</label>
              <input id="ann-title" className="input-text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-row">
              <label htmlFor="ann-message">Message</label>
              <textarea id="ann-message" className="input-textarea" value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <div className="form-row">
              <label htmlFor="ann-audience">Audience</label>
              <select id="ann-audience" className="input-select" value={audience} onChange={(e) => setAudience(e.target.value)}>
                {isHRMSorSuperAdmin && <option value="all">All Employees</option>}
                {isHRMSorSuperAdmin && <option value="department">Specific Department</option>}
                {isHODorDirector && <option value="team">My Team (All Allocated)</option>}
                <option value="individual">Specific Employee(s)</option>
              </select>
            </div>
            {audience === 'department' && (
              <div className="form-row">
                <label htmlFor="ann-dept">Department</label>
                <select id="ann-dept" className="input-select" value={department} onChange={(e) => setDepartment(e.target.value)} required>
                  <option value="" disabled>Select department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            {audience === "individual" && (
              <div className="form-row">
                <label htmlFor="ann-emp">Select Employee(s)</label>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  background: '#f8f9fa'
                }}>
                  {(isHODorDirector ? allocatedEmployees : employees).length === 0 && (
                    <p style={{ padding: '0.5rem', color: '#6c757d', textAlign: 'center', margin: 0 }}>
                      No employees available
                    </p>
                  )}
                  {(isHODorDirector ? allocatedEmployees : employees).map((e) => (
                    <div key={e._id} style={{
                      padding: '0.5rem',
                      marginBottom: '0.25rem',
                      borderRadius: '6px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onClick={() => toggleEmployeeSelection(e._id)}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = '#e6f0ff'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = '#fff'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(e._id)}
                        onChange={() => toggleEmployeeSelection(e._id)}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: '500', color: '#333' }}>
                        {e.empName} <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>({e.empId})</span>
                      </span>
                    </div>
                  ))}
                </div>
                {selectedEmployeeIds.length > 0 && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#3f51b5', fontWeight: '600' }}>
                    {selectedEmployeeIds.length} employee(s) selected
                  </p>
                )}
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn btn-muted" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Publish'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
