import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUserCheck,
  FaMoneyBillWave,
  FaDownload,
  FaFileInvoiceDollar // ✅ Added missing icon import
} from 'react-icons/fa';
import AdminNavbar from '../Navbar/adminnavbar';
import SuperNavbar from '../Navbar/supernavbar';
import NotificationsPanel from '../Notifications/NotificationsPanel';
import './dashboard.css';

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
      radial-gradient(circle at 20% 80%, rgba(0, 123, 255, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(0, 123, 255, 0.15) 0%, transparent 50%)
    `,
    zIndex: 1,
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  headerBox: {
    textAlign: 'center',
    marginBottom: '4rem',
    position: 'relative',
  },
  biometricTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#000',
    marginBottom: '1rem',
    letterSpacing: '3px',
    textTransform: 'uppercase'
  },
  headerTitle: {
    fontSize: '2.4rem',
    fontWeight: '800',
    color: '#000',
    marginBottom: '1rem',
    textShadow: 'none',
    background: 'none',
    WebkitBackgroundClip: 'initial',
    WebkitTextFillColor: '#000',
    backgroundClip: 'initial',
    lineHeight: '1.2',
  },
  headerSubtitle: {
    fontSize: '1.3rem',
    color: '#000',
    fontWeight: '300',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    boxShadow: `
      0 25px 50px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.3)
    `,
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  icon: {
    fontSize: '3.5rem',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '5.5rem',
    height: '5.5rem',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
    margin: '0 auto',
    boxShadow: '0 15px 35px rgba(0, 123, 255, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  },
  emojiIcon: {
    fontSize: '2.2rem',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: '1.3',
    marginBottom: '0.5rem',
  },
  cardText: {
    fontSize: '1.1rem',
    color: '#718096',
    lineHeight: '1.6',
    fontWeight: '400',
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  // Dynamic styling based on role
  const getThemeStyles = () => {
    if (role === 'superadmin') {
      return {
        gradient: 'linear-gradient(to right, #e9efff, #f6f8ff)',
        cardGradient: 'linear-gradient(135deg, #3f51b5, #5a55ae)',
        shadowColor: 'rgba(63, 81, 181, 0.35)',
        titleGradient: 'linear-gradient(45deg, #ffffff, rgba(255,255,255,0.9))',
        backgroundPattern: `
          radial-gradient(circle at 20% 80%, rgba(63, 81, 181, 0.18) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(90, 85, 174, 0.12) 0%, transparent 50%)
        `,
      };
    }
    return {
      gradient: 'linear-gradient(to right, #e9efff, #f6f8ff)',
      cardGradient: 'linear-gradient(135deg, #3f51b5, #5a55ae)',
      shadowColor: 'rgba(63, 81, 181, 0.35)',
      titleGradient: 'linear-gradient(45deg, #ffffff, rgba(255,255,255,0.9))',
      backgroundPattern: `
        radial-gradient(circle at 20% 80%, rgba(63, 81, 181, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(90, 85, 174, 0.12) 0%, transparent 50%)
      `,
    };
  };

  const themeStyles = getThemeStyles();

  const allCards = [
    {
      title: 'Employee Info',
      text: 'View and manage employee profiles.',
      icon: '👥',
      route: '/employee-info',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Add Employee',
      text: 'Add new employee records.',
      icon: '➕',
      route: '/add-employee-info',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Salary Info',
      text: 'Every detail of salary structure with actions.',
      icon: '💵',
      route: '/employee-salary-info',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Generate Slips',
      text: 'Generate salary slips quickly.',
      icon: '🧾',
      route: '/generate-slip',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Download Slips',
      text: 'Download salary slips securely.',
      icon: '⬇️',
      route: '/salary-slip',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Assets',
      text: 'Manage issued items for employees.',
      icon: '📦',
      route: '/hr-assets',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Leave Calendar',
      text: 'Edit department-wise leaves & holidays.',
      icon: '📅',
      route: '/hr-leave-calendar',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Leave Requests',
      text: 'Approve/Reject with comments (incl. half-days).',
      icon: '✅',
      route: '/hr-leave-requests',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Employee Activity',
      text: 'Track employee attendance and activities.',
      icon: '🕒',
      route: '/employee-activity',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Input Data Upload',
      text: 'Upload and process timesheet/input data.',
      icon: '📥',
      route: '/input-data',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Create HR Admin',
      text: 'Manage HR Admin accounts.',
      icon: '👑',
      route: '/create-admin',
      roles: ['superadmin'],
    },
    {
      title: 'Manage HODs',
      text: 'Create and manage Head of Departments.',
      icon: '👔',
      route: '/manage-hods',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Manage Directors',
      text: 'Create and manage Directors.',
      icon: '🎯',
      route: '/manage-directors',
      roles: ['admin', 'superadmin'],
    },
    {
      title: 'Profile',
      text: 'View and edit your profile.',
      icon: '👤',
      route: '/profile',
      roles: ['admin', 'superadmin'],
    },
  ];

  const visibleCards = role === 'superadmin' ? allCards : allCards.filter((card) => card.roles.includes(role));

  const renderNavbar = () => {
    if (role === 'superadmin') return <SuperNavbar />;
    if (role === 'admin') return <AdminNavbar />;
    return null;
  };

  return (
    <>
      {renderNavbar()}
      <div style={{
        ...styles.container,
        background: themeStyles.gradient
      }}>
        <div style={{
          ...styles.backgroundPattern,
          background: themeStyles.backgroundPattern
        }}></div>
        <div style={styles.contentWrapper}>
          <div style={styles.headerBox}>
            <div style={styles.biometricTitle}>
              {role === 'superadmin' ? 'Enterprise System' : 'Management System'}
            </div>
            <h1 style={styles.headerTitle}>
              {role === 'superadmin' ? 'SuperAdmin Dashboard' : 'HR Admin Dashboard'}
            </h1>
            <p style={styles.headerSubtitle}>
              {role === 'superadmin'
                ? 'Your comprehensive enterprise management and oversight system'
                : 'Your centralized attendance and employee management system'
              }
            </p>
          </div>

          <NotificationsPanel />

          <div className="dashboard-grid" style={styles.cardGrid}>
            {visibleCards.map((card, index) => (
              <div
                key={index}
                className="dashboard-card"
                style={styles.card}
                onClick={() => navigate(card.route)}
              >
                <div className="dashboard-card-icon" style={styles.icon}>
                  <span className="dashboard-card-emoji" style={styles.emojiIcon}>
                    {card.icon}
                  </span>
                </div>
                <h3 className="dashboard-card-title" style={styles.cardTitle}>
                  {card.title}
                </h3>
                <p className="dashboard-card-text" style={styles.cardText}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
