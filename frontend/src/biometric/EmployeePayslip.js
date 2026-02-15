import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaDownload, FaFileInvoiceDollar, FaCalendarAlt, FaUser, FaEye, FaTrash } from 'react-icons/fa';
import EmployeeNavbar from '../components/Navbar/employeenavbar';
import axios from '../api/axios';
import './EmployeePayslip.css';

// Spinner Component
const LoadingSpinner = () => (
  <div style={{
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }} />
);

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

const styles = {
  container: {
    padding: '2rem',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    paddingTop: '90px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#333',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  mainCard: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  employeeInfo: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #dee2e6',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    color: '#333',
  },
  formSection: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  inputGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontWeight: '600',
    color: '#555',
    marginBottom: '0.5rem',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    backgroundColor: '#fff',
  },
  generateBtn: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: '0 auto',
    transition: 'background-color 0.2s',
  },
  historySection: {
    marginTop: '3rem',
  },
  slipsContainer: {
    marginTop: '1.5rem',
  },
  slipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  slipCard: {
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  slipCardHover: {
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    borderColor: '#007bff',
  },
  slipCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f0f0f0',
  },
  slipPeriod: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
  },
  monthYear: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#333',
  },
  yearBadge: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  slipCardContent: {
    flex: '1',
    marginBottom: '1.2rem',
  },
  slipInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#666',
    fontSize: '0.95rem',
    marginBottom: '0.8rem',
  },
  slipActions: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '0.6rem 1rem',
    fontSize: '0.9rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    flex: '1',
    minWidth: '100px',
    justifyContent: 'center',
  },
  viewBtn: {
    backgroundColor: '#17a2b8',
    color: '#fff',
  },
  viewBtnHover: {
    backgroundColor: '#138496',
  },
  downloadBtn: {
    backgroundColor: '#28a745',
    color: '#fff',
  },
  downloadBtnHover: {
    backgroundColor: '#218838',
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
    color: '#fff',
  },
  deleteBtnHover: {
    backgroundColor: '#c82333',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#666',
    padding: '2rem',
  },
  noData: {
    textAlign: 'center',
    padding: '2rem',
    color: '#999',
    fontSize: '1.1rem',
  },
};

const EmployeePayslip = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [existingSlips, setExistingSlips] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingSlipId, setLoadingSlipId] = useState(null);

  useEffect(() => {
    fetchEmployeeData();
    fetchExistingSlips();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get('/slips/my/available-periods');
      setEmployeeData(response.data.employee);
      setAvailablePeriods(response.data.availablePeriods);

      // Set default to most recent period if available
      if (response.data.availablePeriods.length > 0) {
        const latest = response.data.availablePeriods[0];
        setSelectedMonth(String(latest.monthNumber));
        setSelectedYear(String(latest.year));
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to load employee information');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchExistingSlips = async () => {
    try {
      const response = await axios.get('/slips/my/list');
      setExistingSlips(response.data);
    } catch (error) {
      console.error('Error fetching existing slips:', error);
      // Don't show error toast as employee might not have any slips yet
    }
  };

const generatePayslip = async () => {
  if (!selectedMonth || !selectedYear) {
    toast.error('Please select month and year');
    return;
  }

  setLoading(true);
  try {
    const response = await axios.post('/slips/my/generate', {
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
    });

    // ✅ Only show success message
    toast.success(response.data.message || 'Salary slip generated successfully');

    // ✅ Stay on same page
    // ✅ Just refresh history list
    await fetchExistingSlips();

  } catch (error) {
    console.error('Error generating payslip:', error);
    const errorMsg =
      error.response?.data?.error || 'Failed to generate payslip';
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
};


  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || monthNumber;
  };

  const handleView = async (slip) => {
    setLoadingSlipId(`view-${slip._id}`);
    try {
      const response = await axios.get(`/slips/view/${slip._id}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');

      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error('Failed to view PDF');
    } finally {
      setLoadingSlipId(null);
    }
  };

  const handleDownload = async (slip) => {
    setLoadingSlipId(`download-${slip._id}`);
    try {
      const response = await axios.get(`/slips/download/${slip._id}`, {
        responseType: 'blob',
      });

      const fileName = `salary_slip_${slip.empName.replace(/\s+/g, '_')}_${getMonthName(slip.month)}_${slip.year}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setLoadingSlipId(null);
    }
  };

  const handleDelete = async (slip) => {
    const confirmed = window.confirm('Are you sure you want to delete this salary slip?');
    if (!confirmed) return;

    try {
      // Adjust this endpoint if your backend uses a different route
      await axios.delete(`/slips/my/${slip._id}`);
      toast.success('Salary slip deleted successfully');
      await fetchExistingSlips();
    } catch (error) {
      console.error('Error deleting slip:', error);
      const msg = error.response?.data?.message || 'Failed to delete salary slip';
      toast.error(msg);
    }
  };

  if (initialLoading) {
    return (
      <>
        <EmployeeNavbar />
        <div style={styles.container}>
          <div style={styles.loading}>Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <EmployeeNavbar />
      <div style={styles.container} className="payslip-container">
        <ToastContainer position="top-right" autoClose={3000} />

        <div style={styles.header} className="payslip-header">
          <h1 style={styles.title} className="payslip-title">Generate Salary Slip</h1>
          <p style={styles.subtitle} className="payslip-subtitle">Generate and download your monthly salary slip</p>
        </div>

        <div style={styles.mainCard} className="payslip-main-card">
          {employeeData && (
            <div style={styles.employeeInfo} className="payslip-employee-info">
              <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
                <FaUser style={{ marginRight: '0.5rem' }} />
                Employee Information
              </h3>
              <div style={styles.infoRow} className="payslip-info-row">
                <span style={styles.infoLabel}>Employee ID:</span>
                <span style={styles.infoValue}>{employeeData.empId}</span>
              </div>
              <div style={styles.infoRow} className="payslip-info-row">
                <span style={styles.infoLabel}>Name:</span>
                <span style={styles.infoValue}>{employeeData.empName}</span>
              </div>
              <div style={styles.infoRow} className="payslip-info-row">
                <span style={styles.infoLabel}>Department:</span>
                <span style={styles.infoValue}>{employeeData.department || 'N/A'}</span>
              </div>
              <div style={styles.infoRow} className="payslip-info-row">
                <span style={styles.infoLabel}>Designation:</span>
                <span style={styles.infoValue}>{employeeData.designation || 'N/A'}</span>
              </div>
            </div>
          )}

          <div style={styles.formSection} className="payslip-form-section">
            <h3 style={styles.sectionTitle} className="payslip-section-title">
              <FaCalendarAlt />
              Select Pay Period
            </h3>

            {availablePeriods.length === 0 ? (
              <div style={styles.noData}>
                No salary records available yet. Please contact HR.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={styles.inputGroup} className="payslip-input-group">
                    <label style={styles.label}>Month:</label>
                    <select
                      style={styles.select}
                      className="payslip-select"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="">Select Month</option>
                      {availablePeriods.map((period, idx) => (
                        <option key={idx} value={period.monthNumber}>
                          {period.month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.inputGroup} className="payslip-input-group">
                    <label style={styles.label}>Year:</label>
                    <select
                      style={styles.select}
                      className="payslip-select"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="">Select Year</option>
                      {[...new Set(availablePeriods.map(p => p.year))].map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  style={{
                    ...styles.generateBtn,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  className="payslip-generate-btn"
                  onClick={generatePayslip}
                  disabled={loading}
                >
                  <FaFileInvoiceDollar />
                  {loading ? 'Generating...' : 'Generate Salary Slip'}
                </button>
              </>
            )}
          </div>

          {/* Salary Slip History */}
          <div style={styles.historySection} className="payslip-history-section">
            <h3 style={styles.sectionTitle} className="payslip-section-title">
              <FaFileInvoiceDollar />
              Your Salary Slips
            </h3>

            {existingSlips.length === 0 ? (
              <div style={styles.noData}>
                No salary slips generated yet. Generate your first slip above!
              </div>
            ) : (
              <div style={styles.slipsContainer}>
                <div style={styles.slipsGrid} className="payslip-slips-grid">
                  {existingSlips.map((slip) => (
                    <div
                      key={slip._id}
                      style={styles.slipCard}
                      className="payslip-card"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = styles.slipCardHover.boxShadow;
                        e.currentTarget.style.borderColor = styles.slipCardHover.borderColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = styles.slipCard.boxShadow;
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    >
                      <div style={styles.slipCardHeader} className="payslip-card-header">
                        <div style={styles.slipPeriod} className="payslip-period">
                          <FaCalendarAlt style={{ color: '#007bff', fontSize: '1.3rem' }} />
                          <span style={styles.monthYear} className="payslip-month-year">{getMonthName(slip.month)}</span>
                        </div>
                        <span style={styles.yearBadge} className="payslip-year-badge">{slip.year}</span>
                      </div>

                      <div style={styles.slipCardContent}>
                        <div style={styles.slipInfo}>
                          <span style={{ fontWeight: '600', color: '#333' }}>Generated On:</span>
                          <span>{new Date(slip.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      <div style={styles.slipActions} className="payslip-actions">
                        <button
                          style={{
                            ...styles.actionBtn,
                            ...styles.viewBtn,
                            opacity: loadingSlipId === `view-${slip._id}` ? 0.7 : 1,
                            cursor: loadingSlipId === `view-${slip._id}` ? 'not-allowed' : 'pointer',
                          }}
                          className="payslip-action-btn"
                          onMouseEnter={(e) => {
                            if (loadingSlipId !== `view-${slip._id}`) {
                              e.target.style.backgroundColor = styles.viewBtnHover.backgroundColor;
                            }
                          }}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = styles.viewBtn.backgroundColor)}
                          onClick={() => handleView(slip)}
                          disabled={loadingSlipId === `view-${slip._id}`}
                          title="View PDF"
                        >
                          {loadingSlipId === `view-${slip._id}` ? (
                            <>
                              <LoadingSpinner /> Viewing...
                            </>
                          ) : (
                            <>
                              <FaEye /> View
                            </>
                          )}
                        </button>
                        <button
                          style={{
                            ...styles.actionBtn,
                            ...styles.downloadBtn,
                            opacity: loadingSlipId === `download-${slip._id}` ? 0.7 : 1,
                            cursor: loadingSlipId === `download-${slip._id}` ? 'not-allowed' : 'pointer',
                          }}
                          className="payslip-action-btn"
                          onMouseEnter={(e) => {
                            if (loadingSlipId !== `download-${slip._id}`) {
                              e.target.style.backgroundColor = styles.downloadBtnHover.backgroundColor;
                            }
                          }}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = styles.downloadBtn.backgroundColor)}
                          onClick={() => handleDownload(slip)}
                          disabled={loadingSlipId === `download-${slip._id}`}
                          title="Download PDF"
                        >
                          {loadingSlipId === `download-${slip._id}` ? (
                            <>
                              <LoadingSpinner /> Downloading...
                            </>
                          ) : (
                            <>
                              <FaDownload /> Download
                            </>
                          )}
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          className="payslip-action-btn"
                          onMouseEnter={(e) => (e.target.style.backgroundColor = styles.deleteBtnHover.backgroundColor)}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = styles.deleteBtn.backgroundColor)}
                          onClick={() => handleDelete(slip)}
                          title="Delete Slip"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeePayslip;
