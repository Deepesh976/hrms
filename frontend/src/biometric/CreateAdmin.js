import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from '../api/axios';

const spinnerStyle = {
  display: 'block',
  margin: '2rem auto',
  width: '48px',
  height: '48px',
  border: '6px solid #ccc',
  borderTop: '6px solid #0059b3',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const styles = {
  pageWrapper: {
    maxWidth: '1000px',
    margin: '4rem auto',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  tableContainer: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  heading: {
    fontSize: '1.8rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#003366',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '.5rem',
    color: '#333',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '.75rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#0059b3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '600',
    marginTop: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  },
  th: {
    borderBottom: '2px solid #ccc',
    padding: '0.75rem',
    textAlign: 'left',
    backgroundColor: '#f5f5f5',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #e0e0e0',
  },
  actionButton: {
    marginRight: '0.5rem',
    padding: '0.4rem 0.8rem',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
    color: '#fff',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: '1.5rem',
    fontSize: '1.2rem',
    fontWeight: '500',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
  }
};

const CreateAdmin = () => {
  const [adminData, setAdminData] = useState({ email: '', password: '' });
  const [adminList, setAdminList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const expiry = Number(localStorage.getItem('expiry')) || 0;

    if (!token || !role || Date.now() > expiry) {
      toast.error('Session expired. Please log in again.');
      localStorage.clear();
      window.location.replace('/');
      return;
    }

    // 🔒 Only super_admin allowed
    if (role !== 'super_admin') {
      toast.error('Access denied. Super Admin only.');
      window.location.replace('/dashboard');
      return;
    }

    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAdminList(Array.isArray(res.data) ? res.data : res.data.admins || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch HR Admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = adminData;

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await axios.post('/admin/create', { email, password }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('HR Admin added!');
      setAdminData({ email: '', password: '' });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding HR Admin');
    }
  };

  const confirmDelete = (id) => {
    setSelectedAdminId(id);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/admin/${selectedAdminId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('HR Admin deleted!');
      fetchAdmins();
    } catch {
      toast.error('Error deleting HR Admin');
    } finally {
      setShowModal(false);
      setSelectedAdminId(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={styles.pageWrapper}>
      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>

      <div style={styles.formContainer}>
        <h2 style={styles.heading}>Create New HR Admin</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              value={adminData.email}
              onChange={handleChange}
            />
          </div>
<div style={styles.formGroup}>
  <label htmlFor="password" style={styles.label}>Password</label>

  <div style={{ position: 'relative' }}>
    <input
      style={{
        ...styles.input,
        paddingRight: '4rem', // space for button
      }}
      type={showPassword ? 'text' : 'password'}
      id="password"
      name="password"
      value={adminData.password}
      onChange={handleChange}
    />

    <button
      type="button"
      onClick={() => setShowPassword(prev => !prev)}
      style={{
        position: 'absolute',
        right: '0.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#0059b3',
        fontWeight: '600',
        cursor: 'pointer',
      }}
    >
      {showPassword ? 'Hide' : 'Show'}
    </button>
  </div>
</div>

          <button type="submit" style={styles.button}>Create HR Admin</button>
        </form>
      </div>

      <div style={styles.tableContainer}>
        <h2 style={styles.heading}>View HR Admins</h2>
        {loading ? (
          <div style={spinnerStyle}></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>S.No</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminList.length === 0 ? (
                <tr>
                  <td colSpan="4" align="center">No HR Admins found</td>
                </tr>
              ) : (
                adminList.map((admin, index) => (
                  <tr key={admin._id}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{admin.email}</td>
                    <td style={styles.td}>{admin.role}</td>
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.actionButton, ...styles.deleteBtn }}
                        onClick={() => confirmDelete(admin._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <p style={styles.modalText}>Are you sure you want to delete this admin?</p>
            <div style={styles.modalActions}>
              <button
                style={{ ...styles.button, backgroundColor: '#dc3545' }}
                onClick={handleDeleteConfirm}
              >
                Yes, Delete
              </button>
              <button
                style={{ ...styles.button, backgroundColor: '#6c757d' }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default CreateAdmin;
