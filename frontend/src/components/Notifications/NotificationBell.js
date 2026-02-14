import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

const NotificationBell = () => {
  const [count, setCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const navigate = useNavigate();

  /* =========================
     FETCH UNREAD COUNT
  ========================= */
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('/notifications/unread-count');
      const newCount = res.data?.count || 0;

      // Get last viewed time
      const lastViewed = Number(localStorage.getItem('notificationsLastViewed')) || 0;

      // If user never opened notifications OR new notifications exist
      if (newCount > 0 && Date.now() > lastViewed) {
        setCount(newCount);
        setShowBadge(true);
      } else {
        setCount(0);
        setShowBadge(false);
      }

    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setCount(0);
        setShowBadge(false);
      }
    }
  };

  /* =========================
     INIT & POLLING
  ========================= */
  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    const handleStorageChange = () => fetchUnreadCount();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /* =========================
     CLICK → MARK AS VIEWED
  ========================= */
  const handleClick = () => {
    // Mark notifications as viewed
    localStorage.setItem('notificationsLastViewed', Date.now().toString());

    // Clear badge immediately
    setCount(0);
    setShowBadge(false);

    navigate('/notifications');
  };

  /* =========================
     STYLES
  ========================= */
  const styles = {
    container: {
      position: 'relative',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '50%',
      transition: 'background-color 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
    },
    containerHover: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    bell: {
      fontSize: '24px',
      color: '#fff',
    },
    badge: {
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      backgroundColor: '#ff4444',
      color: '#fff',
      borderRadius: '50%',
      minWidth: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '700',
      padding: '0 5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      animation: 'pulse 2s infinite',
    },
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.container,
        ...(isHovered ? styles.containerHover : {}),
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="View Notifications"
      role="button"
      aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span style={styles.bell}>🔔</span>

      {showBadge && (
        <div style={styles.badge}>
          {count > 99 ? '99+' : count}
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationBell;
