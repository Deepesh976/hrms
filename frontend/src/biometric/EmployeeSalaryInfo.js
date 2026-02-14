  import React, { useState, useEffect, useMemo } from 'react';
  import { useNavigate } from 'react-router-dom';
  import * as XLSX from 'xlsx';
  import { ToastContainer, toast } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';
  import {
    FaDownload,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSync,
    FaSearch,
    FaFilter,
    FaChevronLeft,
    FaChevronRight
  } from 'react-icons/fa';
  import { motion, AnimatePresence } from 'framer-motion';
  import axios from '../api/axios';
  import '../styles/EmployeeSalaryInfo.css';

  /* ---------------- COLUMN MAP ---------------- */

  const expectedKeys = {
    year: 'Year',
    month: 'Month',
    empId: 'EmpID',
    empName: 'EmpName',
    department: 'DEPT',
    designation: 'DESIGNATION',
    // dob: 'DOB',
    // doj: 'DOJ',
    actualCTCWithoutLOP: 'Actual CTC Without Loss Of Pay',
    lopCTC: 'LOP CTC',
    totalDays: 'Total Days',
    daysWorked: 'Days Worked',
    al: 'AL',
    pl: 'PL',
    blOrMl: 'BL/ML',
    lop: 'LOP',
    daysPaid: 'Days Paid',
    consileSalary: 'CONSILE SALARY',
    basic: 'BASIC',
    hra: 'HRA',
    cca: 'CCA',
    transportAllowance: 'TRP_ALW',
    otherAllowance1: 'O_ALW1',
    lop2: 'LOP2',
    basic3: 'BASIC3',
    hra4: 'HRA4',
    cca5: 'CCA5',
    transportAllowance6: 'TRP_ALW6',
    otherAllowance17: 'O_ALW17',
    grossPay: 'Gross Pay',
    plb: 'PLB',
    pf: 'PF',
    esi: 'ESI',
    pt: 'PT',
    tds: 'TDS',
    gpap: 'GPAP',
    otherDeductions: 'OTH_DEDS',
    netPay: 'NET_PAY',
    pfEmployerShare: 'PF Employer Share',
    esiEmployerShare: 'ESI Employer Share',
    bonus: 'Bonus'
  };

  const totalKeys = Object.keys(expectedKeys).filter(
    key =>
      ![
        'year',
        'month',
        'empId',
        'empName',
        'department',
        'designation',
        // 'dob',
        // 'doj'
      ].includes(key)
  );

  const excludedFromTotal = [
  'totalDays',
  'daysWorked',
  'al',
  'pl',
  'blOrMl',
  'lop',
  'daysPaid'
];  

  const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};


  /* ---------------- COMPONENT ---------------- */

  const EmployeeSalaryInfo = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [data, setData] = useState([]);
    const [selected, setSelected] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchSalaryData = async () => {
    try {
      const salRes = await axios.get('/salaries');

      setData(Array.isArray(salRes.data) ? salRes.data : []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load salary data.');
    }
  };


    useEffect(() => {
      fetchSalaryData();
    }, []);

    const filtered = useMemo(() => {
      return data.filter(item => {
        const val = search.toLowerCase();
  const matchText =
    item.empName?.toLowerCase().includes(val) ||
    (item.empId || item.EmpID)?.toLowerCase().includes(val) ||
    item.department?.toLowerCase().includes(val);
        const matchYear = !yearFilter || String(item.year) === String(yearFilter);
        const matchMonth = !monthFilter || item.month === monthFilter;
        return matchText && matchYear && matchMonth;
      });
    }, [data, search, yearFilter, monthFilter]);

    const years = useMemo(
      () => [...new Set(data.map(d => d.year))].sort((a, b) => b - a),
      [data]
    );

const months = useMemo(() => {
  const monthOrder = {
    January: 1, February: 2, March: 3, April: 4,
    May: 5, June: 6, July: 7, August: 8,
    September: 9, October: 10, November: 11, December: 12
  };

  return [...new Set(data.map(d => d.month))]
    .filter(Boolean)
    .sort((a, b) => (monthOrder[a] || 0) - (monthOrder[b] || 0));
}, [data]);


    const paginatedData = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      return filtered.slice(startIndex, startIndex + rowsPerPage);
    }, [filtered, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filtered.length / rowsPerPage);

    const toggleSelectAll = () => {
      setSelectAll(!selectAll);
      if (!selectAll) {
        const paginatedIndices = paginatedData.map(item => data.findIndex(d => d._id === item._id));
        setSelected(paginatedIndices);
      } else {
        setSelected([]);
      }
    };

    const toggleSelect = (paginatedIndex) => {
      const originalIndex = data.findIndex(d => d._id === paginatedData[paginatedIndex]._id);
      setSelected(prev =>
        prev.includes(originalIndex) ? prev.filter(i => i !== originalIndex) : [...prev, originalIndex]
      );
    };

    const handleEdit = () => {
      if (selected.length !== 1) return toast.warn('Select exactly one employee to edit');
      const empData = data[selected[0]];

      if (!empData || !empData._id) {
        toast.error('Employee data is missing ID');
        console.error('Employee data:', empData);
        return;
      }

      localStorage.setItem('editEmployee', JSON.stringify(empData));
      navigate(`/edit-employee-salary-info/${empData._id}`);
    };

    const handleDelete = () => {
      if (selected.length === 0) return toast.warn('No employee selected');
      if (!window.confirm(`Delete ${selected.length} employee(s)?`)) return;

      const deletePromises = selected.map(i => {
        const id = data[i]?._id;
        if (id) {
          return axios.delete(`/salaries/${id}`);
        }
        return Promise.resolve();
      });

      Promise.all(deletePromises)
        .then(() => {
          toast.success('Selected employee(s) deleted!');
          setSelected([]);
          setSelectAll(false);
          fetchSalaryData();
        })
        .catch(() => toast.error('Failed to delete some employees'));
    };

 const handleRegenerate = async () => {
  if (isRegenerating) return;

  try {
    setIsRegenerating(true);
    toast.info('Regenerating salary… Please wait');

    await axios.post('/salaries/generate-from-employee');

    toast.success('Salary regenerated successfully!');
    await fetchSalaryData();

  } catch (err) {
    console.error(err);
    toast.error('Failed to regenerate salary');
  } finally {
    setIsRegenerating(false);
  }
};


    const handleDownload = () => {
      if (filtered.length === 0) {
        toast.warn('No data to download. Please adjust your filters.');
        return;
      }

      const exportData = filtered.map(row => {
        const newRow = {};
        Object.keys(expectedKeys).forEach(key => {
          let val = row[key];
          newRow[expectedKeys[key]] = totalKeys.includes(key)
            ? isNaN(val) || val === '' || val == null
              ? ''
              : Math.round(parseFloat(val))
            : val;
        });
        return newRow;
      });
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Salary Info');
      const filename = `salary_info${yearFilter ? `_${yearFilter}` : ''}${monthFilter ? `_${monthFilter}` : ''}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`Downloaded ${filtered.length} records!`);
    };

    const handlePrevPage = () => {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePageClick = (page) => {
      setCurrentPage(page);
    };

    const getPaginationPages = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="salary-container">
        <ToastContainer position="top-right" />
        
        <div className="salary-controls">
          {/* Search Card */}
          <div className="control-card">
            <div className="control-card-title">
              <FaSearch /> Search
            </div>
            <div className="search-filters-grid">
              <div className="search-input-wrapper">
                <label className="search-label">Search by Name, ID, or Department</label>
                <input
                  className="salary-input"
                  placeholder="Enter name, employee ID, or department..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="control-card">
            <div className="control-card-title">
              <FaFilter /> Filters
            </div>
            <div className="filters-grid">
              <div className="filter-wrapper">
                <label className="filter-label">Year</label>
                <select 
                  className="salary-select" 
                  value={yearFilter} 
                  onChange={e => setYearFilter(e.target.value)}
                >
                  <option value="">All Years</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="filter-wrapper">
                <label className="filter-label">Month</label>
                <select 
                  className="salary-select" 
                  value={monthFilter} 
                  onChange={e => setMonthFilter(e.target.value)}
                >
                  <option value="">All Months</option>
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="control-card">
            <div className="control-card-title">Edit Records</div>
            <div className="action-buttons-group">
              <button className="salary-btn btn-edit" onClick={handleEdit}>
                <FaEdit /> Edit
              </button>
              <button className="salary-btn btn-delete" onClick={handleDelete}>
                <FaTrash /> Delete
              </button>
            </div>
          </div>

{/* Additional Actions Card */}
<div className="control-card">
  <div className="control-card-title">Add & Manage</div>
  <div className="action-buttons-group">
    <button
      className="salary-btn btn-insert"
      onClick={() => navigate('/input-data')}
    >
      <FaPlus /> Insert
    </button>

<button
  className="salary-btn btn-regenerate"
  onClick={handleRegenerate}
  disabled={isRegenerating}
  style={{
    opacity: isRegenerating ? 0.7 : 1,
    cursor: isRegenerating ? 'not-allowed' : 'pointer'
  }}
>
  <FaSync className={isRegenerating ? 'spin' : ''} />
  {isRegenerating ? 'Regenerating…' : 'Regenerate'}
</button>

  </div>
</div>
</div>

{/* Table Section */}
<div className="table-section">
  {filtered.length === 0 ? (
    <div className="no-results">
      <p>No employees found matching your filter criteria.</p>
    </div>
  ) : (
    <>
      <div className="table-wrapper">
        <table className="salary-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </th>
              {Object.values(expectedKeys).map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            <AnimatePresence>
              {paginatedData.map((row, paginatedIndex) => {
                const originalIndex = data.findIndex(
                  (d) => d._id === row._id
                );
                const isSelected = selected.includes(originalIndex);

                return (
                  <motion.tr
                    key={row._id || paginatedIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={isSelected ? 'row-selected' : ''}
                  >
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(paginatedIndex)}
                      />
                    </td>

                    {Object.keys(expectedKeys).map((k) => {
                      const rawVal = row[k];

                      const displayVal =
                        totalKeys.includes(k) &&
                        !isNaN(rawVal) &&
                        rawVal !== '' &&
                        rawVal != null
                          ? parseFloat(
                              parseFloat(rawVal).toFixed(2)
                            )
                          : rawVal;

                      return <td key={k}>{displayVal}</td>;
                    })}
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {/* TOTAL ROW */}
            <tr className="total-row">
              <td className="checkbox-cell">
                <strong>Total (This Page)</strong>
              </td>

              {Object.keys(expectedKeys).map((key) => {
                if (
                  !totalKeys.includes(key) ||
                  excludedFromTotal.includes(key)
                ) {
                  return <td key={key}></td>;
                }

                const sum = paginatedData.reduce((acc, row) => {
                  const val = row[key];
                  const num = Number(val);
                  return acc + (isNaN(num) ? 0 : num);
                }, 0);

                return (
                  <td key={key}>
                    <strong>{Math.round(sum)}</strong>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

              {/* Pagination */}
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing <strong>{(currentPage - 1) * rowsPerPage + 1}</strong> to <strong>{Math.min(currentPage * rowsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
                </div>
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn" 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft /> Prev
                  </button>
                  <div className="pagination-numbers">
                    {getPaginationPages().map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="page-ellipsis">...</span>
                      ) : (
                        <button
                          key={page}
                          className={`page-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => handlePageClick(page)}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>
                  <button 
                    className="pagination-btn" 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next <FaChevronRight />
                  </button>
                </div>
                <div className="rows-per-page">
                  <span>Rows per page:</span>
                  <select 
                    value={rowsPerPage} 
                    onChange={e => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        <button className="salary-btn btn-download" onClick={handleDownload}>
          <FaDownload /> Download Excel
        </button>
      </div>
    );
  };

  export default EmployeeSalaryInfo;
