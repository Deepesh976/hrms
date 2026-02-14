import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from '../api/axios';

/* =========================
   STYLES
========================= */
const styles = {
  page: {
    maxWidth: 1200,
    margin: '4rem auto',
    padding: '2rem',
    background: '#f7f9fc',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    fontFamily: 'Segoe UI, sans-serif'
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#003366',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  input: {
    padding: '0.55rem 0.9rem',
    borderRadius: 8,
    border: '1.5px solid #ccc',
    fontSize: '0.95rem',
    minWidth: 200
  },
  select: {
    padding: '0.55rem 0.9rem',
    borderRadius: 8,
    border: '1.5px solid #ccc',
    fontSize: '0.95rem'
  },
  btn: {
    padding: '0.55rem 1rem',
    borderRadius: 8,
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer'
  },
  addBtn: { background: '#0059b3', color: '#fff' },
  editBtn: { background: '#ffc107', color: '#222' },
  delBtn: { background: '#dc3545', color: '#fff' },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    marginBottom: '1.5rem'
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '0.75rem'
  },
  item: {
    border: '1px solid #eef2f7',
    borderRadius: 10,
    padding: '0.75rem'
  },
  badge: {
    padding: '0.2rem 0.5rem',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '0.75rem'
  }
};

const emptyForm = {
  date: '',
  type: 'public_holiday',
  title: '',
  description: ''
};

const HrLeaveCalendar = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userRole = (localStorage.getItem('role') || '').toLowerCase();
  const canEdit = ['super_admin', 'hrms_handler'].includes(userRole);

  /* =====================
     FETCH EVENTS
  ===================== */
  const fetchEvents = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get('/leave-calendar');
      setEvents(res.data?.data || []);
    } catch {
      toast.error('Failed to load calendar');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /* =====================
     ADD / UPDATE
  ===================== */
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await axios.put(`/leave-calendar/${editingId}`, form);
        toast.success('Holiday updated');
      } else {
        await axios.post('/leave-calendar', form);
        toast.success('Holiday added');
      }

      setForm(emptyForm);
      setEditingId(null);
      fetchEvents();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  /* =====================
     EDIT / DELETE
  ===================== */
  const startEdit = (row) => {
    setForm({
      date: row.date?.slice(0, 10) || '',
      type: row.type || 'public_holiday',
      title: row.title || '',
      description: row.description || ''
    });
    setEditingId(row._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;

    setDeleting(true);
    try {
      await axios.delete(`/leave-calendar/${id}`);
      toast.success('Deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={styles.page}>
      <ToastContainer />

      {/* 🔥 LOADING OVERLAY (SAVE / DELETE ONLY) */}
      {(saving || deleting) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '20px 30px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            {deleting ? 'Deleting holiday…' : 'Saving holiday…'} Please wait
          </div>
        </div>
      )}

      <h2 style={styles.heading}>
        Leave Calendar {canEdit ? '(HR Admin)' : '(View Only)'}
      </h2>

      {canEdit && (
        <form style={styles.card} onSubmit={submit}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="date"
              style={styles.input}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              disabled={saving || deleting}
            />

            <select
              style={styles.select}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              disabled={saving || deleting}
            >
              <option value="public_holiday">Public Holiday</option>
              <option value="restricted_holiday">Restricted Holiday</option>
              <option value="company_event">Company Event</option>
              <option value="weekend">Weekend</option>
            </select>

            <input
              style={styles.input}
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              disabled={saving || deleting}
            />

            <input
              style={{ ...styles.input, minWidth: 260 }}
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              disabled={saving || deleting}
            />
          </div>

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={saving || deleting}
              style={{
                ...styles.btn,
                ...styles.addBtn,
                opacity: saving || deleting ? 0.7 : 1,
                cursor: saving || deleting ? 'not-allowed' : 'pointer'
              }}
            >
              {saving
                ? 'Saving...'
                : editingId
                ? 'Update Holiday'
                : 'Add Holiday'}
            </button>

            {editingId && (
              <button
                type="button"
                disabled={saving || deleting}
                style={{
                  ...styles.btn,
                  background: '#6c757d',
                  color: '#fff',
                  opacity: saving || deleting ? 0.7 : 1
                }}
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div style={styles.list}>
        {events.map((ev) => (
          <div key={ev._id} style={styles.item}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{ev.title}</strong>
              <span
                style={{
                  ...styles.badge,
                  background: '#e8f5e8',
                  color: '#155724'
                }}
              >
                {(ev.type || 'public_holiday')
                  .replace(/_/g, ' ')
                  .toUpperCase()}
              </span>
            </div>

            <div style={{ color: '#495057', margin: '0.25rem 0' }}>
              {ev.description || '-'}
            </div>

            <div style={{ color: '#6c757d' }}>
              {ev.date ? new Date(ev.date).toLocaleDateString() : '-'}
            </div>

            {canEdit && (
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem'
                }}
              >
                <button
                  disabled={saving || deleting || loadingList}
                  style={{
                    ...styles.btn,
                    ...styles.editBtn,
                    opacity:
                      saving || deleting || loadingList ? 0.6 : 1
                  }}
                  onClick={() => startEdit(ev)}
                >
                  Edit
                </button>

                <button
                  disabled={saving || deleting || loadingList}
                  style={{
                    ...styles.btn,
                    ...styles.delBtn,
                    opacity:
                      saving || deleting || loadingList ? 0.6 : 1
                  }}
                  onClick={() => remove(ev._id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {!events.length && !loadingList && (
          <div style={{ color: '#6c757d' }}>
            No holidays configured.
          </div>
        )}
      </div>
    </div>
  );
};

export default HrLeaveCalendar;
