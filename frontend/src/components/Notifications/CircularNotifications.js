import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../../api/axios';

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '2rem 0 3rem',
  },
  circle: {
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)',
    boxShadow: '0 10px 30px rgba(40,167,69,0.25), 0 0 0 1px rgba(255,255,255,0.6) inset',
    border: '6px solid rgba(40,167,69,0.3)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    inset: '10px',
    borderRadius: '50%',
    border: '2px dashed rgba(32,201,151,0.45)',
    pointerEvents: 'none',
  },
  header: {
    position: 'absolute',
    top: '14px',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: 800,
    color: '#155724',
    fontSize: '0.9rem',
    letterSpacing: '1px',
  },
  list: {
    width: '80%',
    height: '60%',
    overflow: 'hidden',
    position: 'relative',
  },
  item: {
    position: 'absolute',
    left: 0,
    width: '100%',
    transition: 'transform 0.6s ease, opacity 0.6s ease',
    textAlign: 'center',
  },
  title: { fontWeight: 700, color: '#1e7e34', marginBottom: '0.25rem' },
  message: { color: '#495057', fontSize: '0.95rem', lineHeight: 1.4 },
  footer: {
    position: 'absolute',
    bottom: '12px',
    fontSize: '0.75rem',
    color: '#6c757d',
  },
  dots: {
    position: 'absolute',
    bottom: '8px',
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#c3e6cb',
  },
  dotActive: { background: '#28a745' },
};

const CircularNotifications = () => {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  const visible = useMemo(() => (items.length > 0 ? items.slice(0, 6) : []), [items]);

  const fetchData = async () => {
    try {
      const res = await axios.get('/notifications');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setItems([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!visible.length) return;
    timer.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % visible.length);
    }, 3000);
    return () => clearInterval(timer.current);
  }, [visible.length]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.circle}>
        <div style={styles.ring} />
        <div style={styles.header}>Notifications</div>
        <div style={styles.list}>
          {visible.map((n, i) => {
            const pos = i === index ? 0 : i === (index + 1) % visible.length ? 120 : -120;
            const opacity = i === index ? 1 : 0;
            return (
              <div key={n._id || i} style={{ ...styles.item, transform: `translateY(${pos}%)`, opacity }}>
                <div style={styles.title}>{n.title}</div>
                <div style={styles.message}>{n.message}</div>
              </div>
            );
          })}
          {!visible.length && (
            <div style={{ ...styles.item, transform: 'translateY(0%)', opacity: 1 }}>
              <div style={styles.title}>No notifications</div>
              <div style={styles.message}>You are all caught up.</div>
            </div>
          )}
        </div>
        <div style={styles.footer}>From HR Admin / Super Admin</div>
        <div style={styles.dots}>
          {(visible.length ? visible : [1]).map((_, i) => (
            <div key={i} style={{ ...styles.dot, ...(i === index ? styles.dotActive : {}) }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CircularNotifications;
