import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const responsiveStyles = `
  * {
    box-sizing: border-box;
  }

  .leave-page {
    margin: 0;
    padding-top: 80px !important;
  }

  /* Date input placeholder styling */
  input[type="date"]::placeholder {
    color: #94a3b8;
    font-weight: 500;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    color: #2563eb;
  }

  /* Make date inputs more visible */
  input[type="date"] {
    color-scheme: light;
  }

  input[type="date"]:valid {
    color: #1e293b;
  }

  input[type="date"]:invalid {
    color: #94a3b8;
  }

  @media (max-width: 1024px) {
    .leave-form-row {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  @media (max-width: 768px) {
    .leave-page {
      padding: 1rem !important;
      padding-top: 80px !important;
    }
    .container {
      max-width: 100% !important;
    }
    .leave-form-row {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
      margin-bottom: 1rem !important;
    }
    .card-header {
      padding: 1.25rem !important;
    }
    .card-content {
      padding: 1.25rem !important;
    }
    .form-group-checkbox {
      gap: 1rem !important;
    }
    .balance-item {
      flex: 1 1 calc(50% - 0.5rem) !important;
    }
    .table-scroll {
      font-size: 0.8rem !important;
    }
    .button-group {
      flex-direction: column !important;
    }
    .leave-submit-btn {
      width: 100% !important;
    }
  }

  @media (max-width: 640px) {
    .leave-page {
      padding: 0.75rem !important;
      padding-top: 80px !important;
    }
    .header-section {
      margin-bottom: 1.5rem !important;
    }
    .title {
      font-size: 1.8rem !important;
      margin-bottom: 0.25rem !important;
    }
    .subtitle {
      font-size: 0.9rem !important;
      margin-top: 0.25rem !important;
    }
    .card-header {
      padding: 1rem !important;
    }
    .card-title {
      font-size: 1.2rem !important;
    }
    .card-content {
      padding: 1rem !important;
    }
    .balance-item {
      flex: 1 1 100% !important;
      padding: 1rem !important;
    }
    .balance-label {
      font-size: 0.7rem !important;
      margin-bottom: 0.5rem !important;
    }
    .balance-value {
      font-size: 2rem !important;
      margin-bottom: 0.25rem !important;
    }
    .balance-subtext {
      font-size: 0.7rem !important;
    }
    .label {
      font-size: 0.85rem !important;
      margin-bottom: 0.5rem !important;
    }
    .input, .textarea {
      padding: 0.75rem 1rem !important;
      font-size: 0.9rem !important;
    }
    input[type="date"] {
      padding: 0.85rem 1rem !important;
      font-size: 1rem !important;
      background-color: #fff !important;
      width: 100% !important;
    }
    input[type="date"]::-webkit-calendar-picker-indicator {
      width: 36px;
      height: 36px;
      padding: 2px;
      cursor: pointer;
    }
    .form-group {
      margin-bottom: 0.5rem !important;
    }
    .form-group input[type="date"]:empty::before {
      content: "YYYY-MM-DD";
      color: #94a3b8;
    }
    .checkbox-wrapper {
      padding: 0.75rem !important;
      gap: 0.5rem !important;
    }
    .button-group {
      gap: 0.5rem !important;
      margin-top: 1rem !important;
      padding-top: 1rem !important;
    }
    .leave-submit-btn {
      padding: 0.9rem 1.5rem !important;
      font-size: 0.85rem !important;
    }
    .list-section {
      margin-top: 1rem !important;
      padding-top: 1rem !important;
    }
    .table-header {
      padding: 0.75rem !important;
      font-size: 0.75rem !important;
    }
    .table-cell {
      padding: 0.75rem !important;
      font-size: 0.8rem !important;
    }
    .main-card {
      margin-bottom: 1.5rem !important;
    }
  }

  .table-scroll::-webkit-scrollbar {
    height: 6px;
  }

  .table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }

  .table-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }

  .table-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const styles = {
  page: {
    minHeight: '100vh',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #f0f4f9 0%, #e8eef7 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
  },
  headerSection: {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
  },
  titleBlock: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 900,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-1.5px',
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginTop: '0.35rem',
    fontWeight: 400,
  },
  balanceCardsContainer: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  balanceCard: {
    flex: '1 1 calc(25% - 0.75rem)',
    minWidth: '160px',
    padding: '1.25rem',
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s ease',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
  },
  balanceCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
  },
  balanceLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '0.5rem',
  },
  balanceValue: {
    fontSize: '2.2rem',
    fontWeight: 900,
    color: '#2563eb',
    marginBottom: '0.35rem',
  },
  balanceSubtext: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  mainCard: {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  },
  cardHeader: {
    padding: '1.75rem',
    borderBottom: '2px solid #f8fafc',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    letterSpacing: '-0.5px',
  },
  cardTitleIcon: {
    fontSize: '1.5rem',
  },
  cardContent: {
    padding: '1.75rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '0.6rem',
    display: 'block',
    letterSpacing: '-0.3px',
  },
  labelSmall: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  input: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  inputFocus: {
    backgroundColor: '#fff',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.08), 0 0 0 1.5px #2563eb',
  },
  textarea: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    minHeight: '100px',
    resize: 'vertical',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    transition: 'all 0.3s ease',
    outline: 'none',
    lineHeight: 1.5,
  },
  textareAreaFocus: {
    backgroundColor: '#fff',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.08), 0 0 0 1.5px #2563eb',
  },
  checkboxWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '1rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  checkboxWrapperActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#2563eb',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #f0f4f9',
  },
  submit: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    border: 'none',
    padding: '1rem 2.5rem',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  submitHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
  },
  submitDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
  listSection: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #f0f4f9',
  },
  listTitle: {
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '1.25rem',
    letterSpacing: '-0.5px',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
  },
  th: {
    textAlign: 'left',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    color: '#0f172a',
    padding: '1rem',
    fontWeight: 700,
    borderBottom: '2px solid #e2e8f0',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
  },
  tdHover: {
    backgroundColor: '#f8fafc',
  },
  statusBadge: {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '0.7rem',
    display: 'inline-block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusApproved: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusCancelled: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
  },
  emptyIcon: {
    fontSize: '3.5rem',
    marginBottom: '1rem',
    opacity: 0.7,
  },
  emptyText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '0.5rem',
  },
  emptySubtext: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
};

const EmployeeLeaveRequest = () => {
  const [form, setForm] = useState({ startDate: '', endDate: '', type: 'AL', reason: '', isHalfDay: false, contactDuringLeave: '' });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [hoveredSubmit, setHoveredSubmit] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBalance, setHoveredBalance] = useState(null);
  const [halfDayChecked, setHalfDayChecked] = useState(false);

  const fetchEmployeeData = async () => {
    try {
      const empIdFromStorage = localStorage.getItem('employeeId');
      if (empIdFromStorage) {
        const res = await axios.get(`/employees/${empIdFromStorage}`);
        setEmployeeData(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch employee data:', e);
      toast.error('Failed to load employee information');
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get('/leave-types');
      setLeaveTypes(res.data || []);
    } catch (e) {
      console.error('Failed to fetch leave types:', e);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const empIdFromStorage = localStorage.getItem('employeeId');
      if (empIdFromStorage && employeeData) {
        const res = await axios.get(`/leaves/balance/${employeeData.empId}`);
        setLeaveBalance(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch leave balance:', e);
    }
  };

  const fetchLeaves = async () => {
    try {
      if (!employeeData) return;
      const res = await axios.get(`/leaves/my-requests?empId=${employeeData.empId}`);
      const data = res.data;
      setLeaves(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      console.error('Failed to fetch leaves:', e);
      toast.error('Failed to load your leave requests');
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    if (employeeData) {
      fetchLeaves();
      fetchLeaveBalance();
    }
  }, [employeeData]);

  const submit = async (e) => {
    e.preventDefault();

    if (!employeeData || !employeeData.empId) {
      toast.error('Employee information not found. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        empId: employeeData.empId,
        startDate: form.startDate,
        endDate: form.endDate,
        type: form.type,
        reason: form.reason,
        isHalfDay: form.isHalfDay,
        contactDuringLeave: form.contactDuringLeave
      };

      const res = await axios.post('/leaves/request', payload);

      toast.success('Leave request submitted successfully!');
      setForm({ startDate: '', endDate: '', type: 'AL', reason: '', isHalfDay: false, contactDuringLeave: '' });
      setHalfDayChecked(false);
      await fetchLeaves();
      await fetchLeaveBalance();
    } catch (e) {
      console.error('Failed to submit leave:', e);
      const errorMsg = e.response?.data?.message || 'Failed to submit leave request';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s) => {
    let style = styles.statusPending;
    if (s === 'approved') style = styles.statusApproved;
    else if (s === 'rejected') style = styles.statusRejected;
    else if (s === 'cancelled') style = styles.statusCancelled;

    return <span style={{ ...styles.statusBadge, ...style }}>{s.toUpperCase()}</span>;
  };

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={styles.page} className="leave-page">
        <ToastContainer position="top-right" autoClose={4000} />
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.headerSection} className="header-section">
            <div style={styles.titleBlock}>
              <h1 style={styles.title} className="leave-title">Leave Management</h1>
              <p style={styles.subtitle}>Request and track your leave efficiently</p>
            </div>

            {/* Balance Cards */}
            {leaveBalance && leaveBalance.leaveBalances && leaveBalance.leaveBalances.length > 0 && (
              <div style={styles.balanceCardsContainer}>
                {leaveBalance.leaveBalances.map((lb, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.balanceCard,
                      ...(hoveredBalance === idx ? styles.balanceCardHover : {})
                    }}
                    onMouseEnter={() => setHoveredBalance(idx)}
                    onMouseLeave={() => setHoveredBalance(null)}
                    className="balance-item"
                  >
                    <div style={styles.balanceLabel}>{lb.leaveTypeName || lb.leaveType}</div>
                    <div style={styles.balanceValue}>{lb.balance || 0}</div>
                    <div style={styles.balanceSubtext}>
                      <div>Allocated: {lb.allocated || 0}</div>
                      <div>Used: {lb.consumed || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave Request Form */}
          <div style={styles.mainCard} className="leave-card">
            <div style={styles.cardHeader} className="card-header">
              <h2 style={styles.cardTitle}>
                <span style={styles.cardTitleIcon}>✍️</span>
                New Request
              </h2>
            </div>
            <div style={styles.cardContent} className="card-content">
              <form onSubmit={submit}>
                {/* Dates and Type */}
                <div style={styles.formRow} className="leave-form-row">
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      style={focusedInput === 'startDate' ? { ...styles.input, ...styles.inputFocus } : styles.input}
                      onFocus={() => setFocusedInput('startDate')}
                      onBlur={() => setFocusedInput(null)}
                      min={undefined}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Date</label>
                    <input
                      type="date"
                      placeholder="YYYY-MM-DD"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      style={focusedInput === 'endDate' ? { ...styles.input, ...styles.inputFocus } : styles.input}
                      onFocus={() => setFocusedInput('endDate')}
                      onBlur={() => setFocusedInput(null)}
                      min={form.startDate || undefined}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Leave Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      style={focusedInput === 'type' ? { ...styles.input, ...styles.inputFocus } : styles.input}
                      onFocus={() => setFocusedInput('type')}
                      onBlur={() => setFocusedInput(null)}
                      required
                    >
                      {leaveTypes.length > 0 ? (
                        leaveTypes.filter(lt => lt.isActive).map(lt => (
                          <option key={lt.code} value={lt.code}>{lt.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="AL">Annual Leave</option>
                          <option value="CL">Casual Leave</option>
                          <option value="BTL">Business Trip Leave</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Half Day and Contact */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="form-group-checkbox">
                  <div style={styles.formGroup}>
                    <div
                      style={{
                        ...styles.checkboxWrapper,
                        ...(halfDayChecked ? styles.checkboxWrapperActive : {})
                      }}
                      onClick={() => {
                        setHalfDayChecked(!halfDayChecked);
                        setForm({ ...form, isHalfDay: !halfDayChecked });
                      }}
                      className="checkbox-wrapper"
                    >
                      <input
                        type="checkbox"
                        checked={halfDayChecked}
                        onChange={() => { }}
                        style={styles.checkbox}
                      />
                      <span style={styles.labelSmall}>Half Day</span>
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact (Optional)</label>
                    <input
                      type="tel"
                      value={form.contactDuringLeave}
                      onChange={(e) => setForm({ ...form, contactDuringLeave: e.target.value })}
                      style={focusedInput === 'contact' ? { ...styles.input, ...styles.inputFocus } : styles.input}
                      onFocus={() => setFocusedInput('contact')}
                      onBlur={() => setFocusedInput(null)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Reason for Leave</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    style={focusedInput === 'reason' ? { ...styles.textarea, ...styles.textareAreaFocus } : styles.textarea}
                    onFocus={() => setFocusedInput('reason')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Provide a detailed reason for your leave request"
                    required
                  />
                </div>

                {/* Submit */}
                <div style={styles.buttonGroup} className="button-group">
                  <button
                    type="submit"
                    style={
                      loading || !employeeData
                        ? { ...styles.submit, ...styles.submitDisabled }
                        : hoveredSubmit
                          ? { ...styles.submit, ...styles.submitHover }
                          : styles.submit
                    }
                    onMouseEnter={() => !loading && setHoveredSubmit(true)}
                    onMouseLeave={() => setHoveredSubmit(false)}
                    disabled={loading || !employeeData}
                    className="leave-submit-btn"
                  >
                    {loading ? '⏳ Processing' : '✓ Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div style={styles.mainCard}>
            <div style={styles.cardHeader} className="card-header">
              <h2 style={styles.cardTitle}>
                <span style={styles.cardTitleIcon}>📊</span>
                My Requests
              </h2>
            </div>
            <div style={styles.cardContent} className="card-content">
              <div style={styles.listSection} className="list-section">
                {leaves.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📋</div>
                    <p style={styles.emptyText}>No requests yet</p>
                    <p style={styles.emptySubtext}>Submit your first request above</p>
                  </div>
                ) : (
                  <div style={styles.tableWrapper} className="table-scroll">
                    <table style={styles.table} className="leave-table">
                      <thead>
                        <tr>
                          <th style={{ ...styles.th }} className="table-header">ID</th>
                          <th style={{ ...styles.th }} className="table-header">Applied</th>
                          <th style={{ ...styles.th }} className="table-header">Start</th>
                          <th style={{ ...styles.th }} className="table-header">End</th>
                          <th style={{ ...styles.th }} className="table-header">Days</th>
                          <th style={{ ...styles.th }} className="table-header">Type</th>
                          <th style={{ ...styles.th }} className="table-header">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((lv) => (
                          <tr
                            key={lv._id}
                            style={hoveredRow === lv._id ? { ...styles.tdHover } : {}}
                            onMouseEnter={() => setHoveredRow(lv._id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <td style={{ ...styles.td }} className="table-cell">
                              <span style={{ fontWeight: 700, color: '#2563eb' }}>
                                {lv.leaveRequestId || `LR-${lv._id.slice(-4).toUpperCase()}`}
                              </span>
                            </td>
                            <td style={{ ...styles.td }} className="table-cell">
                              {new Date(lv.appliedAt || lv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td style={{ ...styles.td }} className="table-cell">
                              {new Date(lv.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td style={{ ...styles.td }} className="table-cell">
                              {new Date(lv.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td style={{ ...styles.td }} className="table-cell">
                              <strong>{lv.totalDays || 0}</strong>{lv.isHalfDay && <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>½</span>}
                            </td>
                            <td style={{ ...styles.td }} className="table-cell">
                              <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{lv.leaveType || lv.type}</span>
                            </td>
                            <td style={{ ...styles.td }} className="table-cell">{statusBadge(lv.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeLeaveRequest;
