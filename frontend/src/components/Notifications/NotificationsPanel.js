import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../api/axios';
import AnnouncementModal from './AnnouncementModal';
import './notifications.css';

const NotificationsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const role = useMemo(() => localStorage.getItem('role') || 'employee', []);
  const isPublisher = role === 'admin' || role === 'superadmin';

  const [empContext, setEmpContext] = useState({ department: '', employeeId: '' });

  useEffect(() => {
    const initEmployeeContext = async () => {
      if (!(role === 'employee' || role === 'hr-employee')) return setEmpContext({ department: '', employeeId: '' });
      try {
        const empIdLocal = (localStorage.getItem('empId') || '').toLowerCase();
        const res = await axios.get('/employees');
        const list = Array.isArray(res.data) ? res.data : [];
        const me = list.find((e) => (e.empId || '').toLowerCase() === empIdLocal);
        if (me) setEmpContext({ department: me.department || '', employeeId: me._id || '' });
      } catch {
        setEmpContext({ department: '', employeeId: '' });
      }
    };
    initEmployeeContext();
  }, [role]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (empContext.department) params.department = empContext.department;
      if (empContext.employeeId) params.employeeId = empContext.employeeId;
      const res = await axios.get('/notifications', { params });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [empContext.department, empContext.employeeId]);

  return (
    <div className="notification-wrapper">
      <div className="notification-panel">
        <div className="notification-header">
          <div className="notification-title">Notifications</div>
          <div className="notification-actions">
            {isPublisher && (
              <button className="btn btn-muted" onClick={() => setShowModal(true)}>Add Announcement</button>
            )}
            <button className="btn btn-primary" onClick={fetchItems} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="notification-list">
          {items.length === 0 && <div className="notification-empty">No notifications</div>}
          {items.map((n) => (
            <div key={n._id} className="notification-item">
              <div>
                <div className="notification-item-title">{n.title}</div>
                <p className="notification-item-message">{n.message}</p>
                <div className="notification-item-meta">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <div className="notification-tag">
                <span>{(n.audience || 'all').toUpperCase()}</span>
              </div>
            </div>
          ))}
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

export default NotificationsPanel;
