import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../api/axios';
import AnnouncementModal from './AnnouncementModal';
import './notifications.css';

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterAudience, setFilterAudience] = useState('all');

  const role = useMemo(() => localStorage.getItem('role') || 'employee', []);
  const canPublish = ['admin', 'superadmin', 'hrms_handler', 'super_admin', 'hod', 'director'].includes(role);

  /* =========================
     FETCH NOTIFICATIONS
  ========================= */
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/notifications');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  /* =========================
     DELETE NOTIFICATION
  ========================= */
  const handleDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this notification?');
    if (!ok) return;

    try {
      await axios.delete(`/notifications/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  /* =========================
     DELETE PERMISSION (UI)
     MUST MATCH BACKEND RULES
  ========================= */
  const canDelete = (n) => {
    if (role === 'super_admin') return true;

    switch (n.createdByRole) {
      case 'hrms_handler':
        return role === 'hrms_handler';

      case 'director':
        return ['director', 'hrms_handler'].includes(role);

      case 'hod':
        return ['hod', 'director', 'hrms_handler'].includes(role);

      default:
        return false; // employee / unknown
    }
  };

  const filteredItems = useMemo(() => {
    if (filterAudience === 'all') return items;
    return items.filter(item => item.audience === filterAudience);
  }, [items, filterAudience]);

  /* =========================
     BADGES
  ========================= */
  const getRoleBadgeStyle = (role) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-block',
    };

    switch (role) {
      case 'hrms_handler':
      case 'super_admin':
      case 'admin':
      case 'superadmin':
        return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
      case 'hod':
        return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
      case 'director':
        return { ...baseStyle, backgroundColor: '#cce5ff', color: '#004085' };
      default:
        return { ...baseStyle, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  const getAudienceBadgeStyle = (audience) => {
    const baseStyle = {
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    };

    switch (audience) {
      case 'all':
        return { ...baseStyle, backgroundColor: '#e6f0ff', color: '#3f51b5' };
      case 'team':
        return { ...baseStyle, backgroundColor: '#fff3e0', color: '#e65100' };
      case 'department':
        return { ...baseStyle, backgroundColor: '#f3e5f5', color: '#7b1fa2' };
      case 'individual':
        return { ...baseStyle, backgroundColor: '#e8f5e9', color: '#2e7d32' };
      default:
        return { ...baseStyle, backgroundColor: '#f5f5f5', color: '#616161' };
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>📬 Notifications Center</h1>
        <p style={styles.subtitle}>
          {role === 'employee' || role === 'hr-employee'
            ? 'Stay updated with announcements from management'
            : 'View and manage notifications for your team'}
        </p>
      </div>

      <div className="notification-wrapper">
        <div className="notification-panel">
          <div className="notification-header">
            <div style={styles.headerContent}>
              <div className="notification-title">All Notifications</div>

              {items.length > 0 && (
                <div style={styles.filterContainer}>
                  <label htmlFor="filter" style={styles.filterLabel}>Filter:</label>
                  <select
                    id="filter"
                    value={filterAudience}
                    onChange={(e) => setFilterAudience(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All</option>
                    <option value="team">Team</option>
                    <option value="department">Department</option>
                    <option value="individual">Personal</option>
                  </select>
                </div>
              )}
            </div>

            <div className="notification-actions">
              {canPublish && (
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  ➕ Send Notification
                </button>
              )}
              <button className="btn btn-muted" onClick={fetchItems} disabled={loading}>
                {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          <div className="notification-list" style={styles.notificationList}>
            {loading && (
              <div style={styles.loadingState}>
                <div style={styles.spinner}></div>
                <p>Loading notifications...</p>
              </div>
            )}

            {!loading && filteredItems.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <h3 style={styles.emptyTitle}>No notifications</h3>
                <p style={styles.emptyText}>You are all caught up</p>
              </div>
            )}

            {!loading && filteredItems.map((n) => (
              <div key={n._id} style={styles.notificationItem}>
                <div style={styles.notificationHeader}>
                  <div style={styles.itemTitle}>{n.title}</div>
                  <span style={getAudienceBadgeStyle(n.audience)}>
                    {n.audience || 'ALL'}
                  </span>
                </div>

                <p style={styles.itemMessage}>{n.message}</p>

                <div style={styles.notificationFooter}>
                  <div style={styles.itemMeta}>
                    📅 {new Date(n.createdAt).toLocaleString()}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {n.createdBy && (
                      <span style={getRoleBadgeStyle(n.createdByRole)}>
                        {n.createdBy.username} ({n.createdByRole.replace('_', ' ').toUpperCase()})
                      </span>
                    )}

                    {canDelete(n) && (
                      <button
                        onClick={() => handleDelete(n._id)}
                        style={{
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnnouncementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchItems}
      />
    </div>
  );
};

const styles = {
  /* =========================
     PAGE
  ========================= */
  pageContainer: {
    paddingTop: '80px',
    paddingBottom: '2rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  header: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: '2rem',
    padding: '0 1rem',
  },

  pageTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },

  subtitle: {
    fontSize: '1.1rem',
    opacity: 0.95,
    margin: 0,
  },

  /* =========================
     HEADER / FILTER
  ========================= */
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },

  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#495057',
  },

  filterSelect: {
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    background: '#fff',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },

  /* =========================
     LIST / CARD
  ========================= */
  notificationList: {
    maxHeight: '600px',
    overflowY: 'auto',
  },

  notificationItem: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },

  notificationContent: {
    width: '100%',
  },

  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
    gap: '1rem',
  },

  itemTitle: {
    flex: 1,
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#212529',
  },

  badges: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
  },

  itemMessage: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#495057',
    marginTop: '0.25rem',
  },

  /* =========================
     FOOTER
  ========================= */
  notificationFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.75rem',
    gap: '1rem',
    flexWrap: 'wrap',
  },

  itemMeta: {
    fontSize: '0.85rem',
    color: '#6c757d',
  },

  createdBy: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
  },

  createdByLabel: {
    color: '#6c757d',
    fontWeight: '600',
  },

  /* =========================
     DELETE BUTTON (NEW)
  ========================= */
  deleteButton: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },

  /* =========================
     STATES
  ========================= */
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    color: '#6c757d',
  },

  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3f51b5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },

  emptyState: {
    padding: '3rem 1.5rem',
    textAlign: 'center',
  },

  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },

  emptyTitle: {
    color: '#495057',
    fontSize: '1.3rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
  },

  emptyText: {
    color: '#6c757d',
    fontSize: '1rem',
    margin: 0,
  },
};

export default NotificationsPage;