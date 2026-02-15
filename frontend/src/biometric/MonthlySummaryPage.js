import React, { useEffect, useState, useCallback } from 'react';
import { FaArrowLeft, FaChartBar } from 'react-icons/fa';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'react-toastify';

const MonthlySummaryPage = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const { empId } = useParams();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFoundShown, setNotFoundShown] = useState(false);

  /* =====================================================
     🔐 ROLE GUARD
  ===================================================== */
  useEffect(() => {
    if (['hod', 'director'].includes(role)) {
      toast.warn('You are not authorized to view Monthly Summary');
      navigate(-1);
    }
  }, [role, navigate]);

  /* =====================================================
     PAYROLL CYCLE HELPER (21 → 20)
  ===================================================== */
  const getPayrollCycleFromDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    d.setHours(0, 0, 0, 0);

    let year = d.getFullYear();
    let month = d.getMonth() + 1;

    if (d.getDate() < 21) {
      month -= 1;
      if (month === 0) {
        month = 12;
        year -= 1;
      }
    }

    return { year, month };
  };

  /* =====================================================
     FETCH MONTHLY SUMMARY
  ===================================================== */
  const fetchSummary = useCallback(async () => {
    if (!empId || !dateParam) return;

    setLoading(true);

    try {
      const cycle = getPayrollCycleFromDate(dateParam);
      if (!cycle) {
        toast.error('Invalid payroll date');
        return;
      }

      const { year, month } = cycle;

      const res = await axios.get(
        `/monthly-summary/employee/${empId}?year=${year}&month=${month}`
      );

      let summaryData = null;

      if (res.data?.success && res.data.data) {
        summaryData = Array.isArray(res.data.data)
          ? res.data.data.find(
              (s) => Number(s.year) === year && Number(s.month) === month
            )
          : res.data.data;
      }

      if (summaryData) {
        setSummary(summaryData);
        setNotFoundShown(false);
      } else {
        setSummary(null);
        if (!notFoundShown) {
          toast.info('No monthly summary found for this payroll cycle');
          setNotFoundShown(true);
        }
      }
    } catch (err) {
      console.error('Monthly summary fetch failed:', err);
      toast.error('Failed to load monthly summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [empId, dateParam, notFoundShown]);

  useEffect(() => {
    if (!empId || !dateParam) {
      toast.error('Invalid monthly summary link');
      return;
    }

    if (!['hod', 'director'].includes(role)) {
      fetchSummary();
    }
  }, [fetchSummary, empId, dateParam, role]);

  /* =====================================================
     FORMAT HELPERS
  ===================================================== */
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const renderCycleRange = () => {
    if (!summary?.cycleStart || !summary?.cycleEnd) return '';
    return `${formatDate(summary.cycleStart)} – ${formatDate(summary.cycleEnd)}`;
  };

  /* =====================================================
     DERIVED VALUES
  ===================================================== */
  const totalAL =
    (summary?.totalALF || 0) + (summary?.totalALH || 0) * 0.5;

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div style={styles.wrapper}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        <FaArrowLeft /> Back
      </button>

      <h2 style={styles.title}>
        <FaChartBar /> Monthly Payroll Summary
      </h2>

      {loading && <div>Loading…</div>}

      {!loading && !summary && (
        <div style={styles.empty}>No Monthly Summary Found</div>
      )}

      {!loading && summary && (
        <div style={styles.card}>
          <h3>
            {summary.empName} ({summary.empId})
          </h3>

          <p style={styles.cycle}>{renderCycleRange()}</p>

          <div style={styles.grid}>
            <div><b>Present:</b> {summary.totalPresent ?? 0}</div>
            <div><b>Absent:</b> {summary.totalAbsent ?? 0}</div>

            <div><b>Annual Leave Full:</b> {summary.totalALF ?? 0}</div>
            <div><b>Annual Leave Half:</b> {summary.totalALH ?? 0}</div>
            <div><b>Total AL (Salary Impact):</b> {totalAL}</div>

            <div><b>Weekly Off:</b> {summary.totalWOCount ?? 0}</div>
            <div><b>Holiday:</b> {summary.totalHOCount ?? 0}</div>
            <div><b>Total Days:</b> {summary.totalDays ?? 0}</div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =====================================================
   STYLES
===================================================== */
const styles = {
  wrapper: {
    maxWidth: 900,
    margin: '80px auto',
    padding: 20,
  },
  backBtn: {
    marginBottom: 16,
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    fontSize: 16,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  card: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  cycle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
  },
  empty: {
    padding: 20,
    textAlign: 'center',
    color: '#777',
  },
};

export default MonthlySummaryPage;
