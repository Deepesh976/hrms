import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import './GenerateSlip.css';

const GenerateSlip = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpDisplay, setSelectedEmpDisplay] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [hoveredEmpId, setHoveredEmpId] = useState(null);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState([]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    empId: '',
    empName: '',
    empUnit: '',
    designation: '',
    department: '',
    dateOfJoining: '',
    uanNo: '',
    esiNo: '',
    bankAccountNo: '',
    totalDays: '',
    daysWorked: '',
    lop: '',
    annualLeaves: '',
    plMlBl: '',
    earnings: {
      basic: '',
      hra: '',
      conveyance: '',
      transportAllowances: '',
      otherAllowances: '',
      // incentives: ''
    },
    deductions: {
      esi: '',
      pf: '',
      tax: '',
      // gpap: '',
      otherDeductions: '',
      lop: ''
    }
  });

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('/employees');
        setEmployees(res.data);
      } catch {
        toast.error('Failed to load employees');
      }
    };
    fetchEmployees();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('[data-dropdown]') === null) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const round = (value) => {
    const n = parseFloat(value);
    return isNaN(n) ? value : Math.round(n);
  };

  // Helper to reset form when selections are incomplete
  const resetFormData = () => {
    setFormData({
      empId: '',
      empName: '',
      empUnit: '',
      designation: '',
      department: '',
      dateOfJoining: '',
      uanNo: '',
      esiNo: '',
      bankAccountNo: '',
      totalDays: '',
      daysWorked: '',
      lop: '',
      annualLeaves: '',
      plMlBl: '',
      earnings: {
        basic: '',
        hra: '',
        conveyance: '',
        transportAllowances: '',
        otherAllowances: '',
        // incentives: ''
      },
      deductions: {
        esi: '',
        pf: '',
        tax: '',
        // gpap: '',
        otherDeductions: '',
        lop: ''
      }
    });
  };

  // Fetch available periods for selected employee
  useEffect(() => {
    if (!selectedEmpId) {
      setAvailablePeriods([]);
      setSelectedMonth('');
      setSelectedYear('');
      return;
    }

    const fetchPeriods = async () => {
      try {
        const res = await axios.get(`/slips/periods/${selectedEmpId}`);
        setAvailablePeriods(res.data.availablePeriods || []);
        setSelectedMonth('');
        setSelectedYear('');
      } catch (err) {
        console.error(err);
        setAvailablePeriods([]);
        setSelectedMonth('');
        setSelectedYear('');
        toast.error('No salary periods found for this employee');
      }
    };

    fetchPeriods();
  }, [selectedEmpId]);

  // All months (static)
  const allMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1).padStart(2, '0'),
        label: new Date(2024, i).toLocaleString('default', { month: 'long' })
      })),
    []
  );

  // Months available for selected employee
  const monthOptions = useMemo(() => {
    if (!availablePeriods.length) return [];
    const monthNumbers = [...new Set(availablePeriods.map((p) => p.monthNumber))];
    return allMonths.filter((m) => monthNumbers.includes(Number(m.value)));
  }, [availablePeriods, allMonths]);

  // Years available for selected employee
  const yearOptions = useMemo(() => {
    if (!availablePeriods.length) return [];
    const yearsSet = new Set(availablePeriods.map((p) => p.year));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [availablePeriods]);

  // Fetch salary details only when Employee + Month + Year are selected
  useEffect(() => {
    if (!selectedEmpId || !selectedMonth || !selectedYear) {
      resetFormData();
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await axios.get(`/slips/details/${selectedEmpId}`, {
          params: {
            month: selectedMonth,
            year: selectedYear
          }
        });

        const { employee, salary, earnings, deductions, annualLeaves, plMlBl } = res.data;

        setFormData({
          empId: selectedEmpId,
          empName: employee.empName || '',
          empUnit: employee.empUnit || '',
          designation: employee.designation || '',
          department: employee.department || '',
          dateOfJoining: employee.doj ? employee.doj.split('T')[0] : '',
          uanNo: employee.uanNo || '',
          esiNo: employee.esiNo || '',
          bankAccountNo: employee.bankAccount || '',
          totalDays: round(salary.totalDays),
          daysWorked: salary.daysWorked,
          lop: salary.lop,
          annualLeaves: annualLeaves,
          plMlBl: plMlBl,
          earnings: {
            basic: round(earnings.basic),
            hra: round(earnings.hra),
            conveyance: round(earnings.conveyance),
            transportAllowances: round(earnings.transportAllowances),
            otherAllowances: round(earnings.otherAllowances),
            // incentives: round(earnings.incentives)
          },
          deductions: {
            esi: round(deductions.esi),
            pf: round(deductions.pf),
            tax: round(deductions.tax),
            // gpap: round(deductions.gpap),
            otherDeductions: round(deductions.otherDeductions),
            lop: round(deductions.lop)
          }
        });
      } catch (err) {
        console.error(err);
        resetFormData();
        toast.error('Failed to fetch salary details for selected period');
      }
    };

    fetchDetails();
  }, [selectedEmpId, selectedMonth, selectedYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['daysWorked', 'lop', 'annualLeaves', 'plMlBl'];
    const shouldRound = !numericFields.includes(name);
    const updatedValue = shouldRound ? round(value) : value;

    if (name.startsWith('earnings.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        earnings: { ...prev.earnings, [key]: updatedValue }
      }));
    } else if (name.startsWith('deductions.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        deductions: { ...prev.deductions, [key]: updatedValue }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: updatedValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmpId) {
      toast.error('Please select an employee');
      return;
    }
    if (!selectedMonth || !selectedYear) {
      toast.error('Please select both month and year');
      return;
    }
    if (!formData.empId) {
      toast.error('No salary data loaded for this period');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/slips', {
        ...formData,
        month: selectedMonth,
        year: selectedYear
      });

      toast.success('Salary slip generated successfully!');

      navigate('/salary-slip', {
        state: {
          pdfUrl: res.data?.pdfUrl || null,
          slipData: res.data || null,
          formData
        }
      });

      setSelectedEmpId('');
      setSelectedEmpDisplay('');
      setSelectedMonth('');
      setSelectedYear('');
      setAvailablePeriods([]);
      resetFormData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error generating slip');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.empId.toString().includes(searchTerm)
  );

  const toTitleCase = (str) =>
    str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

  return (
    <div className="generate-slip-page">
      <div className="generate-slip-container">
        {/* Header Section */}
        <div className="generate-slip-header">
          <div className="header-content">
            <h1>Salary Slip Generation</h1>
            <p>Create and manage employee salary slips</p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="generate-slip-form">
          {/* Filter Section: Employee, Month, Year */}
          <div className="filter-section">
            <div className="filter-grid">
              <div className="form-group">
                <label className="form-label">Select Employee</label>
                <div className="dropdown-container" data-dropdown>
                  <input
                    type="text"
                    className="dropdown-input"
                    placeholder="Search employee name or ID..."
                    value={searchTerm !== '' ? searchTerm : selectedEmpDisplay}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    required={!selectedEmpId}
                  />
                  {isDropdownOpen && (
                    <div className="dropdown-list">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp._id}
                            className={`dropdown-option ${
                              String(selectedEmpId) === String(emp.empId) ? 'selected' : ''
                            }`}
                            onMouseEnter={() => setHoveredEmpId(emp.empId)}
                            onMouseLeave={() => setHoveredEmpId(null)}
                            onClick={() => {
                              setSelectedEmpId(emp.empId);
                              setSelectedEmpDisplay(`${emp.empName} (${emp.empId})`);
                              setSearchTerm('');
                              setIsDropdownOpen(false);
                              setHoveredEmpId(null);
                            }}
                          >
                            <strong>{emp.empName}</strong>
                            <span>ID: {emp.empId}</span>
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-empty">No employees found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Month</label>
                <select
                  className="form-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={!selectedEmpId || !monthOptions.length}
                >
                  <option value="">-- Select Month --</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Year</label>
                <select
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={!selectedEmpId || !yearOptions.length}
                >
                  <option value="">-- Select Year --</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Employee Information Section */}
          <h2 className="section-title">Employee Information</h2>
          <div className="form-grid">
            {[
              ['Employee Name', 'empName'],
              ['Employee Unit', 'empUnit'],
              ['Designation', 'designation'],
              ['Department', 'department'],
              ['Date of Joining', 'dateOfJoining', 'date'],
              ['UAN No', 'uanNo'],
              ['ESI No', 'esiNo'],
              ['Bank Account No', 'bankAccountNo']
            ].map(([label, name, type = 'text']) => (
              <div key={name} className="form-group">
                <label className="form-label">{label}</label>
                <input
                  type={type}
                  className="form-input"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  disabled
                />
              </div>
            ))}
          </div>

          {/* Attendance & Leave Section */}
          <h2 className="section-title">Attendance & Leave</h2>
          <div className="form-grid">
            {[
              ['Total Days', 'totalDays'],
              ['Days Worked', 'daysWorked'],
              ['Loss of Pay', 'lop'],
              ['Annual Leaves', 'annualLeaves'],
              ['PL / ML / BL', 'plMlBl']
            ].map(([label, name]) => (
              <div key={name} className="form-group">
                <label className="form-label">{label}</label>
                <input
                  type="number"
                  className="form-input"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          {/* Earnings Section */}
          <h2 className="section-title">Earnings</h2>
          <div className="form-grid">
            {Object.entries(formData.earnings).map(([key, val]) => (
              <div key={key} className="form-group">
                <label className="form-label">{toTitleCase(key)}</label>
                <input
                  type="number"
                  className="form-input"
                  name={`earnings.${key}`}
                  value={val}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          {/* Deductions Section */}
          <h2 className="section-title">Deductions</h2>
          <div className="form-grid">
            {Object.entries(formData.deductions).map(([key, val]) => (
              <div key={key} className="form-group">
                <label className="form-label">{toTitleCase(key)}</label>
                <input
                  type="number"
                  className="form-input"
                  name={`deductions.${key}`}
                  value={val}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={
              loading ||
              !selectedEmpId ||
              !selectedMonth ||
              !selectedYear ||
              !formData.empId
            }
          >
            {loading ? 'Generating...' : 'Generate Slip'}
          </button>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
};

export default GenerateSlip;
