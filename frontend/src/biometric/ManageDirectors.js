import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaEdit, FaTrash, FaUserPlus, FaUserMinus, FaTimes } from 'react-icons/fa';
import AdminNavbar from '../components/Navbar/adminnavbar';
import SuperNavbar from '../components/Navbar/supernavbar';
import '../styles/ManageDirectors.css';

const ManageDirectors = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [directors, setDirectors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [unassignedHODs, setUnassignedHODs] = useState([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentDirector, setCurrentDirector] = useState(null);
  const [assignmentTab, setAssignmentTab] = useState('hods');
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    employeeId: ''
  });
  
  const [selectedDirectorId, setSelectedDirectorId] = useState('');
  const [selectedHODs, setSelectedHODs] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignedHODs, setAssignedHODs] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [hodsSearchTerm, setHodsSearchTerm] = useState('');
  const [assignedHodsSearchTerm, setAssignedHodsSearchTerm] = useState('');
  const [employeesSearchTerm, setEmployeesSearchTerm] = useState('');
  const [assignedEmployeesSearchTerm, setAssignedEmployeesSearchTerm] = useState('');
  const [editPassword, setEditPassword] = useState('');

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    setRole(userRole);
    if (!['super_admin', 'hrms_handler', 'superadmin', 'admin'].includes(userRole)) {
      toast.error('Access denied');
      navigate('/dashboard');
      return;
    }
    
    fetchDirectors();
    fetchEmployees();
    fetchUnassignedHODs();
    fetchUnassignedEmployees();
  }, [navigate]);

  const fetchDirectors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/directors');
      setDirectors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching Directors:', error);
      toast.error('Failed to fetch Directors');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees');
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchUnassignedHODs = async () => {
    try {
      const response = await axios.get('/directors/unassigned-hods');
      setUnassignedHODs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching unassigned HODs:', error);
    }
  };

  const fetchUnassignedEmployees = async () => {
    try {
      const response = await axios.get('/directors/unassigned-employees');
      setUnassignedEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching unassigned employees:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
if (!formData.name || !formData.username) {
  toast.error('Name and username are required');
  return;
}
    try {
      setLoading(true);
await axios.post('/directors', {
  name: formData.name,
  username: formData.username,
  email: formData.email || null,
  employeeId: formData.employeeId || null
});


      toast.success('Director created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchDirectors();
    } catch (error) {
      console.error('Error creating Director:', error);
      toast.error(error.response?.data?.message || 'Failed to create Director');
    } finally {
      setLoading(false);
    }
  };

const handleEdit = async (e) => {
  e.preventDefault();

  if (loading) return;

if (!formData.name || !formData.username) {
  toast.error('Name and username are required');
  return;
}

  const payload = {
    name: formData.name, 
    username: formData.username,
    email: formData.email || null,
    employeeId: formData.employeeId || null,
  };

  // ✅ only update password if user typed it
if (editPassword) {
  payload.password = editPassword;
}


  try {
    setLoading(true);
    await axios.put(`/directors/${currentDirector._id}`, payload);
    toast.success('Director updated successfully!');
    setShowEditModal(false);
    resetForm();
    fetchDirectors();
  } catch (error) {
    console.error('Error updating Director:', error);
    toast.error(error.response?.data?.message || 'Failed to update Director');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (directorId) => {
    if (loading) return;
    if (!window.confirm('Are you sure you want to delete this Director? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/directors/${directorId}`);
      toast.success('Director deleted successfully!');
      fetchDirectors();
      fetchUnassignedHODs();
      fetchUnassignedEmployees();
    } catch (error) {
  console.error('Error deleting Director:', error);

  if (error.response?.status === 409) {
    toast.error(error.response.data.message);
  } else if (error.response?.status === 404) {
    toast.error('Director not found or already deleted');
  } else {
    toast.error('Failed to delete Director');
  }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (director) => {
    setCurrentDirector(director);
    setFormData({
      name: director.name || '',
      username: director.username,
      email: director.email || '',
      employeeId: director.employeeInfo?._id || ''
    });
    setEditPassword('');
    setShowEditModal(true);
  };

  const openAssignModal = async (director) => {
    setCurrentDirector(director);
    setSelectedDirectorId(director._id);
    setAssignedHODs(director.assignedHODs || []);
    setAssignedEmployees(director.assignedEmployees || []);
    setHodsSearchTerm('');
    setAssignedHodsSearchTerm('');
    setEmployeesSearchTerm('');
    setAssignedEmployeesSearchTerm('');
    
    try {
      const response = await axios.get(`/directors/${director._id}`);
      setAssignedHODs(response.data.data.assignedHODs || []);
      setAssignedEmployees(response.data.data.assignedEmployees || []);
    } catch (error) {
      console.error('Error fetching director details:', error);
    }
    
    setShowAssignModal(true);
  };

  const filteredUnassignedHODs = unassignedHODs.filter(hod =>
    hod.username?.toLowerCase().includes(hodsSearchTerm.toLowerCase()) ||
    hod.email?.toLowerCase().includes(hodsSearchTerm.toLowerCase())
  );

  const filteredAssignedHODs = assignedHODs.filter(hod =>
    hod.username?.toLowerCase().includes(assignedHodsSearchTerm.toLowerCase()) ||
    hod.email?.toLowerCase().includes(assignedHodsSearchTerm.toLowerCase())
  );

  const filteredUnassignedEmployees = unassignedEmployees.filter(emp =>
    emp.empName?.toLowerCase().includes(employeesSearchTerm.toLowerCase()) ||
    emp.empId?.toLowerCase().includes(employeesSearchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(employeesSearchTerm.toLowerCase())
  );

  const filteredAssignedEmployees = assignedEmployees.filter(emp =>
    emp.empName?.toLowerCase().includes(assignedEmployeesSearchTerm.toLowerCase()) ||
    emp.empId?.toLowerCase().includes(assignedEmployeesSearchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(assignedEmployeesSearchTerm.toLowerCase())
  );

  const handleAssignHODs = async () => {
    if (selectedHODs.length === 0) {
      toast.error('Please select at least one HOD');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/directors/${selectedDirectorId}/assign-hods`, {
        hodIds: selectedHODs
      });
      
      const { success, failed } = response.data.data;
      
      if (success.length > 0) {
        toast.success(`${success.length} HOD(s) assigned successfully!`);
      }
      
      if (failed.length > 0) {
        failed.forEach(item => {
          toast.warning(`${item.hodName || item.hodId}: ${item.reason}`);
        });
      }
      
      setSelectedHODs([]);
      fetchDirectors();
      fetchUnassignedHODs();
      
      const directorResponse = await axios.get(`/directors/${selectedDirectorId}`);
      setAssignedHODs(directorResponse.data.data.assignedHODs || []);
    } catch (error) {
      console.error('Error assigning HODs:', error);
      toast.error(error.response?.data?.message || 'Failed to assign HODs');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEmployees = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/directors/${selectedDirectorId}/assign-employees`, {
        employeeIds: selectedEmployees
      });
      
      const { success, failed } = response.data.data;
      
      if (success.length > 0) {
        toast.success(`${success.length} employee(s) assigned successfully!`);
      }
      
      if (failed.length > 0) {
        failed.forEach(item => {
          toast.warning(`${item.empName || item.empId}: ${item.reason}`);
        });
      }
      
      setSelectedEmployees([]);
      fetchDirectors();
      fetchUnassignedEmployees();
      
      const directorResponse = await axios.get(`/directors/${selectedDirectorId}`);
      setAssignedEmployees(directorResponse.data.data.assignedEmployees || []);
    } catch (error) {
      console.error('Error assigning employees:', error);
      toast.error(error.response?.data?.message || 'Failed to assign employees');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignHOD = async (hodId) => {
    if (!window.confirm('Are you sure you want to unassign this HOD?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/directors/${selectedDirectorId}/unassign-hod/${hodId}`);
      toast.success('HOD unassigned successfully!');
      fetchDirectors();
      fetchUnassignedHODs();
      
      const directorResponse = await axios.get(`/directors/${selectedDirectorId}`);
      setAssignedHODs(directorResponse.data.data.assignedHODs || []);
    } catch (error) {
      console.error('Error unassigning HOD:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign HOD');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to unassign this employee?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/directors/${selectedDirectorId}/unassign-employee/${employeeId}`);
      toast.success('Employee unassigned successfully!');
      fetchDirectors();
      fetchUnassignedEmployees();
      
      const directorResponse = await axios.get(`/directors/${selectedDirectorId}`);
      setAssignedEmployees(directorResponse.data.data.assignedEmployees || []);
    } catch (error) {
      console.error('Error unassigning employee:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign employee');
    } finally {
      setLoading(false);
    }
  };

const resetForm = () => {
  setFormData({
    name: '',
    username: '',
    email: '',
    employeeId: ''
  });
  setEditPassword(''); // ✅ clear password safely
};



  const renderNavbar = () => {
    if (role === 'superadmin' || role === 'super_admin') return <SuperNavbar />;
    if (role === 'admin' || role === 'hrms_handler') return <AdminNavbar />;
    return null;
  };

  return (
    <>
      {renderNavbar()}
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="manage-directors-container">
        <div className="directors-header">
          <div>
            <h1 className="directors-title">Manage Directors</h1>
            <p className="directors-subtitle">Create and manage Directors with HOD and employee assignments</p>
          </div>
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> Create Director
          </button>
        </div>

        {/* Directors Table */}
        <div className="directors-table-section">
          <div className="directors-table-header">
            <h2 className="directors-table-title">Directors List</h2>
          </div>
          
          {loading && <div className="loading-spinner">Loading...</div>}
          
          {!loading && directors.length === 0 && (
            <div className="no-data">No Directors found. Create one to get started.</div>
          )}
          
          {!loading && directors.length > 0 && (
            <div className="table-wrapper">
              <table className="directors-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Employee Info</th>
                    <th>Assigned HODs</th>
                    <th>Assigned Employees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {directors.map((director) => (
                    <tr key={director._id}>
                      <td><strong>{director.name || 'N/A'}</strong></td>
                      <td><strong>{director.username}</strong></td>
                      <td>{director.email || 'N/A'}</td>
                      <td>
                        {director.employeeInfo ? (
                          <div className="employee-info-cell">
                            <span className="employee-name">{director.employeeInfo.empName}</span>
                            <span className="employee-details">
                              {director.employeeInfo.empId} | {director.employeeInfo.department}
                            </span>
                          </div>
                        ) : 'No employee linked'}
                      </td>
                      <td>
                        <span className="count-badge hods">
                          {director.assignedHODsCount || 0} HODs
                        </span>
                      </td>
                      <td>
                        <span className="count-badge employees">
                          {director.assignedEmployeesCount || 0} Employees
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="directors-btn btn-assign"
                            onClick={() => openAssignModal(director)}
                            title="Assign HODs & Employees"
                          >
                            <FaUserPlus /> Assign
                          </button>
                          <button
                            className="directors-btn btn-edit"
                            onClick={() => openEditModal(director)}
                            title="Edit Director"
                          >
                            <FaEdit /> Edit
                          </button>
<button
  className="directors-btn btn-delete"
  onClick={() => handleDelete(director._id)}
  title={
    director.assignedHODsCount > 0 || director.assignedEmployeesCount > 0
      ? 'Unassign all HODs and Employees before deleting'
      : 'Delete Director'
  }
  disabled={
    director.assignedHODsCount > 0 || director.assignedEmployeesCount > 0
  }
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

        {/* Create Director Modal */}
        {showCreateModal && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h2 className="modal-title">Create New Director</h2>
                <button className="modal-close" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleCreate}>
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
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email (optional)"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Link to Employee (Optional)</label>
                    <select
                      className="form-select"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.empName} ({emp.empId}) - {emp.department}
                        </option>
                      ))}
                    </select>
                    <span className="form-help-text">Select an employee to link this Director account</span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    <FaPlus /> {loading ? 'Creating...' : 'Create Director'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Director Modal */}
        {showEditModal && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h2 className="modal-title">Edit Director</h2>
                <button className="modal-close" onClick={() => { setShowEditModal(false); resetForm(); }}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleEdit}>
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
    required
  />
</div>

                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (leave blank to keep current)</label>
<input
  type="password"
  className="form-input"
  value={editPassword}
  onChange={(e) => setEditPassword(e.target.value)}
  placeholder="Leave blank to keep current password"
/>

                  </div>

                  <div className="form-group">
                    <label className="form-label">Link to Employee (Optional)</label>
                    <select
                      className="form-select"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.empName} ({emp.empId}) - {emp.department}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    <FaEdit /> {loading ? 'Updating...' : 'Update Director'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Modal (HODs & Employees) */}
        {showAssignModal && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h2 className="modal-title">
  Assign to {currentDirector?.name || currentDirector?.username}
</h2>
                <button className="modal-close" onClick={() => { setShowAssignModal(false); setSelectedHODs([]); setSelectedEmployees([]); }}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                {/* Tabs */}
                <div className="tabs-container">
                  <button
                    className={`tab-button ${assignmentTab === 'hods' ? 'active' : ''}`}
                    onClick={() => setAssignmentTab('hods')}
                  >
                    Assign HODs
                  </button>
                  <button
                    className={`tab-button ${assignmentTab === 'employees' ? 'active' : ''}`}
                    onClick={() => setAssignmentTab('employees')}
                  >
                    Assign Employees
                  </button>
                </div>

                {/* HODs Tab */}
                {assignmentTab === 'hods' && (
                  <>
                    {/* Select HODs Section */}
                    <div className="section-container">
                      <div className="section-header">
                        <h3 className="section-header-title">Select HODs to Assign</h3>
                        <span className="selection-counter">{selectedHODs.length} Selected</span>
                      </div>

                      <div className="search-container">
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            className="search-input"
                            placeholder="Search by username or email..."
                            value={hodsSearchTerm}
                            onChange={(e) => setHodsSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {filteredUnassignedHODs.length === 0 ? (
                        <div className="empty-list-message">
                          {unassignedHODs.length === 0 ? 'No unassigned HODs available' : 'No HODs match your search'}
                        </div>
                      ) : (
                        <div className="employee-list-container">
                          {filteredUnassignedHODs.map((hod) => (
                            <div key={hod._id} className="employee-list-item">
                              <input
                                type="checkbox"
                                className="employee-checkbox"
                                checked={selectedHODs.includes(hod._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedHODs([...selectedHODs, hod._id]);
                                  } else {
                                    setSelectedHODs(selectedHODs.filter(id => id !== hod._id));
                                  }
                                }}
                              />
                              <div className="employee-info">
                                <span className="employee-name">
  {hod.name || hod.username}
</span>
                                <span className="employee-meta">{hod.email || 'No email'} • {hod.assignedEmployees?.length || 0} employees</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assign Button */}
                    <button
                      className="btn-primary"
                      onClick={handleAssignHODs}
                      disabled={loading || selectedHODs.length === 0}
                      style={{ width: '100%', marginBottom: '2rem' }}
                    >
                      <FaUserPlus /> Assign {selectedHODs.length} HOD(s)
                    </button>

                    {/* Currently Assigned HODs Section */}
                    <div className="section-container">
                      <div className="section-header">
                        <h3 className="section-header-title">Currently Assigned HODs</h3>
                        <span className="selection-counter">{filteredAssignedHODs.length} Showing</span>
                      </div>

                      <div className="search-container">
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            className="search-input"
                            placeholder="Search assigned HODs..."
                            value={assignedHodsSearchTerm}
                            onChange={(e) => setAssignedHodsSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {filteredAssignedHODs.length === 0 ? (
                        <div className="empty-list-message">
                          {assignedHODs.length === 0 ? 'No HODs assigned yet' : 'No HODs match your search'}
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="directors-table">
                            <thead>
                              <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Employees</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAssignedHODs.map((hod) => (
                                <tr key={hod._id}>
                                  <td><strong>{hod.username}</strong></td>
                                  <td>{hod.email || 'N/A'}</td>
                                  <td>{hod.assignedEmployees?.length || 0}</td>
                                  <td>
                                    <button
                                      className="directors-btn btn-unassign"
                                      onClick={() => handleUnassignHOD(hod._id)}
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
                  </>
                )}

                {/* Employees Tab */}
                {assignmentTab === 'employees' && (
                  <>
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
                            value={employeesSearchTerm}
                            onChange={(e) => setEmployeesSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {filteredUnassignedEmployees.length === 0 ? (
                        <div className="empty-list-message">
                          {unassignedEmployees.length === 0 ? 'No unassigned employees available' : 'No employees match your search'}
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
                                    setSelectedEmployees(selectedEmployees.filter(id => id !== emp._id));
                                  }
                                }}
                              />
                              <div className="employee-info">
                                <span className="employee-name">{emp.empName}</span>
                                <span className="employee-meta">{emp.empId} • {emp.department}</span>
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
                            value={assignedEmployeesSearchTerm}
                            onChange={(e) => setAssignedEmployeesSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {filteredAssignedEmployees.length === 0 ? (
                        <div className="empty-list-message">
                          {assignedEmployees.length === 0 ? 'No employees directly assigned yet' : 'No employees match your search'}
                        </div>
                      ) : (
                        <div className="table-wrapper">
                          <table className="directors-table">
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
                                      className="directors-btn btn-unassign"
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
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setShowAssignModal(false); setSelectedHODs([]); setSelectedEmployees([]); }}
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

export default ManageDirectors;