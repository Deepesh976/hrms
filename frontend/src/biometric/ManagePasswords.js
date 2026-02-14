import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FaKey, FaSearch, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/ManagePasswords.css';

/* =========================================================
   TOKEN HELPER
========================================================= */
const getAuthToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    JSON.parse(localStorage.getItem('user') || '{}')?.token ||
    null
  );
};

export default function ManagePasswords() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  /* =========================================================
     FETCH USERS
  ========================================================= */
  useEffect(() => {
    const fetchUsers = async () => {
      const token = getAuthToken();
      if (!token) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/users/with-employee', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data.items || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  /* =========================================================
     FILTER + SEARCH
  ========================================================= */
  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase();

    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      return (
        (u.user_name || '').toLowerCase().includes(q) ||
        String(u.mobile_no || '').includes(q) ||
        String(u.empId || '').includes(q)
      );
    });
  }, [users, query, roleFilter]);

  /* =========================================================
     PAGINATION
  ========================================================= */
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const startIdx = filteredUsers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(currentPage * rowsPerPage, filteredUsers.length);

  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(1);
      if (startPage > 2) buttons.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push('...');
      buttons.push(totalPages);
    }

    return buttons;
  };

  /* =========================================================
     RESET PASSWORD
  ========================================================= */
  const handleResetPassword = async (user) => {
    const token = getAuthToken();
    if (!token) return alert('Session expired');

    const confirmReset = window.confirm(
      `Reset password for ${user.user_name}?\n\nNew password: 123456789`
    );

    if (!confirmReset) return;

    try {
      await axios.post(
        `/api/users/${user._id}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ Password reset successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Password reset failed');
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      employee: 'badge-employee',
      hod: 'badge-hod',
      director: 'badge-director',
    };
    return roleMap[role] || 'badge-default';
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="pwd-page">
      <div className="pwd-container">
        {/* Header */}
        <div className="pwd-header">
          <div className="pwd-header-content">
            <div className="pwd-header-icon">
              <FaKey />
            </div>
            <div>
              <h1 className="pwd-title">Reset User Passwords</h1>
              <p className="pwd-subtitle">
                Securely reset user passwords to default <strong>123456789</strong>.
                Users must change it after their next login.
              </p>
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="pwd-controls">
          <div className="pwd-search-wrapper">
            <FaSearch className="pwd-search-icon" />
            <input
              type="text"
              placeholder="Search by name, mobile, or employee ID..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pwd-search-input"
            />
          </div>

          <div className="pwd-filter-wrapper">
            <FaFilter className="pwd-filter-icon" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="pwd-filter-select"
            >
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="hod">HOD</option>
              <option value="director">Director</option>
            </select>
          </div>

          <div className="pwd-stats">
            <div className="pwd-stat">
              <span className="pwd-stat-label">Total Results</span>
              <span className="pwd-stat-value">{filteredUsers.length}</span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="pwd-table-section">
          {loading && (
            <div className="pwd-loading">
              <div className="pwd-spinner"></div>
              <p>Loading users...</p>
            </div>
          )}

          {error && (
            <div className="pwd-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <div className="pwd-empty">
              <p>No users found</p>
            </div>
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <>
              <div className="pwd-table-wrapper">
                <table className="pwd-table">
                  <thead>
                    <tr>
                      <th className="pwd-th-number">#</th>
                      <th>Emp ID</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Mobile</th>
                      <th className="pwd-th-action">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedUsers.map((u, i) => (
                      <tr key={u._id} className="pwd-table-row">
                        <td className="pwd-td-number">
                          {(currentPage - 1) * rowsPerPage + i + 1}
                        </td>
                        <td className="pwd-td-id">
                          <code>{u.empId || '-'}</code>
                        </td>
                        <td className="pwd-td-name">
                          <span className="pwd-user-name">{u.user_name}</span>
                        </td>
                        <td>
                          <span className={`pwd-badge ${getRoleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="pwd-td-phone">
                          {u.mobile_no || '-'}
                        </td>
                        <td className="pwd-td-action">
                          <button
                            className="pwd-reset-btn"
                            onClick={() => handleResetPassword(u)}
                            title="Reset password to 123456789"
                          >
                            <FaKey /> Reset
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modern Pagination */}
              <div className="pwd-pagination">
                <div className="pwd-pagination-info">
                  Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{' '}
                  <strong>{filteredUsers.length}</strong> results
                </div>

                <div className="pwd-pagination-controls">
                  <button
                    className="pwd-pagination-btn pwd-pagination-prev"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    <FaChevronLeft /> Prev
                  </button>

                  <div className="pwd-pagination-numbers">
                    {getPaginationButtons().map((btn, idx) => (
                      <button
                        key={idx}
                        className={`pwd-pagination-num ${
                          btn === currentPage ? 'active' : ''
                        } ${btn === '...' ? 'dots' : ''}`}
                        onClick={() => {
                          if (typeof btn === 'number') {
                            setCurrentPage(btn);
                          }
                        }}
                        disabled={btn === '...'}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>

                  <button
                    className="pwd-pagination-btn pwd-pagination-next"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    Next <FaChevronRight />
                  </button>
                </div>

                <div className="pwd-pagination-meta">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
