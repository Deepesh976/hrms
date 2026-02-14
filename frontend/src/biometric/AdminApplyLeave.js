import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const styles = {
  page: { maxWidth: 800, margin: '5rem auto', background: '#f7f9fc', padding: '2rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontFamily: 'Segoe UI, sans-serif' },
  heading: { fontSize: '1.8rem', fontWeight: 800, color: '#003366', marginBottom: '1rem', textAlign: 'center' },
  form: { background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' },
  input: { padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #ccc', fontSize: '0.95rem' },
  select: { padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #ccc', fontSize: '0.95rem' },
  textarea: { padding: '0.6rem 0.9rem', borderRadius: 8, border: '1.5px solid #ccc', fontSize: '0.95rem', minHeight: 90, gridColumn: '1 / -1' },
  actions: { marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  btn: { padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer' },
  submitBtn: { background: '#28a745', color: '#fff' },
  resetBtn: { background: '#6c757d', color: '#fff' },
};

const AdminApplyLeave = () => {
  const [form, setForm] = useState({
    type: 'AL',
    startDate: '',
    endDate: '',
    halfDay: 'none',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      toast.warn('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        halfDay: form.halfDay !== 'none' ? form.halfDay : undefined,
        reason: form.reason,
      };
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Leave request submitted');
      setForm({ type: 'AL', startDate: '', endDate: '', halfDay: 'none', reason: '' });
    } catch (e) {
      toast.error('Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <ToastContainer />
      <h2 style={styles.heading}>Apply Leave</h2>
      <form style={styles.form} onSubmit={submit}>
        <div style={styles.row}>
          <select style={styles.select} value={form.type} onChange={(e) => onChange('type', e.target.value)}>
            <option value="AL">Annual Leave</option>
            <option value="CL">Casual Leave</option>
            <option value="BTL">Business Trip Leave</option>
          </select>
          <input type="date" style={styles.input} value={form.startDate} onChange={(e) => onChange('startDate', e.target.value)} required />
          <input type="date" style={styles.input} value={form.endDate} onChange={(e) => onChange('endDate', e.target.value)} required />
          <select style={styles.select} value={form.halfDay} onChange={(e) => onChange('halfDay', e.target.value)}>
            <option value="none">Full Day</option>
            <option value="first">Half Day (First)</option>
            <option value="second">Half Day (Second)</option>
          </select>
          <textarea style={styles.textarea} placeholder="Reason" value={form.reason} onChange={(e) => onChange('reason', e.target.value)} required />
        </div>
        <div style={styles.actions}>
          <button type="button" style={{ ...styles.btn, ...styles.resetBtn }} onClick={() => setForm({ type: 'AL', startDate: '', endDate: '', halfDay: 'none', reason: '' })}>
            Reset
          </button>
          <button type="submit" disabled={submitting} style={{ ...styles.btn, ...styles.submitBtn, opacity: submitting ? 0.8 : 1 }}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminApplyLeave;
