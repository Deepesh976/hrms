import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../Notifications/NotificationBell';
import { FaChartBar, FaClock, FaFileInvoiceDollar, FaCalendarAlt, FaClipboard, FaBox, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const styles = {
  navbar: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    color: 'white',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(30, 58, 138, 0.15)',
    backdropFilter: 'blur(10px)',
  },
  navContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    position: 'absolute',
    left: 0,
  },
  brand: {
    fontSize: '1.3rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
    userSelect: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  menuIcon: {
    fontSize: '24px',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
  },
  menuIconHover: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: 'scale(1.1)',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    position: 'absolute',
    right: 0,
  },
  avatarContainer: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    userSelect: 'none',
    transition: 'all 0.3s ease',
  },
  avatarHover: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: 'scale(1.08)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    backgroundColor: '#fff',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    borderRadius: '12px',
    minWidth: '200px',
    overflow: 'hidden',
    fontSize: '0.95rem',
    zIndex: 1101,
    border: '1px solid rgba(0,0,0,0.08)',
  },
  dropdownItem: {
    padding: '12px 16px',
    color: '#333',
    textAlign: 'left',
    background: '#fff',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dropdownItemHover: {
    backgroundColor: '#f0f7ff',
    paddingLeft: '20px',
  },
  logoutItem: {
    color: '#dc2626',
    fontWeight: '600',
    borderTop: '1px solid #e5e7eb',
  },

  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '300px',
    backgroundColor: '#f8fafc',
    padding: '5rem 0 1.5rem 0',
    boxShadow: '4px 0 25px rgba(0,0,0,0.1)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1050,
    overflowY: 'auto',
  },
  sidebarVisible: {
    transform: 'translateX(0)',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1040,
    backdropFilter: 'blur(2px)',
  },
  sidebarHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '1.2rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  sidebarTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1e3a8a',
  },
  closeBtn: {
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    background: 'none',
    border: 'none',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  linksContainer: {
    padding: '1.5rem',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    margin: '6px 0',
    borderRadius: '10px',
    color: '#333',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  linkHover: {
    backgroundColor: '#e0f2fe',
    color: '#1e3a8a',
    transform: 'translateX(4px)',
    paddingLeft: '20px',
  },
  activeLink: {
    backgroundColor: '#1e3a8a',
    color: '#fff',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
  },
  linkIcon: {
    fontSize: '18px',
    minWidth: '20px',
  },
};

const menuItems = [
  { path: '/employee-dashboard', label: 'Dashboard', icon: FaChartBar },
  { path: '/employee-attendance', label: 'My Attendance', icon: FaClock },
  { path: '/employee-payslip', label: 'Generate Pay Slip', icon: FaFileInvoiceDollar },
  { path: '/employee-leaves-calendar', label: 'Leaves Calendar', icon: FaCalendarAlt },
  { path: '/employee-leave-request', label: 'Leave Request', icon: FaClipboard },
  { path: '/employee-assets', label: 'Assets', icon: FaBox },
];

const EmployeeNavbar = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuIconHover, setMenuIconHover] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const closeDropdown = () => setShowDropdown(false);
  const initials = (localStorage.getItem('email') || 'EM').slice(0, 2).toUpperCase();
  const role = (localStorage.getItem('role') || '').toLowerCase();

  const handleLogout = () => {
    closeDropdown();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('expiry');
    navigate('/');
  };

  return (
    <>
      <nav
        style={styles.navbar}
        role="navigation"
        aria-label="Employee Navigation"
      >
        <div style={styles.navContent}>
          <div style={styles.leftSection}>
            <div
              style={{
                ...styles.menuIcon,
                ...(menuIconHover ? styles.menuIconHover : {}),
              }}
              onClick={() => setShowSidebar(true)}
              onMouseEnter={() => setMenuIconHover(true)}
              onMouseLeave={() => setMenuIconHover(false)}
              aria-label="Open sidebar menu"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setShowSidebar(true);
              }}
              title="Menu"
            >
              <FaBars />
            </div>
          </div>

          <div style={styles.brand} role="heading">
            {role === 'hr-employee' ? 'HR Employee' : 'Employee'}
          </div>

          <div style={styles.rightSection}>
            <NotificationBell />
            <div
              style={styles.avatarContainer}
              onClick={toggleDropdown}
              aria-haspopup="true"
              aria-expanded={showDropdown}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleDropdown();
              }}
            >
              <div
                style={{
                  ...styles.avatar,
                  ...(avatarHover ? styles.avatarHover : {}),
                }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                aria-label="User initials"
              >
                {initials}
              </div>
              {showDropdown && (
                <div
                  style={styles.dropdown}
                  onMouseLeave={closeDropdown}
                  role="menu"
                  aria-label="User menu"
                >
                  <button
                    style={styles.dropdownItem}
                    onClick={() => {
                      closeDropdown();
                      navigate('/profile');
                    }}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, styles.dropdownItemHover);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.paddingLeft = '16px';
                    }}
                    role="menuitem"
                  >
                    <FaUser style={{ fontSize: '16px' }} />
                    Profile
                  </button>
                  <button
                    style={{ ...styles.dropdownItem, ...styles.logoutItem }}
                    onClick={handleLogout}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.paddingLeft = '20px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.paddingLeft = '16px';
                    }}
                    role="menuitem"
                  >
                    <FaSignOutAlt style={{ fontSize: '16px' }} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showSidebar && (
        <div
          style={styles.overlay}
          onClick={() => setShowSidebar(false)}
          aria-hidden="true"
        />
      )}

      <aside
        style={{
          ...styles.sidebar,
          ...(showSidebar ? styles.sidebarVisible : {}),
        }}
        aria-label="Sidebar navigation"
      >
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Menu</span>
          <button
            style={styles.closeBtn}
            onClick={() => setShowSidebar(false)}
            title="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <div style={styles.linksContainer}>
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setShowSidebar(false)}
                style={{
                  ...styles.link,
                  ...(hovered === idx ? styles.linkHover : {}),
                  ...(isActive ? styles.activeLink : {}),
                }}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                tabIndex={0}
                aria-current={isActive ? 'page' : undefined}
              >
                <span style={styles.linkIcon}>
                  <IconComponent />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default EmployeeNavbar;
