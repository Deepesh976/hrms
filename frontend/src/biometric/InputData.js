import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import axios from '../api/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUpload, FaTimes, FaTrash, FaEdit, FaDownload, FaHistory } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import SalaryEditModal from '../components/SalaryEditModal';
import '../styles/inputdata.css';

const expectedKeys = {
  EmpID: 'EmpID',
  EmpName: 'EmpName',
  ActualCTCWithoutLossOfPay: 'Actual CTC Without Loss Of Pay',
  CONSILESALARY: 'CONSILE SALARY',
  Basic: 'Basic',
  HRA: 'HRA',
  CCA: 'CCA',
  TRP_ALW: 'TRP_ALW',
  O_ALW1: 'O_ALW1'
};

const effectiveKeys = {
  effectiveFromYear: 'Effective From Year',
  effectiveFromMonth: 'Effective From Month'
};

/* ----------------- COMPONENT ----------------- */

const InputData = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  /* ---------------- FETCH DATA ---------------- */
  const fetchData = useCallback(() => {
    axios
      .get('/inputdata')
      .then((res) => {
        const resData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setData(resData);
      })
      .catch(() => toast.error('Failed to fetch data'));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- FILTER WITH REAL INDEX ---------------- */
  const filtered = data
    .map((row, realIndex) => ({ ...row, realIndex }))
    .filter((x) => x.EmpName?.toLowerCase().includes(search.toLowerCase()));

  /* ---------------- EDIT MODAL HANDLERS ---------------- */

  const handleOpenEditModal = (realIndex) => {
    const employee = data[realIndex];
    if (!employee?.EmpID) {
      toast.error('Employee ID not found');
      return;
    }
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEmployee(null);
  };

  const handleModalSave = () => {
    // Refresh data after modal save
    fetchData();
  };

  const handleHistory = (realIndex) => {
    const row = data[realIndex];

    if (!row?.EmpID) {
      toast.error('Employee ID not found');
      return;
    }

    // Navigate to history page for this employee
    navigate(`/salary-history/${row.EmpID}`);
  };

  /* ---------------- UPLOAD / REMOVE / DELETE / DOWNLOAD ---------------- */

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData.length) {
          toast.warn('Excel file is empty');
          return;
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleString('default', { month: 'short' });

        const cleaned = rawData.map((row) => {
          const cleanedRow = {};

cleanedRow.EmpID = row['EmpID']?.toString().trim();
cleanedRow.EmpName = row['EmpName']?.toString().trim();


// 🔥 ONLY SEND CTC
cleanedRow.ActualCTCWithoutLossOfPay =
  row['Actual CTC Without Loss Of Pay'] || '';


          // 🔥 NEW: default effective month/year on upload
          cleanedRow.effectiveFromYear = row['Effective From Year'] || currentYear;
          cleanedRow.effectiveFromMonth = row['Effective From Month'] || currentMonth;

          return cleanedRow;
        });

        const unique = cleaned.filter(
          (row, index, self) =>
            row.EmpID &&
            index === self.findIndex((r) => r.EmpID === row.EmpID)
        );

        if (!unique.length) {
          toast.warn('No valid unique EmpID rows found');
          return;
        }

        try {
          const response = await axios.post('/inputdata/upload', unique);

          const resData = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];

          setData(resData);
          setSelected([]);
          setSelectAll(false);

          toast.success(`Uploaded ${unique.length} employees successfully`);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(
            error?.response?.data?.message ||
            'Upload failed. Please check file format.'
          );
        }
      } catch (err) {
        console.error('File parse error:', err);
        toast.error('Failed to read Excel file');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Show modal instead of direct delete
  const handleRemoveUploadClick = () => {
    if (!data.length) {
      toast.info('No uploaded data to remove');
      return;
    }
    setShowRemoveModal(true);
  };

  // Actual delete once user confirms
  const performRemoveUpload = async () => {
    setRemoving(true);

    try {
      await axios.delete('/inputdata/clear');

      setData([]);
      setSelected([]);
      setSelectAll(false);

      toast.info('All uploaded input data removed');
    } catch (err) {
      console.error('Clear error:', err);
      toast.error('Failed to remove upload');
    } finally {
      setRemoving(false);
      setShowRemoveModal(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) {
      toast.warn('No rows selected');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selected.length} selected row(s)?`
    );
    if (!confirmDelete) return;

    try {
      const idsToDelete = selected.map((i) => data[i]?._id).filter(Boolean);

      if (!idsToDelete.length) {
        toast.error('No valid rows to delete');
        return;
      }

      await axios.post('/inputdata/delete-many', { ids: idsToDelete });

      const updated = data.filter((_, i) => !selected.includes(i));
      setData(updated);
      setSelected([]);
      setSelectAll(false);

      toast.success('Selected rows deleted successfully');
    } catch (err) {
      console.error('Delete selected error:', err);
      toast.error('Failed to delete selected rows');
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected([]);
    } else {
      setSelected(data.map((_, i) => i));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (index) => {
    setSelected((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleDownload = () => {
    if (!filtered.length) {
      toast.info('No data to download');
      return;
    }

    try {
      const exportData = filtered.map(
        ({ _id, __v, realIndex, ...row }) => row
      );

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      XLSX.writeFile(wb, 'EmployeeData.xlsx');

      toast.success(`Downloaded ${exportData.length} rows`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download Excel');
    }
  };

  return (
    <div className="inputdata-container">
      <ToastContainer />

      <div className="inputdata-topbar">
        <input
          className="inputdata-search"
          placeholder="Search by employee name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="inputdata-buttons">
          <label className="inputdata-btn inputdata-btn-upload">
            <FaUpload /> Upload
            <input
              type="file"
              hidden
              onChange={handleUpload}
              accept=".xlsx, .xls"
            />
          </label>

          <button
            className="inputdata-btn inputdata-btn-remove"
            onClick={handleRemoveUploadClick}
          >
            <FaTimes /> Remove Upload
          </button>

          <button
            className="inputdata-btn inputdata-btn-delete"
            onClick={handleDeleteSelected}
          >
            <FaTrash /> Delete Selected
          </button>

          <button
            className="inputdata-btn inputdata-btn-download"
            onClick={handleDownload}
          >
            <FaDownload /> Download
          </button>
        </div>
      </div>

      <div className="inputdata-table-wrapper">
        <table className="inputdata-table">
          <thead>
            <tr>
              <th className="inputdata-th">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </th>
              {[...Object.keys(expectedKeys), ...Object.keys(effectiveKeys)].map((key) => (
                <th key={key} className="inputdata-th">
                  {expectedKeys[key] || effectiveKeys[key]}
                </th>
              ))}

              <th className="inputdata-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((row) => {
                const realIndex = row.realIndex;
                return (
                  <motion.tr
                    key={realIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={
                      selected.includes(realIndex)
                        ? 'inputdata-row-highlight'
                        : ''
                    }
                  >
                    <td className="inputdata-td">
                      <input
                        type="checkbox"
                        checked={selected.includes(realIndex)}
                        onChange={() => toggleSelect(realIndex)}
                      />
                    </td>

                    {[...Object.keys(expectedKeys), ...Object.keys(effectiveKeys)].map((k) => (
                      <td key={k} className="inputdata-td">
                        {row[k]}
                      </td>
                    ))}


                    <td className="inputdata-td">
                      <button
                        className="inputdata-btn inputdata-btn-upload"
                        onClick={() => handleOpenEditModal(realIndex)}
                      >
                        <FaEdit /> Edit
                      </button>

                      <button
                        className="inputdata-btn"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          marginLeft: '0.5rem'
                        }}
                        onClick={() => handleHistory(realIndex)}
                      >
                        <FaHistory /> History
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* -------- Remove Upload Confirmation Modal -------- */}
      <AnimatePresence>
        {showRemoveModal && (
          <motion.div
            className="inputdata-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="inputdata-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="inputdata-modal-title">Remove uploaded data?</h3>
              <p className="inputdata-modal-text">
                This will permanently delete all uploaded employee input
                data from the system. Are you sure you really want to
                delete it?
              </p>
              <div className="inputdata-modal-actions">
                <button
                  className="inputdata-btn inputdata-btn-cancel"
                  onClick={() => setShowRemoveModal(false)}
                  disabled={removing}
                >
                  Cancel
                </button>
                <button
                  className="inputdata-btn inputdata-btn-danger"
                  onClick={performRemoveUpload}
                  disabled={removing}
                >
                  {removing ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------- Salary Edit Modal -------- */}
      {showEditModal && selectedEmployee && (
        <SalaryEditModal
          employee={selectedEmployee}
          onClose={handleCloseEditModal}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};
export default InputData;