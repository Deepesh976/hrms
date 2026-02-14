import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './EmployeeAssets.css';

const responsiveStyles = `
  @media (max-width: 1024px) {
    .assets-table-wrap {
      max-height: 600px !important;
    }
  }

  @media (max-width: 768px) {
    .assets-page {
      padding: 1rem !important;
      padding-top: 80px !important;
    }
    .assets-wrapper {
      max-width: 100% !important;
    }
    .assets-header {
      margin-bottom: 1.5rem !important;
    }
    .assets-heading {
      font-size: 1.5rem !important;
      gap: 0.5rem !important;
    }
    .assets-subheading {
      font-size: 0.85rem !important;
      margin-top: 0.25rem !important;
    }
    .assets-card {
      padding: 1rem !important;
      border-radius: 12px !important;
    }
    .assets-table {
      font-size: 0.8rem !important;
    }
    .assets-th {
      padding: 0.75rem 0.5rem !important;
      font-size: 0.75rem !important;
    }
    .assets-td {
      padding: 0.75rem 0.5rem !important;
    }
    .assets-table-wrap {
      max-height: 500px !important;
    }
  }

  @media (max-width: 640px) {
    .assets-page {
      padding: 0.75rem !important;
      padding-top: 80px !important;
    }
    .assets-header {
      margin-bottom: 1.25rem !important;
    }
    .assets-heading {
      font-size: 1.3rem !important;
    }
    .assets-subheading {
      font-size: 0.8rem !important;
    }
    .assets-card {
      padding: 0.75rem !important;
      border-radius: 10px !important;
    }
    .assets-mobile-card {
      display: flex !important;
      flex-direction: column !important;
      gap: 1rem !important;
      padding: 1rem !important;
      background: #fff !important;
      border-radius: 10px !important;
      border: 1px solid #e2e8f0 !important;
      margin-bottom: 1rem !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
    }
    .assets-mobile-row {
      display: grid !important;
      grid-template-columns: 120px 1fr !important;
      gap: 0.75rem !important;
      padding-bottom: 0.75rem !important;
      border-bottom: 1px solid #e2e8f0 !important;
      align-items: center !important;
    }
    .assets-mobile-row:last-child {
      border-bottom: none !important;
      padding-bottom: 0 !important;
    }
    .assets-mobile-label {
      font-weight: 700 !important;
      color: #1e293b !important;
      font-size: 0.75rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
    }
    .assets-mobile-value {
      color: #475569 !important;
      font-size: 0.85rem !important;
      word-break: break-word !important;
    }
    .assets-table {
      display: none !important;
    }
    .assets-pill {
      padding: 0.35rem 0.6rem !important;
      font-size: 0.7rem !important;
      border-radius: 4px !important;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .assets-table::-webkit-scrollbar {
    height: 6px;
  }

  .assets-table::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  .assets-table::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .assets-table::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const styles = {
  page: {
    minHeight: '100vh',
    padding: '1rem 1.5rem',
    paddingTop: '90px',
    background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  wrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  heading: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#1e293b',
    margin: 0,
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
  },
  subheading: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginTop: '0.4rem',
    fontWeight: 500,
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
  },
  tableWrap: {
    overflowX: 'auto',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    background: 'linear-gradient(135deg, #2d3e50 0%, #1e293b 100%)',
    color: '#e2e8f0',
    padding: '1rem 1rem',
    fontWeight: 700,
    fontSize: '0.85rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid #475569',
  },
  td: {
    padding: '0.85rem 1rem',
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  tableRow: {
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
  },
  tableRowHover: {
    backgroundColor: '#f8fafc',
    boxShadow: 'inset 0 0 0 1px #e2e8f0',
  },
  pill: {
    padding: '0.3rem 0.8rem',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.8rem',
    display: 'inline-block',
    textTransform: 'uppercase',
    letterSpacing: '0.01em',
    border: '1.5px solid',
  },
  statusIssued: {
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    color: '#166534',
    borderColor: '#86efac',
  },
  statusReturned: {
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    color: '#991b1b',
    borderColor: '#fca5a5',
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: '3rem 2rem',
    fontSize: '1rem',
    fontWeight: 500,
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.6,
  },
  loadingIcon: {
    display: 'inline-block',
    marginRight: '0.5rem',
    animation: 'spin 1.5s linear infinite',
  },
  mobileCard: {
    display: 'none',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    marginBottom: '1rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  mobileRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: '0.75rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #e2e8f0',
    alignItems: 'center',
  },
  mobileRowLast: {
    borderBottom: 'none',
    paddingBottom: 0,
  },
  mobileLabel: {
    fontWeight: 700,
    color: '#1e293b',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  mobileValue: {
    color: '#475569',
    fontSize: '0.85rem',
    wordBreak: 'break-word',
  },
};

const EmployeeAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  const fetchAssets = async () => {
    try {
      const res = await axios.get('/assets/my');

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setAssets(res.data.data);
      } else {
        setAssets([]);
      }

    } catch (err) {
      console.error('Error fetching assets', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={styles.page} className="assets-page">
        <div style={styles.wrapper} className="assets-wrapper">
          {/* Header */}
          <div style={styles.header} className="assets-header">
            <h1 style={styles.heading} className="assets-heading">
              📦 My Assets
            </h1>
            <p style={styles.subheading} className="assets-subheading">
              View your assigned company assets
            </p>
          </div>

          {/* Assets Card */}
          <div style={styles.card} className="assets-card">
            {/* Desktop Table View */}
            {!isMobile && (
              <div style={styles.tableWrap} className="assets-table-wrap">
                <table style={styles.table} className="assets-table">
                  <thead>
                    <tr>
                      <th style={{...styles.th, position: 'sticky', top: 0, zIndex: 10}} className="assets-th">Item</th>
                      <th style={{...styles.th, position: 'sticky', top: 0, zIndex: 10}} className="assets-th">Serial No.</th>
                      <th style={{...styles.th, position: 'sticky', top: 0, zIndex: 10}} className="assets-th">Issued On</th>
                      <th style={{...styles.th, position: 'sticky', top: 0, zIndex: 10}} className="assets-th">Condition</th>
                      <th style={{...styles.th, position: 'sticky', top: 0, zIndex: 10}} className="assets-th">Notes</th>
                      <th style={{...styles.th, position: 'sticky', top: 0, zIndex: 10}} className="assets-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan="6" style={styles.empty}>
                          <div style={styles.loadingIcon}>⏳</div>
                          Loading assets...
                        </td>
                      </tr>
                    )}

                    {!loading && assets.length === 0 && (
                      <tr>
                        <td colSpan="6" style={styles.empty}>
                          <div style={styles.emptyIcon}>📭</div>
                          No assets assigned.
                        </td>
                      </tr>
                    )}

                    {!loading && assets.length > 0 &&
                      assets.map((a, idx) => (
                        <tr
                          key={a._id}
                          style={{
                            ...styles.tableRow,
                            ...(hoveredRow === idx ? styles.tableRowHover : {}),
                          }}
                          onMouseEnter={() => setHoveredRow(idx)}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td style={{...styles.td}} className="assets-td">{a.itemName}</td>
                          <td style={{...styles.td}} className="assets-td">{a.serialNumber || '-'}</td>
                          <td style={{...styles.td}} className="assets-td">
                            {a.issuedDate
                              ? new Date(a.issuedDate).toLocaleDateString()
                              : '-'}
                          </td>
                          <td style={{...styles.td}} className="assets-td">{a.condition || '-'}</td>
                          <td style={{...styles.td}} className="assets-td">{a.notes || '-'}</td>
                          <td style={{...styles.td}} className="assets-td">
                            <span
                              style={{
                                ...styles.pill,
                                ...(a.status === 'returned'
                                  ? styles.statusReturned
                                  : styles.statusIssued),
                              }}
                              className="assets-pill"
                            >
                              {(a.status || 'issued').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card View */}
            {isMobile && (
              <div>
                {loading && (
                  <div style={styles.empty}>
                    <div style={styles.loadingIcon}>⏳</div>
                    Loading assets...
                  </div>
                )}

                {!loading && assets.length === 0 && (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>📭</div>
                    No assets assigned.
                  </div>
                )}

                {!loading && assets.length > 0 &&
                  assets.map((a) => (
                    <div key={a._id} style={styles.mobileCard} className="assets-mobile-card">
                      {/* Item Name */}
                      <div style={styles.mobileRow} className="assets-mobile-row">
                        <div style={styles.mobileLabel} className="assets-mobile-label">Item</div>
                        <div style={styles.mobileValue} className="assets-mobile-value">{a.itemName}</div>
                      </div>

                      {/* Serial Number */}
                      <div style={styles.mobileRow} className="assets-mobile-row">
                        <div style={styles.mobileLabel} className="assets-mobile-label">Serial No.</div>
                        <div style={styles.mobileValue} className="assets-mobile-value">{a.serialNumber || '-'}</div>
                      </div>

                      {/* Issued Date */}
                      <div style={styles.mobileRow} className="assets-mobile-row">
                        <div style={styles.mobileLabel} className="assets-mobile-label">Issued On</div>
                        <div style={styles.mobileValue} className="assets-mobile-value">
                          {a.issuedDate
                            ? new Date(a.issuedDate).toLocaleDateString()
                            : '-'}
                        </div>
                      </div>

                      {/* Condition */}
                      <div style={styles.mobileRow} className="assets-mobile-row">
                        <div style={styles.mobileLabel} className="assets-mobile-label">Condition</div>
                        <div style={styles.mobileValue} className="assets-mobile-value">{a.condition || '-'}</div>
                      </div>

                      {/* Notes */}
                      <div style={styles.mobileRow} className="assets-mobile-row">
                        <div style={styles.mobileLabel} className="assets-mobile-label">Notes</div>
                        <div style={styles.mobileValue} className="assets-mobile-value">{a.notes || '-'}</div>
                      </div>

                      {/* Status */}
                      <div style={{...styles.mobileRow, ...styles.mobileRowLast}} className="assets-mobile-row">
                        <div style={styles.mobileLabel} className="assets-mobile-label">Status</div>
                        <div style={styles.mobileValue} className="assets-mobile-value">
                          <span
                            style={{
                              ...styles.pill,
                              ...(a.status === 'returned'
                                ? styles.statusReturned
                                : styles.statusIssued),
                            }}
                            className="assets-pill"
                          >
                            {(a.status || 'issued').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeAssets;
