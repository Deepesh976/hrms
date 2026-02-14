import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSave, FaTimes } from 'react-icons/fa';
import axios from '../api/axios';
import '../styles/EditEmployeeSalaryInfo.css';

/* ---------------- COLUMN MAP ---------------- */

const expectedKeys = {
  year: 'Year',
  month: 'Month',
  empId: 'EmpID',
  empName: 'EmpName',
  department: 'DEPT',
  designation: 'DESIGNATION',
  dob: 'DOB',
  doj: 'DOJ',
  actualCTCWithoutLOP: 'Actual CTC Without Loss Of Pay',
  lopCTC: 'LOP CTC',
  totalDays: 'Total Days',
  daysWorked: 'Days Worked',
  daysPaid: 'Days Paid',
  al: 'AL',
  pl: 'PL',
  blOrMl: 'BL/ML',
  lop: 'LOP',
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

const readOnlyFields = [
  'year',
  'month',
  'empId',
  'empName',
  'department',
  'designation',
  'dob',
  'doj',
  'actualCTCWithoutLOP',
  'lopCTC'
];

/* ---------------- COMPONENT ---------------- */

const EditEmployeeSalaryInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- HELPERS ---------------- */

  const toNumber = (val) =>
    val === '' || val === null || val === undefined || isNaN(val)
      ? 0
      : Number(val);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/salaries/${id}`);
        setFormData(res.data);
      } catch {
        toast.error('Failed to load salary data');
        navigate('/employee-salary-info');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate]);

  /* =====================================================
     🔥 FINAL ATTENDANCE EDIT LOGIC (CORRECT)
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev };

      const totalDays = toNumber(prev.totalDays);
      const daysPaid = toNumber(prev.daysPaid);
      const al = toNumber(prev.al);
      const numVal = toNumber(value);

      /* =========================
         DAYS WORKED / DAYS PAID
         (ALWAYS MIRROR)
      ========================= */
      if (name === 'daysWorked' || name === 'daysPaid') {
        const paid = Math.min(numVal, totalDays);

        updated.daysWorked = paid;
        updated.daysPaid = paid;
        updated.lop = Math.max(totalDays - paid - al, 0);
      }

      /* =========================
         ANNUAL LEAVE (AL)
         🔥 ONLY REDUCES LOP
      ========================= */
      else if (name === 'al') {
        const alVal = Math.min(numVal, totalDays);

        updated.al = alVal;
        updated.daysWorked = daysPaid;
        updated.daysPaid = daysPaid;
        updated.lop = Math.max(totalDays - daysPaid - alVal, 0);
      }

      /* =========================
         DIRECT LOP EDIT
      ========================= */
      else if (name === 'lop') {
        const lopVal = Math.min(numVal, totalDays);
        const paid = Math.max(totalDays - lopVal - al, 0);

        updated.lop = lopVal;
        updated.daysWorked = paid;
        updated.daysPaid = paid;
      }

      /* =========================
         ALL OTHER FIELDS
      ========================= */
      else {
        updated[name] = value;
      }

      return updated;
    });
  };

  /* ---------------- SAVE ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`/salaries/${formData._id}`, formData);
      toast.success('Salary updated successfully');
      navigate('/employee-salary-info');
    } catch {
      toast.error('Failed to update salary');
    }
  };

  if (loading || !formData) {
    return <div className="edit-salary-container">Loading...</div>;
  }

  /* ---------------- RENDER HELPERS ---------------- */

  const renderGroup = (keys, title) => (
    <div className="form-section">
      <h3 className="section-title">{title}</h3>
      <div className="form-grid">
        {keys.map(k => (
          <div key={k} className="form-group">
            <label className="form-label">
              {expectedKeys[k]}
              {readOnlyFields.includes(k) && (
                <span className="readonly-badge">Read Only</span>
              )}
            </label>
            <input
              className="form-input"
              type={k === 'dob' || k === 'doj' ? 'date' : 'text'}
              name={k}
              value={
                k === 'dob' || k === 'doj'
                  ? formatDate(formData[k])
                  : formData[k] ?? ''
              }
              onChange={handleChange}
              disabled={readOnlyFields.includes(k)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="edit-salary-container">
      <form className="edit-salary-form" onSubmit={handleSubmit}>
        {renderGroup(['year','month','empId','empName','department','designation','dob','doj'], '👤 Employee')}
        {renderGroup(['actualCTCWithoutLOP','lopCTC'], '💰 CTC')}
        {renderGroup(['totalDays','daysWorked','daysPaid','al','pl','blOrMl','lop'], '📅 Attendance')}
        {renderGroup(['consileSalary','basic','hra','cca','transportAllowance','otherAllowance1'], '💵 Earnings')}
        {renderGroup(['plb','pf','esi','pt','tds','gpap','otherDeductions'], '📊 Deductions')}
        {renderGroup(['netPay','pfEmployerShare','esiEmployerShare','bonus'], '✅ Final')}

        <div className="form-buttons">
          <button type="button" className="btn-cancel" onClick={() => navigate('/employee-salary-info')}>
            <FaTimes /> Cancel
          </button>
          <button type="submit" className="btn-save">
            <FaSave /> Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEmployeeSalaryInfo;
