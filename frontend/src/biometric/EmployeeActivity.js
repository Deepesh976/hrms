import React, { useState, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaTrashAlt,
  FaUpload,
  FaSearch,
  FaFilter,
  FaSort,
  FaChartBar,
  FaClock,
  FaTimes,
  FaCommentDots,
  FaCalendarAlt,
  FaFileExcel,
  FaSpinner,
} from 'react-icons/fa';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import '../styles/EmployeeActivity.css';

// 🔥 Date helpers — NO UTC, NO SHIFT, EVER
const parseYMDLocal = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

const normalizeLocalDate = (d) => {
  const x = new Date(d);
  return new Date(
    x.getFullYear(),
    x.getMonth(),
    x.getDate(),
    0, 0, 0, 0
  );
};

const STATUS_TOAST_ID = 'status-update-toast';

const formatDateLocal = (dateStr) => {
  if (!dateStr) return '';

const d = new Date(dateStr);
return d.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
};

const EmployeeActivity = () => {
  const navigate = useNavigate();

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    empId: '',
    empName: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  // const [monthlySummaryData, setMonthlySummaryData] = useState([]);
  // const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showStatusEditModal, setShowStatusEditModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Upload Excel Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFromDate, setUploadFromDate] = useState('');
  const [uploadToDate, setUploadToDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Monthly Summary Modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryEmpId, setSummaryEmpId] = useState(null);
  const [summaryDate, setSummaryDate] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Status Change Comment Modal
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentActivity, setCommentActivity] = useState(null);

  const userRole = localStorage.getItem('role')?.toLowerCase();
  useEffect(() => {
  if (userRole === 'employee' || userRole === 'hr-employee') {
    toast.error('Access denied');
    navigate('/employee-attendance');
  }
}, [userRole, navigate]);

  const canEditStatus = ['admin', 'hrms_handler', 'super_admin', 'superadmin'].includes(userRole);
  const canManageData = ['admin', 'hrms_handler', 'super_admin', 'superadmin'].includes(userRole);
  const isRestrictedRole = ['hod', 'director'].includes(userRole);

  const fetchData = async () => {
  setLoading(true);
  try {
    const res = await axios.get('/activities');
    const activities = res.data.activities || res.data || [];
    setAllData(activities);
    setCurrentPage(1);
    if (!activities.length) toast.info('No activity records found');
  } catch (err) {
    console.error(err);
    toast.error('Failed to fetch activity data');
    setAllData([]);
  } finally {
    setLoading(false);
  }
};
  // 🔥 Auto-refresh to reflect Holiday / Sandwich changes

useEffect(() => {
  fetchData();

  const interval = setInterval(() => {
    if (!showStatusEditModal) fetchData();
  }, 60000);

  return () => clearInterval(interval);
}, [showStatusEditModal]);



  const filteredData = useMemo(() => {
    let filtered = [...allData];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.empId?.toLowerCase().includes(q) ||
          i.empName?.toLowerCase().includes(q) ||
          i.status?.toLowerCase().includes(q) ||
          i.shift?.toLowerCase().includes(q)
      );
    }

    if (filters.empId)
      filtered = filtered.filter((i) =>
        i.empId?.toLowerCase().includes(filters.empId.toLowerCase())
      );

    if (filters.empName)
      filtered = filtered.filter((i) =>
        i.empName?.toLowerCase().includes(filters.empName.toLowerCase())
      );

    if (filters.status) filtered = filtered.filter((i) => i.status === filters.status);

if (filters.startDate) {
  const from = parseYMDLocal(filters.startDate);
  filtered = filtered.filter((i) => {
    const d = normalizeLocalDate(new Date(i.date));
    return d >= from;
  });
}

if (filters.endDate) {
  const to = parseYMDLocal(filters.endDate);
  filtered = filtered.filter((i) => {
    const d = normalizeLocalDate(new Date(i.date));
    return d <= to;
  });
}

    return filtered;
  }, [allData, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

if (sortConfig.key === 'date') {
aVal = new Date(a.date).getTime();
bVal = new Date(b.date).getTime();
}



      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const currentPageData = sortedData.slice(startIndex, startIndex + recordsPerPage);

  const summary = useMemo(() => {
    return {
      total: filteredData.length,
      present: filteredData.filter((d) => d.status === 'P').length,
      halfDay: filteredData.filter((d) => d.status === '½P').length * 0.5,
      absent: filteredData.filter((d) => d.status === 'A').length,
      weeklyOff: filteredData.filter((d) => d.status === 'WO').length,
      holiday: filteredData.filter((d) => d.status === 'HO').length,
      employees: [...new Set(filteredData.map((d) => d.empId))].length,
    };
  }, [filteredData]);

  const handleSort = (key) => {
    setSortConfig((p) => ({
      key,
      direction: p.key === key && p.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', empId: '', empName: '', status: '', startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const deleteAllData = async () => {
    if (!window.confirm('Delete all activity data?')) return;
    setLoading(true);
    try {
      const res = await axios.delete('/activities');
      toast.success(res.data.message || 'All data deleted');
      setAllData([]);
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteFilteredData = async () => {
    if (!filters.startDate || !filters.endDate)
      return toast.warn('Select start & end date');

    if (!window.confirm('Delete filtered attendance data?')) return;

    setLoading(true);
    try {
      const res = await axios.delete('/activities/date-range', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          empId: filters.empId || undefined,
        },
      });

      toast.success(res.data.message || 'Filtered data deleted');
      await fetchData();
      clearFilters();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const openStatusEditModal = (activity) => {
    if (!canEditStatus) return toast.warn('No permission');
    setSelectedActivity(activity);
    setNewStatus(activity.status);
    setChangeReason('');
    setShowStatusEditModal(true);
  };

  const closeStatusEditModal = () => {
    setShowStatusEditModal(false);
    setSelectedActivity(null);
    setNewStatus('');
    setChangeReason('');
    setUpdatingStatus(false);
  };

  const updateAttendanceStatus = async () => {
    if (!newStatus || !changeReason.trim())
      return toast.warn('Provide status & reason', { toastId: STATUS_TOAST_ID });

    if (updatingStatus) return;
    setUpdatingStatus(true);
    setLoading(true);

    try {
      const res = await axios.patch(`/activities/${selectedActivity._id}/status`, {
        newStatus,
        changeReason: changeReason.trim(),
      });

      if (res.data.success) {
        toast.success('Status updated');
        await fetchData();
        closeStatusEditModal();
      } else toast.error(res.data.message || 'Update failed');
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    } finally {
      setUpdatingStatus(false);
      setLoading(false);
    }
  };

const getPayrollCycleFromDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  d.setHours(0, 0, 0, 0);

  let year = d.getFullYear();
  let month = d.getMonth() + 1;

  // 🔥 If date is 21 or later → payroll month is NEXT month
  if (d.getDate() >= 21) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return { year, month };
};


const fetchMonthlySummary = async (empId, dateStr) => {
  setSummaryLoading(true);

  try {
    const cycle = getPayrollCycleFromDate(dateStr);
    if (!cycle) {
      toast.error('Invalid date');
      setSummaryLoading(false);
      return;
    }

    const { year, month } = cycle;

const res = await axios.get(
  `/monthly-summary/employee/${empId}?year=${year}&month=${month}`
);

console.log('Requested:', { year, month });
console.log('Response:', res.data);

let summaryObj = null;

// If backend wraps inside success
if (res.data?.success) {
  summaryObj = res.data.data;
} else {
  summaryObj = res.data;
}

// 🔥 Ensure it matches year/month strictly
if (
  summaryObj &&
  Number(summaryObj.year) === Number(year) &&
  Number(summaryObj.month) === Number(month)
) {
  setSummaryData(summaryObj);
} else {
  setSummaryData(null);
  toast.info('No monthly summary found for this payroll cycle');
}


  } catch (err) {
    console.error('Error fetching summary:', err);
    toast.error(
      err.response?.data?.message || 'Failed to load monthly summary'
    );
    setSummaryData(null);
  } finally {
    setSummaryLoading(false);
  }
};


  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUploadAttendance = async () => {
    if (!uploadFromDate || !uploadToDate) {
      toast.warn('Please select FROM and TO dates');
      return;
    }
    if (new Date(uploadFromDate) > new Date(uploadToDate)) {
      toast.warn('FROM date cannot be after TO date');
      return;
    }
    if (!selectedFile) {
      toast.warn('Please select an Excel file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fromDate', uploadFromDate);
    formData.append('toDate', uploadToDate);

    setUploadLoading(true);
    try {
      const res = await axios.post('/activities/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message || 'File uploaded successfully');
      await fetchData();
      setShowUploadModal(false);
      setUploadFromDate('');
      setUploadToDate('');
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const SortableHeader = ({ column, children }) => (
    <th onClick={() => handleSort(column)}>
      {children} {sortConfig.key === column && <FaSort />}
    </th>
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const changeRecordsPerPage = (e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

const getStatusColor = (status) => {
  const colors = {
    'P': '#10b981',
    'A': '#ef4444',
    '½P': '#f59e0b',
    'WO': '#8b5cf6',
    'HO': '#3b82f6',
    'ALF': '#9333ea',
    'ALH': '#c084fc'
  };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="ea-wrapper">
      <ToastContainer position="top-right" autoClose={3000} limit={3} />

      {loading && (
        <div className="ea-loading-overlay">
          <div className="ea-loading-box">Loading…</div>
        </div>
      )}

      <div className="ea-header">
        <h2 className="ea-title">
          {/* <FaClock /> Employee Activity Management */}
        </h2>

{!isRestrictedRole && (
  <div className="ea-quick-stats">
    <div className="ea-stat-card">
      <b>{summary.total}</b>
      <div>Total Records</div>
    </div>
    <div className="ea-stat-card">
      <b>{summary.employees}</b>
      <div>Active Employees</div>
    </div>
  </div>
)}

      </div>

      {/* CONTROLS */}
      <div className="ea-controls">
        <div className="ea-primary-controls">
          <div className="ea-search-box">
            <FaSearch />
            <input
              placeholder="Search by Employee ID, Name, Status..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <button
            className="ea-btn secondary"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <FaFilter /> Advanced Filters
          </button>

          {canManageData && (
            <>
              <button
                className="ea-btn upload"
                onClick={() => setShowUploadModal(true)}
              >
                <FaUpload /> Upload Excel
              </button>

              <button className="ea-btn danger" onClick={deleteAllData}>
                <FaTrashAlt /> Delete All
              </button>
            </>
          )}
        </div>

        {showAdvancedFilters && (
          <div className="ea-advanced-filters">
            <input
              placeholder="Emp ID"
              value={filters.empId}
              onChange={(e) => handleFilterChange('empId', e.target.value)}
            />
            <input
              placeholder="Name"
              value={filters.empName}
              onChange={(e) => handleFilterChange('empName', e.target.value)}
            />

<select
  value={filters.status}
  onChange={(e) => handleFilterChange('status', e.target.value)}
>
  <option value="">All</option>
  <option value="P">P</option>
  <option value="½P">½P</option>
  <option value="A">A</option>
  <option value="WO">WO</option>
  <option value="HO">HO</option>
  <option value="ALF">ALF</option>
  <option value="ALH">ALH</option>
</select>


            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />

            <button className="ea-btn secondary" onClick={clearFilters}>
              Clear
            </button>

            {canManageData && (
              <button className="ea-btn danger" onClick={deleteFilteredData}>
                Delete Filtered
              </button>
            )}
          </div>
        )}
      </div>

      {/* TABLE */}
<table className="ea-table">
  <thead>
    <tr>
      <th>S.No</th>
      <SortableHeader column="date">Date</SortableHeader>
      <SortableHeader column="empId">Emp ID</SortableHeader>
      <SortableHeader column="empName">Name</SortableHeader>
      <SortableHeader column="shift">Shift</SortableHeader>
      <SortableHeader column="timeInActual">In</SortableHeader>
      <SortableHeader column="timeOutActual">Out</SortableHeader>
      <SortableHeader column="lateBy">Late By</SortableHeader>
      <SortableHeader column="earlyBy">Early By</SortableHeader>
      <SortableHeader column="ot">OT</SortableHeader>
      <SortableHeader column="duration">Duration</SortableHeader>
      <SortableHeader column="status">Status</SortableHeader>
      {!isRestrictedRole && <th>Monthly</th>}
    </tr>
  </thead>

  <tbody>
    {currentPageData.map((item, idx) => (
      <tr
        key={item._id || idx}
        className={item.isStatusModified ? 'ea-row-modified' : ''}
      >
        <td>{startIndex + idx + 1}</td>
        <td>{formatDateLocal(item.date)}</td>
        <td>{item.empId}</td>
        <td>{item.empName}</td>
        <td>{item.shift}</td>
        <td>{item.timeInActual}</td>
        <td>{item.timeOutActual}</td>
        <td>{item.lateBy}</td>
        <td>{item.earlyBy}</td>
        <td>{item.ot}</td>
        <td>{item.duration}</td>

{/* ✅ STATUS + COMMENT ICON */}
<td>
  <div className="ea-status-wrapper">
    <span
      className={`ea-status ${item.status} ${
        item.isStatusModified ? 'ea-status-modified' : ''
      }`}
      onClick={() =>
  canEditStatus &&
  !['HO', 'WO'].includes(item.status) &&
  openStatusEditModal(item)
}
title={
  item.status === 'HO'
    ? 'Holiday'
    : item.status === 'WO'
    ? 'Weekly Off'
    : item.status === 'A'
    ? 'Absent'
    : item.status === '½P'
    ? 'Half Day'
    : item.status === 'P'
    ? 'Present'
    : item.status === 'ALF'
    ? 'Annual Leave Full'
    : item.status === 'ALH'
    ? 'Annual Leave Half'
    : ''
}
    >
      {item.status}
    </span>

    {/* 🔥 COMMENT / SANDWICH INDICATOR */}
    {item.isStatusModified && (
      <span
        className="ea-status-comment"
        title="Click to view status change details"
        onClick={() => {
          setCommentActivity(item);
          setShowCommentModal(true);
        }}
        style={{ cursor: 'pointer' }}
      >
        <FaCommentDots />
      </span>
    )}
  </div>
</td>
        {/* MONTHLY SUMMARY */}
{!isRestrictedRole && (
  <td>
    <button
      className="ea-summary-btn"
      title={`View monthly summary for ${item.empName}`}
      onClick={() => {
        setSummaryEmpId(item.empId);
        setSummaryDate(item.date);
        setSummaryData(null);
        setShowSummaryModal(true);
        fetchMonthlySummary(item.empId, item.date);
      }}
    >
      <FaCalendarAlt style={{ marginRight: '4px' }} />
      Summary
    </button>
  </td>
)}

      </tr>
    ))}
  </tbody>
</table>
{/* =========================
    PAGINATION
========================= */}
{totalPages > 1 && (
  <div className="ea-pagination">
    <div className="ea-pagination-info">
      Showing {startIndex + 1}–
      {Math.min(startIndex + recordsPerPage, sortedData.length)} of{' '}
      {sortedData.length}
    </div>

    <div className="ea-pagination-controls">
      <button
        className="ea-btn secondary"
        disabled={currentPage === 1}
        onClick={() => goToPage(1)}
      >
        ⏮ First
      </button>

      <button
        className="ea-btn secondary"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        ◀ Prev
      </button>

      <span className="ea-page-indicator">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className="ea-btn secondary"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next ▶
      </button>

      <button
        className="ea-btn secondary"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(totalPages)}
      >
        Last ⏭
      </button>
    </div>

    <div className="ea-pagination-size">
      <label>Rows:</label>
      <select value={recordsPerPage} onChange={changeRecordsPerPage}>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  </div>
)}


      {/* STATUS MODAL */}
      {showStatusEditModal && selectedActivity && (
        <div className="ea-modal-overlay">
          <div className="ea-modal">
            <div className="ea-modal-header">
              <h3>✎ Update Attendance Status</h3>
              <button onClick={closeStatusEditModal} title="Close">
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ marginBottom: '8px' }}>
                <b>Employee:</b> {selectedActivity.empName} ({selectedActivity.empId})
              </p>
              <p>
                <b>Date:</b> {formatDateLocal(selectedActivity.date)}
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1f2937', fontSize: '14px' }}>
                Attendance Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
<option value="P">Present</option>
<option value="½P">Half Day</option>
<option value="A">Absent</option>
<option value="WO">Weekly Off</option>
<option value="HO">Holiday</option>
<option value="ALF">Annual Leave Full</option>
<option value="ALH">Annual Leave Half</option>

              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1f2937', fontSize: '14px' }}>
                Change Reason
              </label>
              <textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Enter the reason for status change..."
                rows={4}
              />
            </div>

            <div className="ea-modal-actions">
              <button
                className="ea-btn"
                onClick={updateAttendanceStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Updating…' : 'Update Status'}
              </button>
              <button
                className="ea-btn secondary"
                onClick={closeStatusEditModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD EXCEL MODAL */}
      {showUploadModal && (
        <div className="ea-modal-overlay">
          <div className="ea-modal" style={{ minWidth: '480px' }}>
            <div className="ea-modal-header">
              <h3><FaFileExcel style={{ marginRight: '8px' }} />Upload Attendance File</h3>
              <button onClick={() => setShowUploadModal(false)} title="Close">
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1f2937', fontSize: '14px' }}>
                FROM Date
              </label>
              <input
                type="date"
                value={uploadFromDate}
                onChange={(e) => setUploadFromDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1f2937', fontSize: '14px' }}>
                TO Date
              </label>
              <input
                type="date"
                value={uploadToDate}
                onChange={(e) => setUploadToDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#1f2937', fontSize: '14px' }}>
                Select Excel File
              </label>
              <div style={{
                padding: '16px',
                border: '2px dashed #6366f1',
                borderRadius: '8px',
                textAlign: 'center',
                background: 'rgba(99, 102, 241, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  style={{ display: 'none' }}
                  id="excel-file-input"
                />
                <label htmlFor="excel-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <FaFileExcel style={{ fontSize: '32px', color: '#6366f1', marginBottom: '8px' }} />
                  <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#1f2937' }}>
                    {selectedFile ? selectedFile.name : 'Click to select or drop Excel file'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    .xlsx, .xls
                  </p>
                </label>
              </div>
            </div>

            <div className="ea-modal-actions">
              <button
                className="ea-btn"
                onClick={handleUploadAttendance}
                disabled={uploadLoading}
              >
                {uploadLoading ? <><FaSpinner style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} /> Uploading...</> : <><FaUpload style={{ marginRight: '6px' }} /> Upload File</>}
              </button>
              <button
                className="ea-btn secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFromDate('');
                  setUploadToDate('');
                  setSelectedFile(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

{/* =========================
    MONTHLY SUMMARY MODAL
========================= */}
{showSummaryModal && !isRestrictedRole && (
  <div className="ea-modal-overlay">
    <div
      className="ea-modal"
      style={{ minWidth: '520px', maxHeight: '85vh', overflowY: 'auto' }}
    >
      <div className="ea-modal-header">
        <h3>
          <FaChartBar style={{ marginRight: '8px' }} />
          Monthly Summary
        </h3>
        <button onClick={() => setShowSummaryModal(false)} title="Close">
          <FaTimes />
        </button>
      </div>

      {summaryLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <FaSpinner
            style={{
              fontSize: '32px',
              color: '#6366f1',
              animation: 'spin 1s linear infinite',
              marginBottom: '12px',
            }}
          />
          <p style={{ color: '#6b7280', fontWeight: '600' }}>
            Loading summary...
          </p>
        </div>
      ) : summaryData ? (
        <div style={{ padding: '20px 0' }}>
          {/* =========================
              EMPLOYEE & PAYROLL INFO
          ========================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1' }}>
                EMPLOYEE
              </p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#0c4a6e' }}>
                {summaryData.empName}
              </p>
              <p style={{ fontSize: '13px', color: '#0369a1' }}>
                ID: {summaryData.empId}
              </p>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
                borderRadius: '8px',
                border: '1px solid #fbcfe8',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#be185d' }}>
                PAYROLL MONTH
              </p>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#831843' }}>
                {String(summaryData.month).padStart(2, '0')}/{summaryData.year}
              </p>
            </div>
          </div>

          {/* =========================
              SUMMARY CARDS
          ========================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Present */}
            <div style={{ padding: '14px', border: '2px solid #bbf7d0', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#166534' }}>PRESENT</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a' }}>
                {summaryData.totalPresent ?? 0}
              </p>
            </div>

            {/* Absent */}
            <div style={{ padding: '14px', border: '2px solid #fecaca', background: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#7f1d1d' }}>ABSENT</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626' }}>
                {summaryData.totalAbsent ?? 0}
              </p>
            </div>

            {/* Weekly Off */}
            <div style={{ padding: '14px', border: '2px solid #ddd6fe', background: '#f5f3ff', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#5b21b6' }}>WEEKLY OFF</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed' }}>
                {summaryData.totalWOCount ?? 0}
              </p>
            </div>

            {/* Holidays */}
            <div style={{ padding: '14px', border: '2px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af' }}>HOLIDAYS</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>
                {summaryData.totalHOCount ?? 0}
              </p>
            </div>
            {/* Annual Leave Full */}
<div style={{ padding: '14px', border: '2px solid #e9d5ff', background: '#faf5ff', borderRadius: '8px', textAlign: 'center' }}>
  <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b21a8' }}>
    ANNUAL LEAVE FULL
  </p>
  <p style={{ fontSize: '28px', fontWeight: '800', color: '#9333ea' }}>
    {summaryData.totalALF ?? 0}
  </p>
</div>

{/* Annual Leave Half */}
<div style={{ padding: '14px', border: '2px solid #ddd6fe', background: '#f5f3ff', borderRadius: '8px', textAlign: 'center' }}>
  <p style={{ fontSize: '11px', fontWeight: '700', color: '#5b21b6' }}>
    ANNUAL LEAVE HALF
  </p>
  <p style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed' }}>
    {summaryData.totalALH ?? 0}
  </p>
</div>

          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#6b7280', fontWeight: '600' }}>
            No summary data available for this period
          </p>
        </div>
      )}

      <div className="ea-modal-actions" style={{ marginTop: '24px' }}>
        <button className="ea-btn" onClick={() => setShowSummaryModal(false)}>
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* =========================
    STATUS CHANGE COMMENT MODAL
========================= */}
{showCommentModal && commentActivity && (
  <div className="ea-modal-overlay">
    <div className="ea-modal" style={{ minWidth: '500px' }}>
      <div className="ea-modal-header">
        <h3>📝 Attendance Status Change</h3>
        <button onClick={() => setShowCommentModal(false)} title="Close">
          <FaTimes />
        </button>
      </div>

      <div style={{ padding: '20px 0' }}>
        {/* =========================
            EMPLOYEE INFO
        ========================= */}
        <div
          style={{
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
              EMPLOYEE NAME
            </p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
              {commentActivity.empName}
            </p>
          </div>

          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
              EMPLOYEE ID
            </p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#6366f1' }}>
              {commentActivity.empId}
            </p>
          </div>
        </div>

        {/* =========================
            DATE
        ========================= */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
            DATE
          </p>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
            {formatDateLocal(commentActivity.date)}
          </p>
        </div>

        {/* =========================
            STATUS CHANGE
        ========================= */}
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#0369a1',
              fontWeight: '600',
              marginBottom: '12px',
            }}
          >
            STATUS CHANGE
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Original */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                ORIGINAL
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '60px',
                  height: '36px',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  background: '#9ca3af',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                {commentActivity.originalStatus || commentActivity.previousStatus || '—'}
              </div>
            </div>

            <div style={{ margin: '0 16px', fontSize: '22px', color: '#3b82f6' }}>
              →
            </div>

            {/* New */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                UPDATED TO
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '60px',
                  height: '36px',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  background: getStatusColor(commentActivity.status),
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                {commentActivity.status}
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            CHANGE META
        ========================= */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
            CHANGED BY
          </p>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
            {commentActivity.statusChangedBy || 'System'}
          </p>

          {commentActivity.statusChangeDate && (
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              On {new Date(commentActivity.statusChangeDate).toLocaleString()}
            </p>
          )}
        </div>

        {/* =========================
            REASON
        ========================= */}
        <div>
          <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
            REASON FOR CHANGE
          </p>
          <div
            style={{
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              minHeight: '60px',
            }}
          >
            <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
              {commentActivity.statusChangeReason || 'No reason provided'}
            </p>
          </div>
        </div>
      </div>

      <div className="ea-modal-actions" style={{ marginTop: '24px' }}>
        <button className="ea-btn" onClick={() => setShowCommentModal(false)}>
          Close
        </button>
      </div>
    </div>
  </div>
)}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeActivity;
