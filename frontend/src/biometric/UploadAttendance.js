import React, { useState } from 'react';
import { FaUpload, FaTimes, FaFileExcel } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

const UploadAttendance = () => {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    setSelectedFile(file);

    // 🔹 TEMP preview placeholder (real Excel preview can be added later)
    setPreviewData([
      { empId: '910', name: 'K. Sharadha', date: fromDate || '—', status: 'P' },
      { empId: '3214', name: 'M. Vamshi', date: fromDate || '—', status: '½P' },
    ]);
  };

  const handleUpload = async () => {
    if (!fromDate || !toDate) {
      toast.warn('Please select FROM and TO dates');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast.warn('FROM date cannot be after TO date');
      return;
    }

    if (!selectedFile) {
      toast.warn('Please select an Excel file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fromDate', fromDate);
    formData.append('toDate', toDate);

    setLoading(true);
    try {
      const res = await axios.post('/activities/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data.message || 'File uploaded successfully');
      setTimeout(() => navigate('/employee-activity'), 800);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <h3 style={styles.title}>Upload File</h3>
          <button style={styles.closeBtn} onClick={() => navigate(-1)}>
            <FaTimes />
          </button>
        </div>

        <div style={styles.body}>
          {/* FROM / TO ROW */}
          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>FROM</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>TO</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* FILE UPLOAD */}
          <div style={styles.uploadSection}>
            <label style={styles.uploadBtn}>
              <FaUpload /> Choose Excel File
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </label>

            {selectedFile && (
              <div style={styles.fileName}>
                <FaFileExcel color="#28a745" /> {selectedFile.name}
              </div>
            )}
          </div>

          {/* PREVIEW */}
          {previewData.length > 0 && (
            <div style={styles.previewBox}>
              <h4 style={styles.previewTitle}>Preview (sample)</h4>
              <table style={styles.previewTable}>
                <thead>
                  <tr>
                    <th style={styles.previewTh}>Emp ID</th>
                    <th style={styles.previewTh}>Name</th>
                    <th style={styles.previewTh}>Date</th>
                    <th style={styles.previewTh}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.previewTd}>{row.empId}</td>
                      <td style={styles.previewTd}>{row.name}</td>
                      <td style={styles.previewTd}>{row.date}</td>
                      <td style={styles.previewTd}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ACTIONS */}
          <div style={styles.actions}>
            <button
              style={{
                ...styles.actionBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? 'Uploading…' : 'Upload'}
            </button>

            <button
              style={{ ...styles.actionBtn, ...styles.secondaryBtn }}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadAttendance;

/* ===========================
   STYLES
=========================== */

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #eef2f7 0%, #f8f9fa 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 14,
    width: '100%',
    maxWidth: 620,
    boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px',
    borderBottom: '1px solid #dee2e6',
    background: '#f8f9fa',
  },
  title: {
    margin: 0,
    color: '#343a40',
    fontSize: 20,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#6c757d',
  },
  body: {
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  row: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  group: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 220,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#343a40',
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ced4da',
    fontSize: 14,
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  uploadBtn: {
    background: '#28a745',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: 'fit-content',
  },
  fileName: {
    fontSize: 13,
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  previewBox: {
    border: '1px solid #dee2e6',
    borderRadius: 10,
    padding: 14,
    background: '#f8f9fa',
  },
  previewTitle: {
    margin: '0 0 10px',
    fontSize: 14,
    color: '#343a40',
  },
  previewTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  previewTh: {
    background: '#007bff',
    color: '#fff',
    padding: 8,
    textAlign: 'left',
  },
  previewTd: {
    padding: 8,
    borderBottom: '1px solid #dee2e6',
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionBtn: {
    background: '#007bff',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
  },
  secondaryBtn: {
    background: '#6c757d',
  },
};
