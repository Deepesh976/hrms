import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { toast, ToastContainer } from 'react-toastify';
import { FaEye, FaDownload, FaTrash } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import './SalarySlip.css';

const SalarySlip = () => {
  const [nameSearch, setNameSearch] = useState('');
  const [idSearch, setIdSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch slips data on component mount
  useEffect(() => {
    fetchSlips();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameSearch, idSearch, selectedUnit]);

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/slips');
      setSlips(response.data);
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

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setLoadingStates((prev) => ({ ...prev, [`download-${slip._id}`]: true }));
    try {
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
      setLoadingStates((prev) => ({ ...prev, [`download-${slip._id}`]: false }));
    }
  };

  const handleView = async (slip) => {
    setLoadingStates((prev) => ({ ...prev, [`view-${slip._id}`]: true }));
    try {
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
      setLoadingStates((prev) => ({ ...prev, [`view-${slip._id}`]: false }));
    }
  };

  const handleDelete = async (slipId) => {
    if (!window.confirm('Are you sure you want to delete this salary slip?')) return;

    setLoadingStates((prev) => ({ ...prev, [`delete-${slipId}`]: true }));
    try {
      await axios.delete(`/slips/${slipId}`);
      toast.success('Salary slip deleted successfully');
      // Remove deleted slip from local state
      setSlips((prev) => prev.filter((slip) => slip._id !== slipId));
    } catch (error) {
      console.error('Error deleting slip:', error);
      toast.error('Failed to delete salary slip');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`delete-${slipId}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="salary-slip-page">
        <div className="salary-slip-container">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p className="loading-text">Loading salary slips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-slip-page">
      <div className="salary-slip-container">
        {/* Header Section */}
        <div className="salary-slip-header">
          <div className="header-content">
            <h1>Salary Slip Management</h1>
            <p>View, download, and manage employee salary slips</p>
          </div>
          <div className="header-badge">
            {filteredData.length} Record{filteredData.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Unit Filter Section */}
        {availableUnits.length > 0 && (
          <div className="filter-section">
            <p className="filter-label">Filter by Unit</p>
            <div className="unit-buttons">
              {availableUnits.map((unit) => (
                <button
                  key={unit}
                  className={`unit-btn ${selectedUnit === unit ? 'active' : ''}`}
                  onClick={() => setSelectedUnit((prev) => (prev === unit ? '' : unit))}
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
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>

            <div className="search-group">
              <label className="search-label">Search by Employee ID</label>
              <input
                className="search-input"
                type="text"
                placeholder="Enter employee ID..."
                value={idSearch}
                onChange={(e) => setIdSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Results Info */}
        {filteredData.length > 0 && (
          <div className="results-info">
            Showing <span className="info-highlight">{startIndex + 1}</span> to <span className="info-highlight">{Math.min(endIndex, filteredData.length)}</span> of <span className="info-highlight">{filteredData.length}</span> salary slip{filteredData.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Table Section */}
        {filteredData.length > 0 ? (
          <div className="table-wrapper">
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
                  <tr key={slip._id}>
                    <td>{slip.empUnit || 'N/A'}</td>
                    <td>{slip.empName}</td>
                    <td>{slip.empId}</td>
                    <td>{getMonthName(slip.month)}</td>
                    <td>{slip.year}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleView(slip)}
                          title="View salary slip"
                          disabled={loadingStates[`view-${slip._id}`]}
                        >
                          {loadingStates[`view-${slip._id}`] ? (
                            <span className="btn-loader"></span>
                          ) : (
                            <>
                              <FaEye /> View
                            </>
                          )}
                        </button>
                        <button
                          className="action-btn download-btn"
                          onClick={() => handleDownload(slip)}
                          title="Download salary slip"
                          disabled={loadingStates[`download-${slip._id}`]}
                        >
                          {loadingStates[`download-${slip._id}`] ? (
                            <span className="btn-loader"></span>
                          ) : (
                            <>
                              <FaDownload /> Download
                            </>
                          )}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(slip._id)}
                          title="Delete salary slip"
                          disabled={loadingStates[`delete-${slip._id}`]}
                        >
                          {loadingStates[`delete-${slip._id}`] ? (
                            <span className="btn-loader"></span>
                          ) : (
                            <>
                              <FaTrash /> Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Section */}
            {totalPages > 1 && (
              <div className="pagination-section">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  title="Previous page"
                >
                  ← Previous
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                      title={`Go to page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title="Next page"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Page Info */}
            {filteredData.length > 0 && (
              <div className="page-info">
                Page <span className="info-highlight">{currentPage}</span> of <span className="info-highlight">{totalPages}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">
            <p className="no-data-text">No Salary Slips Found</p>
            <p className="no-data-subtext">
              {nameSearch || idSearch || selectedUnit
                ? 'Try adjusting your search filters'
                : 'No salary slips available at the moment'}
            </p>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default SalarySlip;
