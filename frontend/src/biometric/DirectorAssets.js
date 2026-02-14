import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './EmployeeAssets.css';

/* =========================
   RESPONSIVE CSS
========================= */
const responsiveStyles = `
@media (max-width: 640px) {
  .assets-table {
    display: none !important;
  }
  .assets-mobile-card {
    display: flex !important;
  }
}
`;

const styles = {
  page: {
    minHeight: '100vh',
    padding: '1.5rem',
    paddingTop: '90px',
    background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
  },
  wrapper: { maxWidth: '1400px', margin: '0 auto' },
  header: { marginBottom: '2rem' },
  heading: { fontSize: '2rem', fontWeight: 800, color: '#1e293b' },
  subheading: { fontSize: '0.95rem', color: '#64748b', marginTop: '0.4rem' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#1e293b',
    color: '#e2e8f0',
    padding: '0.9rem',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
  },
  td: {
    padding: '0.9rem',
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
  },
  pill: {
    padding: '0.3rem 0.8rem',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.75rem',
  },
  issued: { background: '#dcfce7', color: '#166534' },
  returned: { background: '#fee2e2', color: '#991b1b' },
  empty: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },

  mobileCard: {
    display: 'none',
    flexDirection: 'column',
    gap: '0.8rem',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    marginBottom: '1rem',
    background: '#fff',
  },
  mobileRow: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr',
    gap: '0.5rem',
  },
  mobileLabel: {
    fontWeight: 700,
    fontSize: '0.75rem',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  mobileValue: { fontSize: '0.85rem', color: '#475569' },
};

const DirectorAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  const fetchAssets = async () => {
    try {
      const res = await axios.get('/assets/my');
      setAssets(res.data?.success ? res.data.data || [] : []);
    } catch (err) {
      console.error('Error fetching assets', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <style>{responsiveStyles}</style>

      <div style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.header}>
            <h1 style={styles.heading}>📦 My Assets</h1>
            <p style={styles.subheading}>
              View assets assigned to you and your employees
            </p>
          </div>

          <div style={styles.card}>
            {loading && <div style={styles.empty}>Loading assets…</div>}

            {!loading && assets.length === 0 && (
              <div style={styles.empty}>No assets assigned.</div>
            )}

            {/* DESKTOP */}
            {!loading && assets.length > 0 && !isMobile && (
              <table style={styles.table} className="assets-table">
                <thead>
                  <tr>
                    <th style={styles.th}>Emp ID</th>
                    <th style={styles.th}>Employee Name</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Serial</th>
                    <th style={styles.th}>Issued</th>
                    <th style={styles.th}>Condition</th>
                    <th style={styles.th}>Notes</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a._id}>
                      <td style={styles.td}>{a.empId || a.assigneeRole?.toUpperCase() || 'N/A'}</td>
                      <td style={styles.td}>{a.assigneeName || 'N/A'}</td>
                      <td style={styles.td}>{a.itemName}</td>
                      <td style={styles.td}>{a.serialNumber || '-'}</td>
                      <td style={styles.td}>
                        {a.issuedDate
                          ? new Date(a.issuedDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td style={styles.td}>{a.condition || '-'}</td>
                      <td style={styles.td}>{a.notes || '-'}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.pill,
                            ...(a.status === 'returned'
                              ? styles.returned
                              : styles.issued),
                          }}
                        >
                          {a.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* MOBILE */}
            {!loading &&
              isMobile &&
              assets.map((a) => (
                <div
                  key={a._id}
                  style={styles.mobileCard}
                  className="assets-mobile-card"
                >
                  <div style={styles.mobileRow}>
                    <div style={styles.mobileLabel}>Emp ID</div>
                    <div style={styles.mobileValue}>{a.empId || a.assigneeRole?.toUpperCase() || 'N/A'}</div>
                  </div>
                  <div style={styles.mobileRow}>
                    <div style={styles.mobileLabel}>Name</div>
                    <div style={styles.mobileValue}>
                      {a.assigneeName || 'N/A'}
                    </div>
                  </div>
                  <div style={styles.mobileRow}>
                    <div style={styles.mobileLabel}>Item</div>
                    <div style={styles.mobileValue}>{a.itemName}</div>
                  </div>
                  <div style={styles.mobileRow}>
                    <div style={styles.mobileLabel}>Status</div>
                    <div style={styles.mobileValue}>
                      {a.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DirectorAssets;
