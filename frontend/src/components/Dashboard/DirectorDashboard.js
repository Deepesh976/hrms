import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../Navbar/adminnavbar';
import SuperNavbar from '../Navbar/supernavbar';
import DirectorNavbar from '../Navbar/directornavbar';
import NotificationsPanel from '../Notifications/NotificationsPanel';

const styles = {
  container: {
    padding: '2rem',
    paddingTop: '90px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: 'linear-gradient(to right, #e9efff, #f6f8ff)',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(63, 81, 181, 0.18) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(90, 85, 174, 0.12) 0%, transparent 50%)
    `,
    zIndex: 1,
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerBox: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  biometricTitle: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: '0.5rem',
    letterSpacing: '3px',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: '2.3rem',
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: '0.75rem',
    lineHeight: '1.2',
  },
  headerSubtitle: {
    fontSize: '1rem',
    color: '#4a5568',
    fontWeight: '400',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto',
  },
  notificationsCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    padding: '1.5rem 1.5rem 1.25rem',
    borderRadius: '20px',
    boxShadow: `
      0 24px 48px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(255, 255, 255, 0.7)
    `,
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
  notificationsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.75rem',
  },
  notificationsTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1f2933',
  },
  notificationsSub: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
};

const HODDashboard = () => {
  const navigate = useNavigate();

  // ✅ Read from localStorage
  const role = localStorage.getItem('role');
  const name =
    localStorage.getItem('name') ||
    localStorage.getItem('username') ||
    'HOD';

  const department =
    localStorage.getItem('department') || 'your department';

  // ✅ Navbar based on role
  const renderNavbar = () => {
    return <DirectorNavbar />;
    // if (role === 'superadmin' || role === 'super_admin') {
    //   return <SuperNavbar />;
    // }
    // return <AdminNavbar />;
  };

  return (
    <>
      {renderNavbar()}

      <div style={styles.container}>
        <div style={styles.backgroundPattern} />

        <div style={styles.contentWrapper}>
          {/* Header */}
          <div style={styles.headerBox}>
            <div style={styles.biometricTitle}>
              Head of Department Panel
            </div>

            <h1 style={styles.headerTitle}>
              Hello, {name}
            </h1>

            <p style={styles.headerSubtitle}>
              You are viewing notifications and important updates for the{' '}
              <strong>{department}</strong>.
            </p>
          </div>

          {/* Notifications */}
          <div style={styles.notificationsCard}>
            <div style={styles.notificationsHeader}>
              <h2 style={styles.notificationsTitle}>
                Notifications
              </h2>
              <span style={styles.notificationsSub}>
                Latest alerts & updates for your department
              </span>
            </div>

            <NotificationsPanel />
          </div>
        </div>
      </div>
    </>
  );
};

export default HODDashboard;
