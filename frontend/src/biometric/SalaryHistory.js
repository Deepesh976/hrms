import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const styles = {
  container: {
    maxWidth: 1100,
    margin: '2rem auto',
    padding: '2.5rem',
    background: '#ffffff',
    borderRadius: 12,
    fontFamily: 'Segoe UI, sans-serif',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.8rem'
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#111827'
  },
  backBtn: {
    padding: '0.55rem 1.2rem',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    boxShadow: '0 4px 10px rgba(37,99,235,0.25)'
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 10,
    border: '1px solid #e5e7eb'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff'
  },
  th: {
    background: 'linear-gradient(135deg, #1f2933, #111827)',
    color: '#fff',
    padding: '0.9rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: 600,
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '0.85rem',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#374151',
    whiteSpace: 'nowrap'
  },
  empty: {
    padding: '2rem',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.95rem'
  },
  badge: {
    padding: '0.25rem 0.7rem',
    borderRadius: 999,
    fontSize: '0.8rem',
    fontWeight: 600,
    background: '#e0f2fe',
    color: '#0369a1'
  }
};

// helper: format ₹ numbers nicely
const formatCurrency = (val) => {
  const num = Number(val || 0);
  if (isNaN(num)) return '-';
  return num.toLocaleString('en-IN');
};

// helper: format effective date → Year / Month
const formatYearMonth = (date) => {
  if (!date) return { year: '-', month: '-' };
  const d = new Date(date);
  return {
    year: d.getFullYear(),
    month: d.toLocaleString('default', { month: 'short' })
  };
};

const SalaryHistory = () => {
  const { empId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empId) return;

    axios
      .get(`/salary-history/${empId}`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];

        // 🔥 IMPORTANT: backend already sorts, but frontend safety sort
        const sorted = list.sort(
          (a, b) => new Date(a.effectiveFrom) - new Date(b.effectiveFrom)
        );

        setHistory(sorted);
      })
      .catch(() => toast.error('Failed to load salary history'))
      .finally(() => setLoading(false));
  }, [empId]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          Salary History — Employee ID: {empId}
        </div>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading salary history…</div>
      ) : history.length === 0 ? (
        <div style={styles.empty}>
          No salary changes found for this employee.
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>S.No</th>
                <th style={styles.th}>Effective Year</th>
                <th style={styles.th}>Effective Month</th>
                <th style={styles.th}>Actual CTC (Without LOP)</th>
                <th style={styles.th}>Updated By</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                const { year, month } = formatYearMonth(h.effectiveFrom);

                return (
                  <tr key={h._id}>
                    <td style={styles.td}>{i + 1}</td>

                    <td style={styles.td}>{year}</td>

                    <td style={styles.td}>{month}</td>

                    <td style={styles.td}>
                      <span style={styles.badge}>
                        ₹ {formatCurrency(h.actualCTC)}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {h.updatedBy || '-'}
                    </td>

                    <td style={styles.td}>
                      {h.reason || '-'}
                    </td>

                    <td style={styles.td}>
                      {h.createdAt
                        ? new Date(h.createdAt).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalaryHistory;
