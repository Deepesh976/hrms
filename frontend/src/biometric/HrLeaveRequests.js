import React, { useEffect, useState, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from '../api/axios';

const styles = {
  page: {
    maxWidth: 1200,
    margin: '4rem auto',
    padding: '2rem',
    background: '#f7f9fc',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    fontFamily: 'Segoe UI, sans-serif',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#003366',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  toolbar: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  input: {
    padding: '0.55rem 0.9rem',
    borderRadius: 8,
    border: '1.5px solid #ccc',
    fontSize: '0.95rem',
    minWidth: 200,
  },
  select: {
    padding: '0.55rem 0.9rem',
    borderRadius: 8,
    border: '1.5px solid #ccc',
    fontSize: '0.95rem',
  },
  btn: {
    padding: '0.5rem 0.9rem',
    borderRadius: 8,
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
  },
  approveBtn: { background: '#28a745', color: '#fff' },
  rejectBtn: { background: '#dc3545', color: '#fff' },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '0.75rem',
    padding: '0.75rem',
    borderBottom: '1px solid #eef2f7',
  },
  comment: {
    width: '240px',
    padding: '0.45rem 0.6rem',
    borderRadius: 6,
    border: '1.5px solid #ccc',
  },
};

const HrLeaveRequests = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);

  /** 🔐 ROLE CHECK (SAFE) */
  const role = localStorage.getItem('role'); // hod | director | hrms_handler
  const canDecide = role === 'hod' || role === 'director';

  /** 📥 FETCH DATA */
  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = status ? { status } : {};
      const res = await axios.get('/leaves/requests', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [status]);

  /** ✅ APPROVE / ❌ REJECT */
  const decide = async (id, decision) => {
    try {
      const endpoint =
        decision === 'approved'
          ? `/leaves/requests/${id}/approve`
          : `/leaves/requests/${id}/reject`;

      const reviewedBy =
        localStorage.getItem('name') ||
        localStorage.getItem('username') ||
        role?.toUpperCase();

      await axios.put(endpoint, {
        decisionComment:
          comments[id] ||
          (decision === 'approved' ? 'Approved' : 'Rejected'),
        reviewedBy,
      });

      toast.success(`Leave ${decision} successfully`);
      setComments((p) => ({ ...p, [id]: '' }));
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  /** 🔎 FILTER */
  const filtered = useMemo(() => {
    return items.filter((r) => {
      const txt = `${r.empName || ''} ${r.leaveType || ''} ${
        r.reason || ''
      } ${r.department || ''}`.toLowerCase();
      return txt.includes(q.toLowerCase());
    });
  }, [items, q]);

  return (
    <div style={styles.page}>
      <ToastContainer position="top-right" autoClose={3500} />
      <h2 style={styles.heading}>Leave Requests Management</h2>

      <div style={styles.toolbar}>
        <input
          style={styles.input}
          placeholder="Search by employee, type, department..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          style={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          style={{ ...styles.btn, background: '#007bff', color: '#fff' }}
          onClick={fetchItems}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
        Showing {filtered.length} of {items.length} leave requests
      </div>

      <div style={styles.card}>
        {loading && <div style={{ padding: '2rem' }}>Loading…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            No leave requests found
          </div>
        )}

        {!loading &&
          filtered.map((r) => (
            <div key={r._id} style={styles.row}>
              {/* LEFT */}
              <div>
                <div style={{ fontWeight: 800, color: '#1e7e34' }}>
                  {r.empName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {r.department}
                </div>
                <div>
                  <strong>{r.leaveTypeName || r.leaveType}</strong> (
                  {r.totalDays} days)
                </div>
                <div>
                  <strong>Reason:</strong> {r.reason}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {new Date(r.startDate).toLocaleDateString()} →{' '}
                  {new Date(r.endDate).toLocaleDateString()}
                </div>

                {r.decisionComment && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: '0.85rem',
                      background: '#f8f9fa',
                      padding: 6,
                      borderRadius: 4,
                    }}
                  >
                    <strong>Decision:</strong> {r.decisionComment}
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 6,
                    color:
                      r.status === 'approved'
                        ? '#28a745'
                        : r.status === 'rejected'
                        ? '#dc3545'
                        : '#856404',
                  }}
                >
                  {r.status.toUpperCase()}
                </div>

                {/* ✅ ONLY HOD / DIRECTOR */}
                {r.status === 'pending' && canDecide && (
                  <>
                    <input
                      style={styles.comment}
                      placeholder="Add comment"
                      value={comments[r._id] || ''}
                      onChange={(e) =>
                        setComments((p) => ({
                          ...p,
                          [r._id]: e.target.value,
                        }))
                      }
                    />

                    <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      <button
                        style={{ ...styles.btn, ...styles.approveBtn }}
                        onClick={() => decide(r._id, 'approved')}
                      >
                        ✓ Approve
                      </button>
                      <button
                        style={{ ...styles.btn, ...styles.rejectBtn }}
                        onClick={() => decide(r._id, 'rejected')}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default HrLeaveRequests;
