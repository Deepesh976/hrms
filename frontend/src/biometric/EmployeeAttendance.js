import React, { useEffect, useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCalendarAlt, FaClock, FaChartBar, FaFilter } from 'react-icons/fa';
import EmployeeNavbar from '../components/Navbar/employeenavbar';
import axios from '../api/axios';

const styles = {
  container: {
    padding: '2rem',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    paddingTop: '90px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#333',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '2rem',
    color: '#28a745',
    marginBottom: '0.5rem',
  },
  statTitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '0.25rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterInput: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '0.95rem',
    minWidth: '150px',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '2rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#28a745',
    color: '#fff',
    fontWeight: '600',
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.95rem',
  },
  tableRow: {
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s',
  },
  tableCell: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: '#333',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '15px',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  presentBadge: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  absentBadge: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  lateBadge: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  woBadge: {
    backgroundColor: '#cfe2ff',
    color: '#084298',
  },
  hoBadge: {
  backgroundColor: '#e2e3e5',
  color: '#41464b',
},
  noRecords: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666',
    fontSize: '1.1rem',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    fontSize: '1.1rem',
    color: '#666',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  paginationInfo: {
    fontSize: '0.95rem',
    color: '#666',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pageButton: {
    padding: '0.6rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#333',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    minWidth: '40px',
    textAlign: 'center',
  },
  pageButtonActive: {
    backgroundColor: '#28a745',
    color: '#fff',
    borderColor: '#28a745',
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  paginationSeparator: {
    color: '#ccc',
    margin: '0 0.25rem',
  },
  pageSizeSelector: {
    padding: '0.6rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#333',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
};

const EmployeeAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const role = (localStorage.getItem('role') || '').toLowerCase();
  const accentColor = role === 'hr-employee' ? '#7a42c3' : '#28a745';

  const themed = {
    statIcon: { ...styles.statIcon, color: accentColor },
    tableHeader: {
      ...styles.tableHeader,
      backgroundColor:
        role === 'hr-employee'
          ? '#b57edc'
          : styles.tableHeader.backgroundColor,
    },
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/activities');
      const activities = response.data.activities || response.data || [];

      const transformedData = activities.map((activity, index) => {
        let status = 'Absent';
        if (activity.status === 'P') status = 'Present';
        else if (activity.status === 'A') status = 'Absent';
        else if (activity.status === '½P' || activity.status === 'HP') status = 'Late';
        else if (activity.status === 'WO') status = 'WO';
        else if (activity.status === 'HO') status = 'HO'; 
        else if (activity.status === 'L') status = 'Absent';

        const formatTime = (timeStr) => {
          if (!timeStr || timeStr === '00:00:00' || timeStr === '00:00') return '-';
          if (timeStr.includes(':') && timeStr.split(':').length === 3) {
            return timeStr.substring(0, 5);
          }
          return timeStr;
        };

        const formatDuration = (durationStr) => {
          if (!durationStr || durationStr === '00:00:00' || durationStr === '00:00') return '-';
          const parts = durationStr.split(':');
          if (parts.length >= 2) {
            const h = parseInt(parts[0]) || 0;
            const m = parseInt(parts[1]) || 0;
            return `${h}:${String(m).padStart(2, '0')}`;
          }
          return durationStr;
        };

        const formatDateLocal = (dateStr) => {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        return {
          id: activity._id || index,
          date: formatDateLocal(activity.date),
          status,
          checkIn: formatTime(activity.timeInActual),
          checkOut: formatTime(activity.timeOutActual),
          workingHours: formatDuration(activity.duration),
          shift: activity.shift || 'Day Shift',
        };
      });

      setAttendanceData(transformedData);

      if (transformedData.length === 0) {
        toast.info('No attendance records found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch attendance data');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...attendanceData];

    if (filters.startDate) {
      filtered = filtered.filter((i) => i.date >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter((i) => i.date <= filters.endDate);
    }

    if (filters.status) {
      filtered = filtered.filter((i) => i.status === filters.status);
    }

    return filtered;
  }, [attendanceData, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const stats = useMemo(() => {
    const totalDays = filteredData.length;
    const presentDays = filteredData.filter(
      (i) => i.status === 'Present' || i.status === 'Late'
    ).length;
    const absentDays = filteredData.filter((i) => i.status === 'Absent').length;
    const lateDays = filteredData.filter((i) => i.status === 'Late').length;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate:
        totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0,
    };
  }, [filteredData]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Present':
        return { ...styles.statusBadge, ...styles.presentBadge };
      case 'Absent':
        return { ...styles.statusBadge, ...styles.absentBadge };
      case 'Late':
        return { ...styles.statusBadge, ...styles.lateBadge };
      case 'WO':
        return { ...styles.statusBadge, ...styles.woBadge };
      case 'HO':
        return { ...styles.statusBadge, ...styles.hoBadge };

      default:
        return styles.statusBadge;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Pagination button renderer
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        style={{
          ...styles.pageButton,
          ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
        }}
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        ← Prev
      </button>
    );

    // First page button
    if (startPage > 1) {
      buttons.push(
        <button
          key="1"
          style={styles.pageButton}
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="dots-start" style={styles.paginationSeparator}>
            ...
          </span>
        );
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          style={{
            ...styles.pageButton,
            ...(currentPage === i ? styles.pageButtonActive : {}),
          }}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    // Last page button
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="dots-end" style={styles.paginationSeparator}>
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          style={styles.pageButton}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        style={{
          ...styles.pageButton,
          ...(currentPage === totalPages ? styles.pageButtonDisabled : {}),
        }}
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next →
      </button>
    );

    return buttons;
  };

  return (
    <>
      <EmployeeNavbar />

      <div style={styles.container}>
        <ToastContainer position="top-right" autoClose={3000} />

        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>My Attendance</h1>
          <p style={styles.subtitle}>
            Track your daily attendance and working hours
          </p>
        </div>

        {/* STATS */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <FaCalendarAlt style={themed.statIcon} />
            <div style={styles.statTitle}>Total Days</div>
            <div style={styles.statValue}>{stats.totalDays}</div>
          </div>

          <div style={styles.statCard}>
            <FaClock style={themed.statIcon} />
            <div style={styles.statTitle}>Present Days</div>
            <div style={styles.statValue}>{stats.presentDays}</div>
          </div>

          <div style={styles.statCard}>
            <FaCalendarAlt style={themed.statIcon} />
            <div style={styles.statTitle}>Absent Days</div>
            <div style={styles.statValue}>{stats.absentDays}</div>
          </div>
        </div>

        {/* FILTERS */}
        <div style={styles.filterContainer}>
          <FaFilter style={{ color: accentColor }} />

          <input
            type="date"
            style={styles.filterInput}
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />

          <input
            type="date"
            style={styles.filterInput}
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                endDate: e.target.value,
              }))
            }
          />

          <select
            style={styles.filterInput}
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
          >
            <option value="">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="WO">WO</option>
            <option value="HO">HO</option>
          </select>
        </div>

        {/* TABLE */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loading}>Loading attendance data…</div>
          ) : paginatedData.length === 0 ? (
            <div style={styles.noRecords}>
              No attendance records found
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={themed.tableHeader}>Date</th>
                  <th style={themed.tableHeader}>Status</th>
                  <th style={themed.tableHeader}>Check In</th>
                  <th style={themed.tableHeader}>Check Out</th>
                  <th style={themed.tableHeader}>Working Hours</th>
                  <th style={themed.tableHeader}>Shift</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((record) => (
                  <tr
                    key={record.id}
                    style={styles.tableRow}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#f8f9fa')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <td style={styles.tableCell}>
                      {formatDate(record.date)}
                    </td>

                    <td style={styles.tableCell}>
                      <span style={getStatusBadgeStyle(record.status)}>
                        {record.status}
                      </span>
                    </td>

                    <td style={styles.tableCell}>{record.checkIn}</td>
                    <td style={styles.tableCell}>{record.checkOut}</td>
                    <td style={styles.tableCell}>{record.workingHours}</td>
                    <td style={styles.tableCell}>{record.shift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {paginatedData.length > 0 && (
          <div style={styles.paginationContainer}>
            <div style={styles.paginationInfo}>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
            </div>

            <div style={styles.paginationControls}>
              {renderPaginationButtons()}
            </div>

            <select
              style={styles.pageSizeSelector}
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeeAttendance;
