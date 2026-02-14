import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaUserMinus,
  FaTimes,
} from 'react-icons/fa';

import AdminNavbar from '../components/Navbar/adminnavbar';
import SuperNavbar from '../components/Navbar/supernavbar';
import '../styles/ManageHODs.css';

const DEPARTMENTS = ['Human Resource', 'Design & Development', 'Manufacturing Unit', 'Marketing', 'Production', 'Purchase', 'Quality Assurance', 'Stores', 'Finance & Accounts', 'Audit', 'IT', 'Vendor Development'];

const ManageHODs = () => {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [role, setRole] = useState('');
  const [hods, setHods] = useState([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);

  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [currentHOD, setCurrentHOD] = useState(null);
  const [selectedHODId, setSelectedHODId] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [unassignedSearchTerm, setUnassignedSearchTerm] = useState('');
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    department: '',
  });

  /* ================= EFFECT ================= */
  useEffect(() => {
    const userRole = localStorage.getItem('role');
    setRole(userRole);

    if (!['super_admin', 'hrms_handler', 'superadmin', 'admin'].includes(userRole)) {
      toast.error('Access denied');
      navigate('/dashboard');
      return;
    }

    fetchHODs();
    fetchUnassignedEmployees();
  }, [navigate]);

  /* ================= API ================= */
  const fetchHODs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/hods');
      setHods(res.data.data || []);
    } catch {
      toast.error('Failed to fetch HODs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedEmployees = async () => {
    try {
      const res = await axios.get('/hods/unassigned-employees');
      setUnassignedEmployees(res.data.data || []);
    } catch {}
  };

  /* ================= HELPERS ================= */
  const resetForm = () => {
    setFormData({ name: '', username: '', email: '', department: '' });
    setCurrentHOD(null);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedEmployees([]);
    setAssignedEmployees([]);
    setSelectedHODId('');
    setUnassignedSearchTerm('');
    setAssignedSearchTerm('');
  };

  /* ================= CREATE ================= */
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/hods', formData);
      toast.success('HOD created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchHODs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const openEditModal = (hod) => {
    setCurrentHOD(hod);
    setFormData({
      name: hod.name,
      username: hod.username,
      email: hod.email || '',
      department: hod.department,
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`/hods/${currentHOD._id}`, formData);
      toast.success('HOD updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchHODs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this HOD?')) return;
    try {
      setLoading(true);
      await axios.delete(`/hods/${id}`);
      toast.success('HOD deleted');
      fetchHODs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= ASSIGN ================= */
  const openAssignModal = async (hod) => {
    setCurrentHOD(hod);
    setSelectedHODId(hod._id);
    setShowAssignModal(true);
    const res = await axios.get(`/hods/${hod._id}/employees`);
    setAssignedEmployees(res.data.data || []);
  };

  const handleAssignEmployees = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/hods/${selectedHODId}/assign-employees`, {
        employeeIds: selectedEmployees,
      });
      toast.success('Employees assigned successfully');
      setSelectedEmployees([]);
      fetchHODs();
      fetchUnassignedEmployees();
      const res = await axios.get(`/hods/${selectedHODId}/employees`);
      setAssignedEmployees(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignEmployee = async (empId) => {
    if (!window.confirm('Are you sure you want to unassign this employee?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/hods/${selectedHODId}/unassign-employee/${empId}`);
      toast.success('Employee unassigned successfully');
      fetchHODs();
      fetchUnassignedEmployees();
      const res = await axios.get(`/hods/${selectedHODId}/employees`);
      setAssignedEmployees(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unassign failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTERS ================= */
  const filteredUnassignedEmployees = unassignedEmployees.filter(emp =>
    emp.empName?.toLowerCase().includes(unassignedSearchTerm.toLowerCase()) ||
    emp.empId?.toLowerCase().includes(unassignedSearchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(unassignedSearchTerm.toLowerCase())
  );

  const filteredAssignedEmployees = assignedEmployees.filter(emp =>
    emp.empName?.toLowerCase().includes(assignedSearchTerm.toLowerCase()) ||
    emp.empId?.toLowerCase().includes(assignedSearchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(assignedSearchTerm.toLowerCase())
  );

  const renderNavbar = () => {
    if (role === 'superadmin' || role === 'super_admin') return <SuperNavbar />;
    if (role === 'admin' || role === 'hrms_handler') return <AdminNavbar />;
    return null;
  };

  /* ================= RENDER ================= */
  return (
    <>
      {renderNavbar()}
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="manage-hods-container">
        <div className="hods-header">
          <div>
            <h1 className="hods-title">Manage HODs</h1>
            <p className="hods-subtitle">Create and manage department heads with employee assignments</p>
          </div>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> Create HOD
          </button>
        </div>

        {/* HODs Table */}
        <div className="hods-table-section">
          <div className="hods-table-header">
            <h2 className="hods-table-title">HODs List</h2>
          </div>

          {loading && <div className="loading-spinner">Loading...</div>}

          {!loading && hods.length === 0 && (
            <div className="no-data">No HODs found. Create one to get started.</div>
          )}

          {!loading && hods.length > 0 && (
            <div className="table-wrapper">
              <table className="hods-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Assigned Employees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hods.map((hod) => (
                    <tr key={hod._id}>
                      <td><strong>{hod.name}</strong></td>
                      <td><strong>{hod.username}</strong></td>
                      <td>{hod.email || 'N/A'}</td>
                      <td>{hod.department}</td>
                      <td>
                        <span className="count-badge employees">
                          {hod.assignedEmployeesCount || 0} Employees
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="hods-btn btn-assign"
                            onClick={() => openAssignModal(hod)}
                            title="Assign Employees"
                          >
                            <FaUserPlus /> Assign
                          </button>
                          <button
                            className="hods-btn btn-edit"
                            onClick={() => openEditModal(hod)}
                            title="Edit HOD"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className="hods-btn btn-delete"
                            onClick={() => handleDelete(hod._id)}
                            title={
                              hod.assignedEmployeesCount > 0
                                ? 'Unassign all employees before deleting'
                                : 'Delete HOD'
                            }
                            disabled={hod.assignedEmployeesCount > 0}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit HOD Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h2 className="modal-title">{showEditModal ? 'Edit HOD' : 'Create New HOD'}</h2>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={showEditModal ? handleEdit : handleCreate}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Enter phone number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email (optional)"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      required
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {showEditModal ? (
                      <>
                        <FaEdit /> {loading ? 'Updating...' : 'Update HOD'}
                      </>
                    ) : (
                      <>
                        <FaPlus /> {loading ? 'Creating...' : 'Create HOD'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Employees Modal */}
        {showAssignModal && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h2 className="modal-title">
                  Assign Employees to {currentHOD?.name || currentHOD?.username}
                </h2>
                <button className="modal-close" onClick={closeAssignModal}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                {/* Select Employees Section */}
                <div className="section-container">
                  <div className="section-header">
                    <h3 className="section-header-title">Select Employees to Assign</h3>
                    <span className="selection-counter">{selectedEmployees.length} Selected</span>
                  </div>

                  <div className="search-container">
                    <div className="search-input-wrapper">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, ID, or department..."
                        value={unassignedSearchTerm}
                        onChange={(e) => setUnassignedSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredUnassignedEmployees.length === 0 ? (
                    <div className="empty-list-message">
                      {unassignedEmployees.length === 0
                        ? 'No unassigned employees available'
                        : 'No employees match your search'}
                    </div>
                  ) : (
                    <div className="employee-list-container">
                      {filteredUnassignedEmployees.map((emp) => (
                        <div key={emp._id} className="employee-list-item">
                          <input
                            type="checkbox"
                            className="employee-checkbox"
                            checked={selectedEmployees.includes(emp._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees([...selectedEmployees, emp._id]);
                              } else {
                                setSelectedEmployees(
                                  selectedEmployees.filter((id) => id !== emp._id)
                                );
                              }
                            }}
                          />
                          <div className="employee-info">
                            <span className="employee-name">{emp.empName}</span>
                            <span className="employee-meta">
                              {emp.empId} • {emp.department}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assign Button */}
                <button
                  className="btn-primary"
                  onClick={handleAssignEmployees}
                  disabled={loading || selectedEmployees.length === 0}
                  style={{ width: '100%', marginBottom: '2rem' }}
                >
                  <FaUserPlus /> Assign {selectedEmployees.length} Employee(s)
                </button>

                {/* Currently Assigned Employees Section */}
                <div className="section-container">
                  <div className="section-header">
                    <h3 className="section-header-title">Currently Assigned Employees</h3>
                    <span className="selection-counter">{filteredAssignedEmployees.length} Showing</span>
                  </div>

                  <div className="search-container">
                    <div className="search-input-wrapper">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search assigned employees..."
                        value={assignedSearchTerm}
                        onChange={(e) => setAssignedSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredAssignedEmployees.length === 0 ? (
                    <div className="empty-list-message">
                      {assignedEmployees.length === 0
                        ? 'No employees assigned yet'
                        : 'No employees match your search'}
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="hods-table">
                        <thead>
                          <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAssignedEmployees.map((emp) => (
                            <tr key={emp._id}>
                              <td>{emp.empId}</td>
                              <td><strong>{emp.empName}</strong></td>
                              <td>{emp.department || 'N/A'}</td>
                              <td>
                                <button
                                  className="hods-btn btn-unassign"
                                  onClick={() => handleUnassignEmployee(emp._id)}
                                >
                                  <FaUserMinus /> Unassign
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeAssignModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageHODs;
