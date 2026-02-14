import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './HrAssets.css';

/* ============================
   EMPTY FORM
============================ */
const emptyForm = {
  empId: '',        // employee empId OR 'HOD' / 'DIR'
  empName: '',      // employee / hod / director name
  department: '',   // department or designation
  itemName: '',
  serialNumber: '',
  issuedDate: '',
  condition: '',
  notes: '',
  status: 'issued',
};

const HrAssets = () => {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // 🔍 search dropdown
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  /* ============================
     FETCH ASSETS
  ============================ */
  const fetchAssets = async () => {
    try {
      const res = await axios.get('/assets');
      setAssets(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setAssets([]);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  /* ============================
     SEARCH EMPLOYEE / HOD / DIRECTOR
  ============================ */
  const searchPeople = async (q) => {
    if (!q.trim()) {
      setPeople([]);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await axios.get(`/assets/search?q=${q}`);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setPeople(list);
      setShowDropdown(list.length > 0);
    } catch (err) {
      console.error(err);
      setPeople([]);
      setShowDropdown(false);
    }
  };

  /* ============================
     SUBMIT
  ============================ */
  const submit = async (e) => {
    e.preventDefault();

    if (!form.empName) {
      toast.error('Please select a person from the dropdown');
      return;
    }

    try {
      editingId
        ? await axios.put(`/assets/${editingId}`, form)
        : await axios.post('/assets', form);

      toast.success(editingId ? 'Asset updated' : 'Asset added');
      setForm(emptyForm);
      setEditingId(null);
      setSearch('');
      setShowDropdown(false);
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save asset');
    }
  };

  /* ============================
     DELETE
  ============================ */
  const remove = async (id) => {
    if (!window.confirm('Delete asset?')) return;

    try {
      await axios.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      fetchAssets();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="hr-assets-page">
      <div className="hr-assets-container">
        <ToastContainer />

        {/* Header */}
        <div className="hr-assets-header">
          <h1 className="header-title">Employee Assets</h1>
          <p className="header-subtitle">Manage company-issued assets</p>
        </div>

        {/* Add / Edit */}
        <div className="hr-assets-card">
          <div className="card-section-title">
            {editingId ? 'Edit Asset' : 'Add Asset'}
          </div>

          <form onSubmit={submit}>
            <div className="form-grid">

              {/* Search */}
              <div className="form-group" style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  placeholder="Search employee / HOD / Director"
                  value={search}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearch(v);
                    searchPeople(v);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />

                {showDropdown && people.length > 0 && (
                  <div className="employee-dropdown">
                    {people.map((p, i) => (
                      <div
                        key={i}
                        className="dropdown-item"
                        onMouseDown={() => {
                          setSearch(p.empName);
                          setForm({
                            ...form,
                            empId: p.empId || null,
                            empName: p.empName,
                            department: p.department,
                          });
                          setShowDropdown(false);
                        }}
                      >
                        <strong>{p.empName}</strong>
                        <div className="dropdown-item-meta">
                          {p.department}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                className="form-input"
                placeholder="Item Name"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                required
              />

              <input
                className="form-input"
                placeholder="Serial Number"
                value={form.serialNumber}
                onChange={(e) =>
                  setForm({ ...form, serialNumber: e.target.value })
                }
              />

              <input
                className="form-input"
                type="date"
                value={form.issuedDate}
                onChange={(e) =>
                  setForm({ ...form, issuedDate: e.target.value })
                }
                required
              />

              <input
                className="form-input"
                placeholder="Condition"
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
              />

              <input
                className="form-input"
                placeholder="Notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
              />

              <select
                className="form-select"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option value="issued">Issued</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            <div className="actions-row">
              <button className="btn-primary" type="submit">
                {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="hr-assets-card">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Item</th>
                <th>Issued</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a._id}>
                  <td>{a.empId || a.assigneeRole?.toUpperCase() || 'N/A'}</td>
                  <td>{a.assigneeName}</td>
                  <td>{a.department}</td>
                  <td>{a.itemName}</td>
                  <td>{new Date(a.issuedDate).toLocaleDateString()}</td>
                  <td>{a.status.toUpperCase()}</td>
                  <td>
                    <button
                      className="table-action-btn btn-delete"
                      onClick={() => remove(a._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default HrAssets;
