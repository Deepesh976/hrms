import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SalarySlip.css';

const LoadingSpinner = () => (
  <div className="spinner-inline">
    <span className="spinner-dot"></span>
  </div>
);

const ITEMS_PER_PAGE = 10;

const SalarySlip = () => {
  const [nameSearch, setNameSearch] = useState('');
  const [idSearch, setIdSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingActions, setLoadingActions] = useState({});

  // Fetch slips data on component mount
  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/slips');
      setSlips(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching slips:', error);
      toast.error('Failed to fetch salary slips');
    } finally {
      setLoading(false);
    }
  };

  // Get unique units from the slips data
  const availableUnits = [...new Set(slips.map((slip) => slip.empUnit).filter((unit) => unit))];

  const filteredData = slips.filter(
    (slip) =>
      slip.empName.toLowerCase().includes(nameSearch.toLowerCase()) &&
      slip.empId.toLowerCase().includes(idSearch.toLowerCase()) &&
      (selectedUnit === '' || slip.empUnit === selectedUnit)
  );

  const getMonthName = (monthNumber) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[monthNumber - 1] || monthNumber;
  };

  const handleDownload = async (slip) => {
    try {
      setLoadingActions((prev) => ({ ...prev, [slip._id + '_download']: true }));
      const response = await axios.get(`/slips/download/${slip._id}`, {
        responseType: 'blob',
      });

      const fileName = `${slip.empName.replace(/\s+/g, '_')}_${getMonthName(slip.month)}_${slip.year}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [slip._id + '_download']: false }));
    }
  };

  const handleView = async (slip) => {
    try {
      setLoadingActions((prev) => ({ ...prev, [slip._id + '_view']: true }));
      const response = await axios.get(`/slips/view/${slip._id}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, '_blank');

      // Clean up the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error('Failed to view PDF');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [slip._id + '_view']: false }));
    }
  };

  const handleDelete = async (slipId) => {
    if (!window.confirm('Are you sure you want to delete this salary slip?')) return;

    try {
      setLoadingActions((prev) => ({ ...prev, [slipId + '_delete']: true }));
      await axios.delete(`/slips/${slipId}`);
      toast.success('Salary slip deleted successfully');
      // Remove deleted slip from local state
      setSlips((prev) => prev.filter((slip) => slip._id !== slipId));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error deleting slip:', error);
      toast.error('Failed to delete salary slip');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [slipId + '_delete']: false }));
    }
  };

  if (loading) {
    return (
      <div className="salary-slip-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p className="loading-text">Loading salary slips...</p>
        </div>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="salary-slip-page">
      <div className="salary-slip-container">
        {/* Header Section */}
        <div className="salary-slip-header">
          <div className="header-content">
            <h1 className="page-title">Salary Slips</h1>
            <p className="page-subtitle">Manage and view employee salary slips</p>
          </div>
          <div className="header-badge">{filteredData.length} Records</div>
        </div>

        {/* Unit Filter Section */}
        {availableUnits.length > 0 && (
          <div className="filter-section">
            <h3 className="filter-label">Filter by Unit</h3>
            <div className="unit-buttons">
              <button
                className={`unit-btn ${selectedUnit === '' ? 'active' : ''}`}
                onClick={() => setSelectedUnit('')}
              >
                All Units
              </button>
              {availableUnits.map((unit) => (
                <button
                  key={unit}
                  className={`unit-btn ${selectedUnit === unit ? 'active' : ''}`}
                  onClick={() => setSelectedUnit(selectedUnit === unit ? '' : unit)}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="search-section">
          <div className="search-grid">
            <div className="search-group">
              <label className="search-label">Search by Employee Name</label>
              <input
                className="search-input"
                type="text"
                placeholder="Enter employee name..."
                value={nameSearch}
                onChange={(e) => {
                  setNameSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="search-group">
              <label className="search-label">Search by Employee ID</label>
              <input
                className="search-input"
                type="text"
                placeholder="Enter employee ID..."
                value={idSearch}
                onChange={(e) => {
                  setIdSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          Showing <span className="info-highlight">{paginatedData.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)}</span> of <span className="info-highlight">{filteredData.length}</span> results
        </div>

        {/* Table Section */}
        <div className="table-wrapper">
          {filteredData.length > 0 ? (
            <table className="salary-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((slip) => (
                  <tr key={slip._id} className="table-row">
                    <td data-label="Unit">{slip.empUnit || 'N/A'}</td>
                    <td data-label="Employee Name">{slip.empName}</td>
                    <td data-label="Employee ID">{slip.empId}</td>
                    <td data-label="Month">{getMonthName(slip.month)}</td>
                    <td data-label="Year">{slip.year}</td>
                    <td data-label="Actions" className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleView(slip)}
                        disabled={loadingActions[slip._id + '_view']}
                        title="View salary slip"
                      >
                        {loadingActions[slip._id + '_view'] ? <LoadingSpinner /> : 'View'}
                      </button>
                      <button
                        className="action-btn download-btn"
                        onClick={() => handleDownload(slip)}
                        disabled={loadingActions[slip._id + '_download']}
                        title="Download salary slip"
                      >
                        {loadingActions[slip._id + '_download'] ? <LoadingSpinner /> : 'Download'}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(slip._id)}
                        disabled={loadingActions[slip._id + '_delete']}
                        title="Delete salary slip"
                      >
                        {loadingActions[slip._id + '_delete'] ? <LoadingSpinner /> : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data">
              <p className="no-data-text">No salary slips found</p>
              <p className="no-data-subtext">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="pagination-section">
            <button
              className="pagination-btn prev-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              className="pagination-btn next-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}

        {/* Page Info */}
        <div className="page-info">
          Page <span className="info-highlight">{currentPage}</span> of <span className="info-highlight">{totalPages}</span>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default SalarySlip;
