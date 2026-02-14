import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: '#fff',
    padding: '2.5rem 2rem',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '720px',
  },
  header: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#343a40',
    marginBottom: '1.4rem',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#212529',
    margin: '2rem 0 1rem',
  },
  infoText: {
    textAlign: 'center',
    marginBottom: '1.2rem',
    color: '#6c757d',
    fontSize: '0.95rem',
  },
  formGroup: {
    marginBottom: '1.2rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.35rem',
    fontWeight: '600',
    color: '#495057',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #ced4da',
    fontSize: '0.95rem',
  },
  readOnly: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
    cursor: 'not-allowed',
  },
  toggleButton: {
    position: 'absolute',
    top: '50%',
    right: '1rem',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#007bff',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '0.9rem',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    marginTop: '1.2rem',
  },
  submitDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  divider: {
    margin: '2.2rem 0',
    borderTop: '1px solid #dee2e6',
  },
};

const Profile = () => {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  const [loginId, setLoginId] = useState('');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= LOGIN ID ================= */
  useEffect(() => {
    const username = localStorage.getItem('username');
    const phone = localStorage.getItem('phone');
    setLoginId(phone || username || '');
  }, []);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/employees/me');
        setEmployee(res.data || null);
      } catch (err) {
        setProfileError(true);
        toast.error(
          err.response?.data?.message || 'Failed to load employee details'
        );
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const redirectAfterChange = () => {
    const role = localStorage.getItem('role');

    switch (role) {
      case 'director':
        navigate('/director-dashboard', { replace: true });
        break;
      case 'hod':
        navigate('/hod-dashboard', { replace: true });
        break;
      case 'employee':
        navigate('/employee-dashboard', { replace: true });
        break;
      default:
        navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      setLoading(true);
      await axios.put('/auth/password', { newPassword: form.password });

      toast.success('Password updated successfully');
      localStorage.setItem('mustChangePassword', 'false');

      setTimeout(redirectAfterChange, 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <ToastContainer position="top-center" autoClose={3000} />

      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.header}>My Profile</h2>

        <p style={styles.infoText}>
          Profile details are managed by HR. For any corrections, please contact HR.
        </p>

        {/* ================= PROFILE ================= */}
        {profileLoading && <p style={{ textAlign: 'center' }}>Loading profile…</p>}

        {!profileLoading && profileError && (
          <p style={{ textAlign: 'center', color: '#dc3545' }}>
            Unable to load profile details.
          </p>
        )}

        {!profileLoading && employee && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Employee Name</label>
              <input value={employee.empName || ''} readOnly style={{ ...styles.input, ...styles.readOnly }} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Employee ID</label>
              <input value={employee.empId || ''} readOnly style={{ ...styles.input, ...styles.readOnly }} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Department</label>
              <input value={employee.department || ''} readOnly style={{ ...styles.input, ...styles.readOnly }} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Designation</label>
              <input value={employee.designation || ''} readOnly style={{ ...styles.input, ...styles.readOnly }} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contact No</label>
              <input value={employee.contactNo || ''} readOnly style={{ ...styles.input, ...styles.readOnly }} />
            </div>
          </>
        )}

        <div style={styles.divider} />

        {/* ================= PASSWORD ================= */}
        <h3 style={styles.sectionHeader}>Change Password</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Login ID</label>
          <input value={loginId} readOnly style={{ ...styles.input, ...styles.readOnly }} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>New Password</label>
          <div style={styles.inputWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={styles.input}
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={styles.toggleButton}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Confirm Password</label>
          <div style={styles.inputWrapper}>
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              style={styles.input}
              disabled={loading}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} style={styles.toggleButton}>
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.submitBtn, ...(loading ? styles.submitDisabled : {}) }}
        >
          {loading ? 'Updating Password…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
