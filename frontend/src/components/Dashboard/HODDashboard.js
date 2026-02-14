import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: {
    padding: '1.2rem',
    paddingTop: '80px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: 'linear-gradient(to right, #e9efff, #f6f8ff)',
    minHeight: '100vh',
    position: 'relative',
    overflowX: 'hidden',
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
    maxWidth: '1100px',
    margin: '0 auto',
  },
  headerBox: {
    textAlign: 'center',
    marginBottom: '2.2rem',
  },
  roleText: {
    fontSize: '0.9rem',
    color: '#666',
    letterSpacing: '1px',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#000',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.4rem',
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '2rem 1.6rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
    border: '1px solid rgba(0,0,0,0.04)',
    minHeight: '210px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cardActive: {
    transform: 'scale(0.97)',
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    margin: '0 auto 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.2rem',
    background: 'linear-gradient(135deg, #3f51b5, #5a55ae)',
    color: '#fff',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '0.4rem',
    color: '#2d3748',
  },
  cardText: {
    fontSize: '0.9rem',
    color: '#666',
    lineHeight: '1.45',
  },
};

const HODDashboard = () => {
  const navigate = useNavigate();
  const [hodName, setHodName] = useState('');
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    setHodName(
      localStorage.getItem('displayName') ||
      localStorage.getItem('name') ||
      'HOD'
    );
  }, []);

  const cards = [
    {
      title: 'Employee Info',
      text: 'View and manage team member details.',
      icon: '👥',
      route: '/employee-info',
    },
    {
      title: 'Employee Activity',
      text: 'Track attendance and daily activities.',
      icon: '📊',
      route: '/employee-activity',
    },
    {
      title: 'Leave Approvals',
      text: 'Approve or reject employee leave requests.',
      icon: '✅',
      route: '/hr-leave-requests',
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern}></div>

      <div style={styles.contentWrapper}>
        {/* Welcome */}
        <div style={styles.headerBox}>
          <div style={styles.roleText}>Head of Department</div>
          <div style={styles.nameText}>Hello, {hodName}</div>
        </div>

        {/* Action Cards */}
        <div style={styles.cardGrid}>
          {cards.map((card, index) => (
            <div
              key={index}
              style={{
                ...styles.card,
                ...(activeIndex === index ? styles.cardActive : {}),
              }}
              onTouchStart={() => setActiveIndex(index)}
              onTouchEnd={() => {
                setActiveIndex(null);
                navigate(card.route);
              }}
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

export default HODDashboard;
