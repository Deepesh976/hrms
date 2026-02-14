import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    inset: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(63, 81, 181, 0.18) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 50%)
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
  welcomeText: {
    fontSize: '1.1rem',
    color: '#555',
    letterSpacing: '1px',
    marginBottom: '0.5rem',
  },
  nameText: {
    fontSize: '2.4rem',
    fontWeight: '800',
    color: '#000',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: '22px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  cardHover: {
    transform: 'translateY(-6px)',
    boxShadow: '0 20px 45px rgba(0,0,0,0.15)',
  },
  iconBox: {
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    margin: '0 auto 1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.4rem',
    background: 'linear-gradient(135deg, #3f51b5, #5a55ae)',
    color: '#fff',
  },
  cardTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#2d3748',
  },
  cardText: {
    fontSize: '0.95rem',
    color: '#666',
    lineHeight: '1.5',
  },
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const name = localStorage.getItem('name') || 'Employee';
    setEmployeeName(name);
  }, []);

  const cards = [
    {
      title: 'My Attendance',
      text: 'View and track your daily attendance.',
      icon: '🕐',
      route: '/employee-attendance',
    },
    {
      title: 'Pay Slip',
      text: 'Generate and download your salary slip.',
      icon: '💰',
      route: '/employee-payslip',
    },
    {
      title: 'Leave Request',
      text: 'Apply for leave and track approvals.',
      icon: '📝',
      route: '/employee-leave-request',
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern}></div>

      <div style={styles.contentWrapper}>

        {/* Welcome Section */}
        <div style={styles.headerBox}>
          <div style={styles.welcomeText}>Hello,</div>
          <div style={styles.nameText}>{employeeName}</div>
        </div>

        {/* Quick Action Cards */}
        <div style={styles.cardGrid}>
          {cards.map((card, index) => (
            <div
              key={index}
              style={{
                ...styles.card,
                ...(hovered === index ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => navigate(card.route)}
            >
              <div style={styles.iconBox}>{card.icon}</div>
              <div style={styles.cardTitle}>{card.title}</div>
              <div style={styles.cardText}>{card.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
