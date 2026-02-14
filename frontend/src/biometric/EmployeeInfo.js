import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from '../api/axios';
import './EmployeeInfo.css';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '1rem 0.75rem',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  wrapper: {
    maxWidth: '95%',
    margin: '0 auto',
  },
  header: {
    marginBottom: '0.75rem',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '0.25rem',
    letterSpacing: '-0.02em',
  },
  subheading: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: 500,
    display: 'none',
  },
  controlsCard: {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '0.75rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
  },
  controlsGrid: {
    display: 'flex',
    gap: '0.6rem',
    marginBottom: '0.6rem',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  controlsRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  actionRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'nowrap',
    alignItems: 'center',
    borderTop: 'none',
    paddingTop: '0',
    marginTop: '0',
  },
  input: {
    flex: '1',
    minWidth: '140px',
    padding: '0.45rem 0.75rem',
    borderRadius: '6px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.8rem',
    outline: 'none',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  inputFocus: {
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },
  filterSection: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  uploadLabel: {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    color: '#fff',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },
  uploadLabelHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
  },
  hiddenInput: { display: 'none' },
  btnPrimary: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#fff',
    padding: '0.45rem 0.85rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    whiteSpace: 'nowrap',
  },
  btnPrimaryHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(34, 197, 94, 0.4)',
  },
  btnSecondary: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#fff',
    padding: '0.45rem 0.85rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    whiteSpace: 'nowrap',
  },
  btnSecondaryHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)',
  },
  btnDanger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    padding: '0.45rem 0.85rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    whiteSpace: 'nowrap',
  },
  btnDangerHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
  },
  btnSmall: {
    padding: '0.5rem 1rem',
  },
  statusBadge: {
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    textTransform: 'uppercase',
    letterSpacing: '0.01em',
  },
  tableCard: {
    background: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
  },
  tableWrapper: {
    marginTop: '0',
    overflow: 'auto',
    maxHeight: '50vh',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
  },
  th: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'linear-gradient(135deg, #2d3e50 0%, #1e293b 100%)',
    color: '#e2e8f0',
    padding: '0.75rem 0.75rem',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid #475569',
  },
  thCheckbox: {
    width: 36,
    textAlign: 'center',
  },
  td: {
    padding: '0.6rem 0.75rem',
    borderBottom: '1px solid #e2e8f0',
    textAlign: 'left',
    verticalAlign: 'middle',
    color: '#334155',
    transition: 'all 0.2s ease',
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.8rem',
  },
  tdCheckbox: {
    textAlign: 'center',
    width: 36,
  },
  pagination: {
    marginTop: '0.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.8rem',
    color: '#475569',
  },
  paginationBtn: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#ffffff',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  paginationBtnHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
  },
  paginationBtnActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    borderColor: '#2563eb',
  },
  paginationBtnDisabled: {
    background: '#cbd5e1',
    color: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  checkbox: {
    cursor: 'pointer',
    width: 16,
    height: 16,
    accentColor: '#2563eb',
  },
  uploadStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.35rem 0.7rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
};

const expectedKeys = {
  empStatus: 'Status W/ L',
  empUnit: 'EmpUnit',
  empId: 'EmpId',
  empName: 'EmpName',
  dob: 'Date of Birth',
  bloodGroup: 'Blood Group',
  doj: 'Date of Joining',
  gender: 'Gender',
  qualification: 'Academic Qualification',
  experience: 'Work Experience',
  personalEmail: 'Personal Email id',
  contactNo: 'Contact No',
  department: 'Department',
  designation: 'Designation',
  employment: 'Employment',
  officialEmail: 'Official email id',
  panNo: 'PAN No',
  aadharNo: 'Aadhar Card No.',
  pfNo: 'PF No',
  uanNo: 'UAN No',
  esiNo: 'ESI No',
  postalAddress: 'Postal Address',
  permanentAddress: 'Permanent Address',
  bankAccount: 'Bank Account Number',
  bankName: 'Bank Name',
  ifsc: 'IFSC Code',
  bankBranch: 'Bank Branch Name',
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  spouse: 'Spouse',
  nomineeName: 'Nominee Name',
  emergencyContact: 'Emergency Contact no.',
  exitDate: 'Exit Date',
  settlementAmount: 'Account Settlement (Amount)',
  remarks: 'Remarks',
  hiredCtc: 'Hired CTC',
  joiningCtc: 'CTC in Year:at the time of Joining',
  ctc2025: 'CTC in Year:2025',
  yearsWorked: 'Total Yrs Worked',
};

const EmployeeInfo = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [empUnit, setEmpUnit] = useState('');
  const limit = 10;

  // 🔐 Role-based access from localStorage
  const rawRole = localStorage.getItem('role') || '';
  const role = rawRole.toLowerCase();

  // Only these can see and use upload / remove all / add / edit / delete
  const canManage = ['super_admin', 'superadmin', 'hrms', 'hrms_handler'].includes(role);
  const canDeleteAll = canManage; // same roles, but kept separate if you want to change later

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/employees');
      setData(res.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Could not load employee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!canManage) {
      toast.error('You are not authorized to upload data.');
      return;
    }

    const input = event.target;
    const file = input?.files?.[0];

    if (!file || file.size === 0) {
      toast.error('⚠️ No file selected or file is empty');
      return;
    }

    if (uploading) {
      toast.warn('Upload already in progress. Please wait...');
      return;
    }

    if (fileUploaded) {
      toast.warn('⚠️ File already uploaded');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      setUploading(true);
      try {
        const dataArr = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(dataArr, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });

        const headers = rawData[0];
        const rows = rawData.slice(1);

        const jsonData = rows.map((row) => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        if (!jsonData || jsonData.length === 0) {
          toast.error('❌ Excel file appears empty or invalid');
          return;
        }

        const normalize = (str) =>
          String(str)
            .toLowerCase()
            .replace(/[\s_:/.-]/g, '')
            .replace(/[^\w]/g, '');

        const parseDate = (value) => {
          if (!value || typeof value !== 'string') return null;
          const parts = value.split(/[./-]/);
          if (parts.length !== 3) return null;
          const [day, month, year] = parts.map(Number);
          if (!day || !month || !year) return null;
          return new Date(year, month - 1, day);
        };

        const parseNumber = (val) => {
          if (val === null || val === undefined || val === '') return '';
          const num = parseFloat(val);
          return isNaN(num) ? '' : num;
        };

        const mappedData = jsonData.map((row) => {
          const mappedRow = {};
          for (const [key, label] of Object.entries(expectedKeys)) {
            const matched = Object.keys(row).find(
              (col) => normalize(col) === normalize(label)
            );
            let value = matched ? row[matched] : '';

            if (['dob', 'doj', 'exitDate'].includes(key)) {
              value = parseDate(value);
            } else if (
              ['settlementAmount', 'hiredCtc', 'joiningCtc', 'ctc2025', 'yearsWorked'].includes(
                key
              )
            ) {
              value = parseNumber(value);
            } else if (key === 'empStatus') {
              value = String(value).toUpperCase();
            }
            if (key === 'empId') {
              value = String(value).trim();
            }
            mappedRow[key] = value;
          }
          return mappedRow;
        });

        if (mappedData.length === 0) {
          toast.error('❌ No valid employee data to upload');
          return;
        }

        const invalidRows = mappedData.filter((emp) => !emp.empId || !emp.empName);
        if (invalidRows.length > 0) {
          toast.error(`❌ ${invalidRows.length} row(s) missing empId or empName.`);
          return;
        }

        console.log('🚀 mappedData to send:', mappedData);

        await axios.post('/employees/upload', { employees: mappedData });
        toast.success(`✅ Uploaded ${mappedData.length} rows`);
        await fetchEmployeeData();
        setFileUploaded(true);
      } catch (err) {
        console.error(err);
        toast.error('❌ Failed to upload');
      } finally {
        setUploading(false);
        input.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleEdit = () => {
    if (!canManage) {
      toast.error('You are not authorized to edit employees.');
      return;
    }

    if (selectedIds.length === 0) {
      toast.warn('Please select an employee to edit.');
      return;
    }
    if (selectedIds.length > 1) {
      toast.warn('You can only edit one employee at a time.');
      return;
    }

    const selectedEmployee = data.find((emp) => emp.empId === selectedIds[0]);
    if (selectedEmployee && selectedEmployee._id) {
      navigate(`/edit-employee-info/${selectedEmployee._id}`);
    } else {
      toast.error('Could not find selected employee’s ID');
    }
  };

  const handleDelete = async () => {
    if (!canManage) {
      toast.error('You are not authorized to delete employees.');
      return;
    }

    if (selectedIds.length === 0) {
      toast.warn('Select at least one row to delete.');
      return;
    }

    try {
      await axios.post('/employees/delete', { ids: selectedIds });
      toast.success('Deleted successfully');
      setSelectedIds([]);
      fetchEmployeeData();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete');
    }
  };

  const handleDeleteAll = async () => {
    if (!canDeleteAll) {
      toast.error('You are not authorized to remove all employee data.');
      return;
    }

    if (!data || data.length === 0) {
      toast.info('There are no employees to delete.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to remove ALL employee data? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await axios.delete('/employees/all');

      toast.success(
        res?.data?.message || '🗑️ All employee data deleted successfully'
      );

      await fetchEmployeeData();
      setFileUploaded(false);
      setSelectedIds([]);
      setPage(1);
    } catch (err) {
      console.error('❌ Error deleting all employees:', err);

      if (err?.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        const msg =
          err?.response?.data?.message || 'Failed to delete all employee data';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = Array.from(
    new Set((data || []).map((e) => e.department).filter(Boolean))
  ).sort();

  const empUnitOptions = Array.from(
  new Set((data || []).map((e) => e.empUnit).filter(Boolean))
).sort();


const filteredData = data.filter((emp) => {
  const matchesSearch =
    emp.empName?.toLowerCase().includes(search.toLowerCase()) ||
    emp.empId?.toLowerCase().includes(search.toLowerCase());

  const matchesDept = !department || emp.department === department;

  const matchesUnit = !empUnit || emp.empUnit === empUnit;

  return matchesSearch && matchesDept && matchesUnit;
});


  const totalPages = Math.ceil(filteredData.length / limit) || 1;
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, department, empUnit]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const renderCell = (key, value) => {
    if (['dob', 'doj', 'exitDate'].includes(key) && value) {
      return formatDate(value);
    }

    if (key === 'empStatus') {
      const status = value || '-';
      const isWorking = status === 'W';
      return (
        <span className={`status-badge ${isWorking ? 'status-working' : 'status-inactive'}`}>
          {isWorking ? '🟢' : '🔴'} {status}
        </span>
      );
    }

    return value ?? '';
  };

  return (
    <div className="employee-container">
      <ToastContainer position="top-center" />
      <div className="employee-wrapper">
        {/* Header */}
        <div className="employee-header">
          <h1 className="employee-heading">Employee Directory</h1>
          <p className="employee-subheading">Manage and view all employees</p>
        </div>

        {/* Controls Card */}
        <div className="controls-section controls-top">
          <input
            className="search-input"
            type="text"
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="department-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departmentOptions.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>

          <select
            className="empUnit-select"
            value={empUnit}
            onChange={(e) => setEmpUnit(e.target.value)}
          >
            <option value="">All Units</option>
            {empUnitOptions.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>

          {canManage && (
            <>
              <label
                htmlFor="upload"
                className={`btn btn-upload ${uploading ? 'disabled' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Upload Excel'}
              </label>
              <input
                id="upload"
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                onChange={uploading ? undefined : handleUpload}
                disabled={uploading}
              />

              <button
                onClick={() => navigate('/add-employee-info')}
                className="btn btn-primary"
              >
                + Add Employee
              </button>
              <button
                onClick={handleEdit}
                className="btn btn-secondary"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                🗑️ Delete
              </button>

              {canDeleteAll && (
                <button
                  onClick={handleDeleteAll}
                  className="btn btn-danger"
                  disabled={uploading}
                >
                  Remove All
                </button>
              )}

              {fileUploaded && !uploading && (
                <span className="status-indicator">
                  ✅ Uploaded
                </span>
              )}
              {uploading && (
                <span className="status-indicator">
                  ⏳ Uploading...
                </span>
              )}
            </>
          )}
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    {canManage ? '✓' : ''}
                  </th>
                  {Object.values(expectedKeys).map((label, idx) => (
                    <th key={idx}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading || uploading ? (
                  <tr>
                    <td colSpan={Object.keys(expectedKeys).length + 1} className="loading-state">
                      {uploading ? 'Uploading & refreshing data…' : 'Loading employee data…'}
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={Object.keys(expectedKeys).length + 1} className="empty-state">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((emp, i) => {
                    const isSelected = selectedIds.includes(emp.empId);

                    return (
                      <tr
                        key={i}
                        className={isSelected ? 'selected' : ''}
                      >
                        <td style={{ textAlign: 'center', width: '40px' }}>
                          {canManage && (
                            <input
                              type="checkbox"
                              className="table-checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(emp.empId)}
                            />
                          )}
                        </td>
                        {Object.keys(expectedKeys).map((key, idx) => (
                          <td key={idx} title={emp[key]}>
                            {renderCell(key, emp[key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page <strong>{page}</strong> / <strong>{totalPages}</strong>
          </span>
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeInfo;
