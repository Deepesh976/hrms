import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaSave, FaHistory, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from '../api/axios';
import '../styles/salaryEditModal.css';

/* ---------- FORMULA HELPERS ---------- */

const calculateConsolSalary = (actualCtc) => {
    const J2 = Number(actualCtc);
    if (isNaN(J2) || J2 <= 0) return { value: null, error: 'Error' };

    let cons = null;

    if (J2 < 15285) cons = J2 / 1.1758;
    else if (J2 <= 23757) cons = J2 / 1.1638;
    else if (J2 <= 34298) cons = J2 / 1.1313;
    else if (J2 >= 34299) cons = (J2 - 1800) / 1.0833;
    else return { value: null, error: 'Error' };

    return { value: Math.round(cons), error: null };
};

const calculateBasic = (consol) => {
    const S2 = Number(consol);
    if (isNaN(S2) || S2 <= 0) return { value: null, error: 'Error' };

    let basic = null;

    if (S2 >= 30000) basic = 15000;
    else if (S2 > 13000) basic = S2 * 0.4;
    else if (S2 < 13000) basic = S2 * 0.5;
    else if (S2 === 13000) return { value: null, error: 'Error' };

    return { value: Math.round(basic), error: null };
};

const recalcAllFromCTC = (actualCtcRaw) => {
    const CCA = 1000;
    const TRP_ALW = 1600;

    const consRes = calculateConsolSalary(actualCtcRaw);
    if (consRes.error) return null;

    const CONSILESALARY = consRes.value;
    const basicRes = calculateBasic(CONSILESALARY);
    if (basicRes.error) return null;

    const Basic = basicRes.value;
    const HRA = Math.round(Basic * 0.4);
    const O_ALW1 = Math.round(CONSILESALARY - (Basic + HRA + CCA + TRP_ALW));

    return {
        actualCTC: Number(actualCtcRaw),
        consileSalary: CONSILESALARY,
        basic: Basic,
        hra: HRA,
        cca: CCA,
        trpAlw: TRP_ALW,
        oAlw1: O_ALW1
    };
};

/* ---------- CONSTANTS ---------- */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 2 + i);

/* ---------- COMPONENT ---------- */

const SalaryEditModal = ({ employee, onClose, onSave }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [editingHistoryId, setEditingHistoryId] = useState(null);
    const [editedHistoryRow, setEditedHistoryRow] = useState({});

    // New revision form
    const [newRevision, setNewRevision] = useState({
        actualCTC: '',
        effectiveFromYear: CURRENT_YEAR,
        effectiveFromMonth: 'Apr',
        reason: 'Annual increment'
    });
    const [calculatedNew, setCalculatedNew] = useState(null);

    // Fetch salary history
    const fetchHistory = useCallback(async () => {
        if (!employee?.EmpID) return;

        try {
            setLoading(true);
            const res = await axios.get(`/salary-history/${employee.EmpID}`);
            setSalaryHistory(res.data || []);
        } catch (err) {
            console.error('Fetch history error:', err);
            toast.error('Failed to fetch salary history');
        } finally {
            setLoading(false);
        }
    }, [employee?.EmpID]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Format currency
    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '—';
        return `₹${Number(val).toLocaleString('en-IN')}`;
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Handle new CTC change
    const handleNewCTCChange = (value) => {
        setNewRevision(prev => ({ ...prev, actualCTC: value }));

        const numVal = Number(value);
        if (!isNaN(numVal) && numVal > 0) {
            const calculated = recalcAllFromCTC(numVal);
            setCalculatedNew(calculated);
        } else {
            setCalculatedNew(null);
        }
    };

    // Add new salary revision
    const handleAddRevision = async () => {
        if (!newRevision.actualCTC || !calculatedNew) {
            toast.error('Please enter a valid CTC');
            return;
        }

        try {
            setSaving(true);
            const res = await axios.post(`/salary-history/${employee.EmpID}/add`, {
                ...calculatedNew,
                effectiveFromYear: newRevision.effectiveFromYear,
                effectiveFromMonth: newRevision.effectiveFromMonth,
                reason: newRevision.reason || 'Salary revision',
                updatedBy: 'admin'
            });

            setSalaryHistory(res.data.history || []);
            setNewRevision({
                actualCTC: '',
                effectiveFromYear: CURRENT_YEAR,
                effectiveFromMonth: 'Apr',
                reason: 'Annual increment'
            });
            setCalculatedNew(null);
            toast.success('Salary revision added successfully');

            if (onSave) onSave();
        } catch (err) {
            console.error('Add revision error:', err);
            toast.error(err.response?.data?.message || 'Failed to add revision');
        } finally {
            setSaving(false);
        }
    };

    // Start editing history row
    const handleEditHistory = (entry) => {
        setEditingHistoryId(entry._id);
        setEditedHistoryRow({
            actualCTC: entry.actualCTC,
            consileSalary: entry.consileSalary,
            basic: entry.basic,
            hra: entry.hra,
            cca: entry.cca,
            trpAlw: entry.trpAlw,
            oAlw1: entry.oAlw1,
            reason: entry.reason
        });
    };

    // Handle edit change with recalculation
    const handleEditChange = (field, value) => {
        if (field === 'actualCTC') {
            const numVal = Number(value);
            if (!isNaN(numVal) && numVal > 0) {
                const calculated = recalcAllFromCTC(numVal);
                if (calculated) {
                    setEditedHistoryRow(prev => ({
                        ...prev,
                        ...calculated
                    }));
                    return;
                }
            }
        }

        setEditedHistoryRow(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Save edited history
    const handleSaveHistory = async (historyId) => {
        try {
            setSaving(true);
            await axios.put(`/salary-history/${historyId}`, editedHistoryRow);

            await fetchHistory();
            setEditingHistoryId(null);
            setEditedHistoryRow({});
            toast.success('Salary entry updated');

            if (onSave) onSave();
        } catch (err) {
            console.error('Save history error:', err);
            toast.error('Failed to update entry');
        } finally {
            setSaving(false);
        }
    };

    // Delete history entry
    const handleDeleteHistory = async (historyId) => {
        if (!window.confirm('Are you sure you want to delete this salary entry?')) {
            return;
        }

        try {
            setSaving(true);
            const res = await axios.delete(`/salary-history/${historyId}`);

            setSalaryHistory(res.data.history || []);
            toast.success('Salary entry deleted');

            if (onSave) onSave();
        } catch (err) {
            console.error('Delete history error:', err);
            toast.error(err.response?.data?.message || 'Failed to delete entry');
        } finally {
            setSaving(false);
        }
    };

    // Get current active salary
    const activeSalary = salaryHistory.find(entry => entry.effectiveTo === null);

    return (
        <AnimatePresence>
            <motion.div
                className="salary-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="salary-modal"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="salary-modal-header">
                        <div>
                            <h2 className="salary-modal-title">
                                <FaMoneyBillWave style={{ marginRight: '0.5rem' }} />
                                Salary Management
                            </h2>
                            <p className="salary-modal-subtitle">
                                {employee?.EmpName} ({employee?.EmpID})
                            </p>
                        </div>
                        <button className="salary-modal-close" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="salary-modal-body">
                        {loading ? (
                            <div className="salary-loading">
                                <div className="salary-spinner"></div>
                                <span>Loading salary data...</span>
                            </div>
                        ) : (
                            <>
                                {/* Current Salary Section */}
                                <div className="salary-section">
                                    <div className="salary-section-header">
                                        <h3 className="salary-section-title">
                                            <FaMoneyBillWave /> Current Salary
                                        </h3>
                                        {activeSalary && (
                                            <span className="salary-active-badge">
                                                Active from {formatDate(activeSalary.effectiveFrom)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="salary-current-grid">
                                        <div className="salary-field-group">
                                            <span className="salary-field-label">Actual CTC</span>
                                            <span className="salary-field-value highlight">
                                                {formatCurrency(activeSalary?.actualCTC || employee?.ActualCTCWithoutLossOfPay)}
                                            </span>
                                        </div>
                                        <div className="salary-field-group">
                                            <span className="salary-field-label">Consile Salary</span>
                                            <span className="salary-field-value">
                                                {formatCurrency(activeSalary?.consileSalary || employee?.CONSILESALARY)}
                                            </span>
                                        </div>
                                        <div className="salary-field-group">
                                            <span className="salary-field-label">Basic</span>
                                            <span className="salary-field-value">
                                                {formatCurrency(activeSalary?.basic || employee?.Basic)}
                                            </span>
                                        </div>
                                        <div className="salary-field-group">
                                            <span className="salary-field-label">HRA</span>
                                            <span className="salary-field-value">
                                                {formatCurrency(activeSalary?.hra || employee?.HRA)}
                                            </span>
                                        </div>
                                        <div className="salary-field-group">
                                            <span className="salary-field-label">CCA</span>
                                            <span className="salary-field-value">
                                                {formatCurrency(activeSalary?.cca || employee?.CCA)}
                                            </span>
                                        </div>
                                        <div className="salary-field-group">
                                            <span className="salary-field-label">TRP ALW</span>
                                            <span className="salary-field-value">
                                                {formatCurrency(activeSalary?.trpAlw || employee?.TRP_ALW)}
                                            </span>
                                        </div>
                                        <div className="salary-field-group">
                                            <span className="salary-field-label">O_ALW1</span>
                                            <span className="salary-field-value">
                                                {formatCurrency(activeSalary?.oAlw1 || employee?.O_ALW1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Add New Revision Section */}
                                <div className="salary-section">
                                    <h3 className="salary-section-title">
                                        <FaPlus /> Add Salary Revision
                                    </h3>

                                    <div className="salary-add-form">
                                        <div className="salary-add-grid">
                                            <div className="salary-field-group">
                                                <label className="salary-field-label">New CTC *</label>
                                                <input
                                                    type="number"
                                                    className="salary-input"
                                                    placeholder="Enter new CTC"
                                                    value={newRevision.actualCTC}
                                                    onChange={(e) => handleNewCTCChange(e.target.value)}
                                                />
                                            </div>

                                            <div className="salary-field-group">
                                                <label className="salary-field-label">Effective Month</label>
                                                <select
                                                    className="salary-select"
                                                    value={newRevision.effectiveFromMonth}
                                                    onChange={(e) => setNewRevision(prev => ({ ...prev, effectiveFromMonth: e.target.value }))}
                                                >
                                                    {MONTHS.map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="salary-field-group">
                                                <label className="salary-field-label">Effective Year</label>
                                                <select
                                                    className="salary-select"
                                                    value={newRevision.effectiveFromYear}
                                                    onChange={(e) => setNewRevision(prev => ({ ...prev, effectiveFromYear: Number(e.target.value) }))}
                                                >
                                                    {YEAR_OPTIONS.map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="salary-field-group">
                                                <label className="salary-field-label">Reason</label>
                                                <input
                                                    type="text"
                                                    className="salary-input"
                                                    placeholder="e.g., Annual increment"
                                                    value={newRevision.reason}
                                                    onChange={(e) => setNewRevision(prev => ({ ...prev, reason: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {calculatedNew && (
                                            <div className="salary-current-grid" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.5)' }}>
                                                <div className="salary-field-group">
                                                    <span className="salary-field-label">Consile</span>
                                                    <span className="salary-field-value">{formatCurrency(calculatedNew.consileSalary)}</span>
                                                </div>
                                                <div className="salary-field-group">
                                                    <span className="salary-field-label">Basic</span>
                                                    <span className="salary-field-value">{formatCurrency(calculatedNew.basic)}</span>
                                                </div>
                                                <div className="salary-field-group">
                                                    <span className="salary-field-label">HRA</span>
                                                    <span className="salary-field-value">{formatCurrency(calculatedNew.hra)}</span>
                                                </div>
                                                <div className="salary-field-group">
                                                    <span className="salary-field-label">O_ALW1</span>
                                                    <span className="salary-field-value">{formatCurrency(calculatedNew.oAlw1)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="salary-add-actions">
                                            <button
                                                className="salary-btn salary-btn-success"
                                                onClick={handleAddRevision}
                                                disabled={saving || !calculatedNew}
                                            >
                                                <FaPlus /> {saving ? 'Adding...' : 'Add Revision'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Salary History Section */}
                                <div className="salary-section">
                                    <h3 className="salary-section-title">
                                        <FaHistory /> Salary History
                                    </h3>

                                    <div className="salary-history-wrapper">
                                        <table className="salary-history-table">
                                            <thead>
                                                <tr>
                                                    <th>Effective From</th>
                                                    <th>Effective To</th>
                                                    <th>CTC</th>
                                                    <th>Consile</th>
                                                    <th>Basic</th>
                                                    <th>HRA</th>
                                                    <th>CCA</th>
                                                    <th>TRP ALW</th>
                                                    <th>O_ALW1</th>
                                                    <th>Reason</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salaryHistory.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="11" className="salary-history-empty">
                                                            No salary history found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    salaryHistory.map((entry) => (
                                                        <tr
                                                            key={entry._id}
                                                            className={entry.effectiveTo === null ? 'active-row' : ''}
                                                        >
                                                            <td>{formatDate(entry.effectiveFrom)}</td>
                                                            <td>
                                                                {entry.effectiveTo ? (
                                                                    formatDate(entry.effectiveTo)
                                                                ) : (
                                                                    <span className="salary-active-badge">Current</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="salary-inline-input"
                                                                        value={editedHistoryRow.actualCTC || ''}
                                                                        onChange={(e) => handleEditChange('actualCTC', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    formatCurrency(entry.actualCTC)
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="salary-inline-input"
                                                                        value={editedHistoryRow.consileSalary || ''}
                                                                        onChange={(e) => handleEditChange('consileSalary', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    formatCurrency(entry.consileSalary)
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="salary-inline-input"
                                                                        value={editedHistoryRow.basic || ''}
                                                                        onChange={(e) => handleEditChange('basic', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    formatCurrency(entry.basic)
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="salary-inline-input"
                                                                        value={editedHistoryRow.hra || ''}
                                                                        onChange={(e) => handleEditChange('hra', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    formatCurrency(entry.hra)
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="salary-inline-input"
                                                                        value={editedHistoryRow.cca || ''}
                                                                        onChange={(e) => handleEditChange('cca', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    formatCurrency(entry.cca)
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="salary-inline-input"
                                                                        value={editedHistoryRow.trpAlw || ''}
                                                                        onChange={(e) => handleEditChange('trpAlw', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    formatCurrency(entry.trpAlw)
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="number"
                                                                        className="salary-inline-input"
                                                                        value={editedHistoryRow.oAlw1 || ''}
                                                                        onChange={(e) => handleEditChange('oAlw1', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    formatCurrency(entry.oAlw1)
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <input
                                                                        type="text"
                                                                        className="salary-inline-input"
                                                                        style={{ width: '100px' }}
                                                                        value={editedHistoryRow.reason || ''}
                                                                        onChange={(e) => handleEditChange('reason', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    entry.reason || '—'
                                                                )}
                                                            </td>
                                                            <td>
                                                                {editingHistoryId === entry._id ? (
                                                                    <>
                                                                        <button
                                                                            className="salary-btn salary-btn-sm salary-btn-success salary-btn-icon"
                                                                            onClick={() => handleSaveHistory(entry._id)}
                                                                            disabled={saving}
                                                                        >
                                                                            <FaSave />
                                                                        </button>
                                                                        <button
                                                                            className="salary-btn salary-btn-sm salary-btn-secondary salary-btn-icon"
                                                                            onClick={() => {
                                                                                setEditingHistoryId(null);
                                                                                setEditedHistoryRow({});
                                                                            }}
                                                                            style={{ marginLeft: '0.25rem' }}
                                                                        >
                                                                            <FaTimes />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            className="salary-btn salary-btn-sm salary-btn-primary salary-btn-icon"
                                                                            onClick={() => handleEditHistory(entry)}
                                                                            disabled={saving}
                                                                        >
                                                                            <FaEdit />
                                                                        </button>
                                                                        <button
                                                                            className="salary-btn salary-btn-sm salary-btn-danger salary-btn-icon"
                                                                            onClick={() => handleDeleteHistory(entry._id)}
                                                                            disabled={saving}
                                                                            style={{ marginLeft: '0.25rem' }}
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SalaryEditModal;