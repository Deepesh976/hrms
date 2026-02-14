import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import EmployeeNavbar from '../components/Navbar/employeenavbar';
import axios from '../api/axios';

const styles = {
  container: {
    padding: '0.75rem',
    paddingTop: '120px',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '0.9rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '0.2rem',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '0.8rem',
    color: '#4a5568',
    fontWeight: '400',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
    padding: '1.2rem',
    maxWidth: '100%',
    margin: '0 auto',
    overflow: 'hidden',
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.2rem',
    padding: '0.9rem 1.2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: '10px',
    boxShadow: '0 3px 10px rgba(102, 126, 234, 0.25)',
  },
  monthYear: {
    fontSize: '1.15rem',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '0.4rem 0.7rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendar: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '1.2rem',
  },
  dayHeader: {
    backgroundColor: '#f8fafc',
    color: '#1a202c',
    fontWeight: '600',
    padding: '0.6rem 0.4rem',
    textAlign: 'center',
    border: 'none',
    borderBottom: '1.5px solid #e2e8f0',
    fontSize: '0.75rem',
    letterSpacing: '0.3px',
  },
  dayCell: {
    border: '1px solid #e2e8f0',
    padding: '0.5rem 0.4rem',
    height: '60px',
    verticalAlign: 'top',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
  },
  dayNumber: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '0.2rem',
  },
  dayNumberToday: {
    backgroundColor: '#667eea',
    color: '#fff',
    borderRadius: '5px',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  dayNumberOtherMonth: {
    color: '#cbd5e0',
  },
  holidayBadge: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef5350',
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  festivalBadge: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ffa726',
    position: 'absolute',
    top: '8px',
    right: '20px',
  },
  leaveBadge: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#29b6f6',
    position: 'absolute',
    top: '8px',
    right: '32px',
  },
  myLeaveBadge: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ab47bc',
    position: 'absolute',
    top: '8px',
    right: '44px',
  },
  eventText: {
    fontSize: '0.6rem',
    color: '#4a5568',
    marginTop: '0.15rem',
    lineHeight: '1.1',
    fontWeight: '500',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.2rem',
    flexWrap: 'wrap',
    padding: '0.8rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    marginTop: '0.8rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  holidayLegend: {
    backgroundColor: '#ef5350',
  },
  festivalLegend: {
    backgroundColor: '#ffa726',
  },
  leaveLegend: {
    backgroundColor: '#29b6f6',
  },
  myLeaveLegend: {
    backgroundColor: '#ab47bc',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem 1rem',
    fontSize: '0.95rem',
    color: '#4a5568',
    fontWeight: '500',
  },
  upcomingLeavesSection: {
    marginTop: '0.8rem',
    padding: '0.9rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    borderLeft: '3px solid #667eea',
  },
  upcomingLeavesTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#1a202c',
  },
  upcomingLeavesList: {
    margin: 0,
    paddingLeft: '1.2rem',
  },
  upcomingLeavesItem: {
    marginBottom: '0.35rem',
    color: '#4a5568',
    fontSize: '0.8rem',
    lineHeight: '1.4',
  },
  upcomingLeavesDate: {
    fontWeight: '700',
    color: '#667eea',
  },
  upcomingLeavesType: {
    fontWeight: '600',
    color: '#764ba2',
  },
};

const EmployeeLeavesCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [myLeaves, setMyLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);

  const role = (localStorage.getItem('role') || '').toLowerCase();
  const accentColor = role === 'hr-employee' ? '#b57edc' : '#28a745';
  const todayBg = role === 'hr-employee' ? '#f3eaff' : '#e8f5e8';
  const hoverBg = role === 'hr-employee' ? '#f3eaff' : '#f0f8f0';

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  useEffect(() => {
    if (employeeData) {
      fetchCalendarEvents();
      fetchMyLeaves();
    }
  }, [currentDate, employeeData]);

  const fetchEmployeeData = async () => {
    try {
      const empIdFromStorage = localStorage.getItem('employeeId');
      if (empIdFromStorage) {
        const res = await axios.get(`/employees/${empIdFromStorage}`);
        setEmployeeData(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch employee data:', e);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Fetch holiday/calendar events
      const res = await axios.get('/leave-calendar', {
        params: {
          year,
          month,
          department: employeeData?.department || 'All'
        }
      });
      
      // Handle nested response structure
      const calendarEvents = res.data?.data || res.data || [];
      
      // Convert array of events to object keyed by date
      const eventsObj = {};
      calendarEvents.forEach(event => {
        if (event.date) {
          const eventDate = new Date(event.date);
          const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth() + 1}-${eventDate.getDate()}`;
          
          // Determine event type
          let type = 'holiday';
          if (event.type === 'public_holiday' || event.type === 'restricted_holiday') {
            type = 'holiday';
          } else if (event.type === 'company_event') {
            type = 'festival';
          } else if (event.type === 'weekend') {
            type = 'leave';
          }
          
// 🔥 HOLIDAY MUST OVERRIDE EVERYTHING
if (
  !eventsObj[dateKey] ||
  type === 'holiday'
) {
  eventsObj[dateKey] = {
    type,
    text: event.title,
    description: event.description,
    eventType: event.type,
    isHoliday: type === 'holiday'
  };
}

        }
      });
      
      setEvents(eventsObj);
    } catch (e) {
      console.error('Failed to fetch calendar events:', e);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

const fetchMyLeaves = async () => {
  try {
    if (!employeeData) return;

    const res = await axios.get(
      `/leaves/my-requests?empId=${employeeData.empId}`
    );

    const data = res.data;
    const leavesArray = Array.isArray(data) ? data : data?.data || [];

    // ✅ Only approved leaves
    const approvedLeaves = leavesArray.filter(
      leave => leave.status === 'approved'
    );
    setMyLeaves(approvedLeaves);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 🔥 USE FUNCTIONAL STATE UPDATE (NO STALE STATE)
    setEvents(prevEvents => {
      const updatedEvents = { ...prevEvents };

      approvedLeaves.forEach(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          // Only current month
          if (d.getMonth() === month && d.getFullYear() === year) {
            const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

            // 🔒 DO NOT OVERRIDE HOLIDAY
            if (updatedEvents[dateKey]?.type === 'holiday') {
              continue;
            }

            updatedEvents[dateKey] = {
              type: 'myleave',
              text: `My Leave: ${
                leave.leaveTypeName || leave.leaveType
              }`,
              leaveType: leave.leaveType,
              reason: leave.reason
            };
          }
        }
      });

      return updatedEvents;
    });
  } catch (e) {
    console.error('Failed to fetch my leaves:', e);
  }
};

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: prevMonth.getDate() - i, isCurrentMonth: false, fullDate: new Date(year, month - 1, prevMonth.getDate() - i) });
    }

    for (let dateNum = 1; dateNum <= daysInMonth; dateNum++) {
      days.push({ date: dateNum, isCurrentMonth: true, fullDate: new Date(year, month, dateNum) });
    }

    const remainingDays = 42 - days.length;
    for (let dateNum = 1; dateNum <= remainingDays; dateNum++) {
      days.push({ date: dateNum, isCurrentMonth: false, fullDate: new Date(year, month + 1, dateNum) });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.fullDate.toDateString() === today.toDateString();
  };

  const getEventForDate = (date) => {
    const dateKey = `${date.fullDate.getFullYear()}-${date.fullDate.getMonth() + 1}-${date.fullDate.getDate()}`;
    return events[dateKey];
  };

  const renderCalendarDays = () => {
    const days = getDaysInMonth(currentDate);
    const weeks = [];

    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      weeks.push(
        <tr key={i}>
          {week.map((day, index) => {
            const event = getEventForDate(day);
            return (
              <td
                key={index}
                style={{
                  ...styles.dayCell,
                  backgroundColor: day.isCurrentMonth ? (isToday(day) ? '#f0f4ff' : '#fff') : '#f8fafc',
                }}
                onMouseEnter={(e) => {
                  if (day.isCurrentMonth && !isToday(day)) {
                    e.currentTarget.style.backgroundColor = '#f0f4ff';
                  }
                  if (day.isCurrentMonth) {
                    e.currentTarget.style.boxShadow = 'inset 0 0 8px rgba(102, 126, 234, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = day.isCurrentMonth ? (isToday(day) ? '#f0f4ff' : '#fff') : '#f8fafc';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    ...styles.dayNumber,
                    ...(isToday(day) ? { ...styles.dayNumberToday } : {}),
                    ...(!day.isCurrentMonth ? styles.dayNumberOtherMonth : {}),
                  }}
                >
                  {day.date}
                </div>
                {event && (
                  <>
                    <div
                      style={{
                        ...(event.type === 'holiday' ? styles.holidayBadge :
                            event.type === 'festival' ? styles.festivalBadge :
                            event.type === 'myleave' ? styles.myLeaveBadge :
                            styles.leaveBadge),
                      }}
                    />
                    <div style={styles.eventText} title={event.description || event.reason}>
                      {event.text}
                    </div>
                  </>
                )}
              </td>
            );
          })}
        </tr>
      );
    }

    return weeks;
  };

  return (
    <>
      <EmployeeNavbar />
      <div style={styles.container}>
        <ToastContainer position="top-right" autoClose={3000} />

        <div style={styles.header}>
          <h1 style={styles.title}>Leaves Calendar</h1>
          <p style={styles.subtitle}>Company holidays, festivals and your approved leaves</p>
        </div>

        {loading && (
          <div style={styles.loading}>Loading calendar...</div>
        )}

        <div style={styles.calendarContainer}>
          <div style={styles.calendarHeader}>
            <button
              style={styles.navButton}
              onClick={() => navigateMonth(-1)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              <FaChevronLeft />
            </button>

            <div style={styles.monthYear}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>

            <button
              style={styles.navButton}
              onClick={() => navigateMonth(1)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              <FaChevronRight />
            </button>
          </div>

          <table style={styles.calendar}>
            <thead>
              <tr>
                {dayNames.map(day => (
                  <th key={day} style={styles.dayHeader}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderCalendarDays()}
            </tbody>
          </table>

          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, ...styles.holidayLegend }} />
              <span style={{ color: '#4a5568', fontWeight: '500', fontSize: '0.8rem' }}>Public Holidays</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, ...styles.festivalLegend }} />
              <span style={{ color: '#4a5568', fontWeight: '500', fontSize: '0.8rem' }}>Company Events</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, ...styles.leaveLegend }} />
              <span style={{ color: '#4a5568', fontWeight: '500', fontSize: '0.8rem' }}>Weekends/Restricted</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendDot, ...styles.myLeaveLegend }} />
              <span style={{ color: '#4a5568', fontWeight: '500', fontSize: '0.8rem' }}>My Approved Leaves</span>
            </div>
          </div>
          
          {myLeaves.length > 0 && (
            <div style={styles.upcomingLeavesSection}>
              <h4 style={styles.upcomingLeavesTitle}>
                My Upcoming Approved Leaves
              </h4>
              <ul style={styles.upcomingLeavesList}>
                {myLeaves
                  .filter(leave => new Date(leave.startDate) >= new Date())
                  .slice(0, 5)
                  .map(leave => (
                    <li key={leave._id} style={styles.upcomingLeavesItem}>
                      <span style={styles.upcomingLeavesDate}>{new Date(leave.startDate).toLocaleDateString()}</span> to{' '}
                      <span style={styles.upcomingLeavesDate}>{new Date(leave.endDate).toLocaleDateString()}</span> -{' '}
                      <span style={styles.upcomingLeavesType}>{leave.leaveTypeName || leave.leaveType}</span> ({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeLeavesCalendar;
