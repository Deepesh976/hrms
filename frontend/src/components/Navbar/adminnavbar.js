import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../Notifications/NotificationBell';
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaChartBar,
  FaUsers,
  FaClipboardList,
  FaFileContract,
  FaBox,
  FaKey,
  FaCheckCircle,
} from 'react-icons/fa';
import './adminnavbar.css';

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
    position: 'absolute',
    left: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  rightSection: {
    position: 'absolute',
    right: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
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
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
    userSelect: 'none',
  },
  menuIconHover: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: 'scale(1.1)',
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
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
    border: '2px solid rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontSize: '16px',
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
    borderRadius: '12px',
    minWidth: '200px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    fontSize: '0.95rem',
    zIndex: 1101,
    border: '1px solid rgba(0,0,0,0.08)',
  },
  dropdownItem: {
    padding: '12px 16px',
    background: '#fff',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.2s ease',
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
    padding: '0',
    boxShadow: '4px 0 25px rgba(0,0,0,0.1)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1050,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
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
    padding: '1.2rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
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
    transition: 'all 0.2s ease',
  },
  closeBtnHover: {
    color: '#1e3a8a',
    transform: 'scale(1.15)',
  },
  linksContainer: {
    padding: '1.5rem',
    flex: 1,
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
  { path: '/dashboard', label: 'Dashboard', icon: FaChartBar },
  { path: '/employee-info', label: 'Employee Info', icon: FaUsers },
  { path: '/employee-salary-info', label: 'Salary Info', icon: FaClipboardList },
  { path: '/employee-activity', label: 'Employee Activity', icon: FaClipboardList },
  { path: '/generate-slip', label: 'Generate Slip', icon: FaFileContract },
  { path: '/salary-slip', label: 'Salary Slip', icon: FaFileContract },
  { path: '/hr-assets', label: 'Employee Assets', icon: FaBox },
  { path: '/manage-hods', label: 'Manage HODs', icon: FaUser },
  { path: '/manage-directors', label: 'Manage Directors', icon: FaUser },
  { path: '/hr-leave-requests', label: 'Leave Approvals', icon: FaCheckCircle },
  { path: '/create-assets', label: 'Create Assets', icon: FaBox },
  { path: '/manage-passwords', label: 'Manage Passwords', icon: FaKey },
];

const AdminNavbar = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuIconHover, setMenuIconHover] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [closeBtnHover, setCloseBtnHover] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const closeDropdown = () => setShowDropdown(false);
  const initials = (localStorage.getItem('email') || 'HR')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    closeDropdown();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    navigate('/');
  };

  return (
    <>
      <nav
        className="admin-navbar"
        style={styles.navbar}
        role="navigation"
        aria-label="Admin Navigation"
      >
        <div className="admin-nav-content" style={styles.navContent}>
          <div className="admin-left-section" style={styles.leftSection}>
            <div
              className="admin-menu-icon"
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

          <div className="admin-brand" style={styles.brand} role="heading">
            HR Admin Dashboard
          </div>

          <div className="admin-right-section" style={styles.rightSection}>
            <div className="admin-notification-wrapper">
              <NotificationBell />
            </div>

            <div
              className="admin-avatar-container-wrapper"
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
                className="admin-avatar"
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
                  className="admin-dropdown"
                  style={styles.dropdown}
                  onMouseLeave={closeDropdown}
                  role="menu"
                  aria-label="User menu"
                >
                  <button
                    className="admin-dropdown-item"
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
                    className="admin-dropdown-item"
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
        className="admin-sidebar"
        style={{
          ...styles.sidebar,
          ...(showSidebar ? styles.sidebarVisible : {}),
        }}
        aria-label="Sidebar navigation"
      >
        <div className="admin-sidebar-header" style={styles.sidebarHeader}>
          <span className="admin-sidebar-title" style={styles.sidebarTitle}>Menu</span>
          <button
            style={{
              ...styles.closeBtn,
              ...(closeBtnHover ? styles.closeBtnHover : {}),
            }}
            onClick={() => setShowSidebar(false)}
            onMouseEnter={() => setCloseBtnHover(true)}
            onMouseLeave={() => setCloseBtnHover(false)}
            title="Close menu"
            aria-label="Close sidebar menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="admin-links-container" style={styles.linksContainer}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => setShowSidebar(false)}
                className="admin-link"
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
                <span className="admin-link-icon" style={styles.linkIcon}>
                  <Icon />
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

export default AdminNavbar;
