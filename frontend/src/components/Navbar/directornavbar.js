import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../Notifications/NotificationBell';
import { FaChartBar, FaUsers, FaClipboardList, FaFileContract, FaBox, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

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
  brand: {
    fontSize: '1.3rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
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
    overflowY: 'auto',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1050,
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
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    marginLeft: '8px',
    backgroundColor: '#ffc107',
    color: '#000',
    fontSize: '0.75rem',
    fontWeight: '700',
    borderRadius: '12px',
  }
};

// Director menu items (read-only access, no salary info)
const menuItems = [
  { path: '/director-dashboard', label: 'Dashboard', icon: FaChartBar },
  { path: '/employee-info', label: 'View Employees', icon: FaUsers },
  { path: '/employee-activity', label: 'Attendance Reports', icon: FaClipboardList },
  { path: '/hr-leave-requests', label: 'Leave Requests', icon: FaFileContract },
  { path: '/director-assets', label: 'Employee Assets', icon: FaBox },
];

const DirectorNavbar = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuIconHover, setMenuIconHover] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const closeDropdown = () => setShowDropdown(false);
  const initials = (localStorage.getItem('username') || 'D').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    closeDropdown();
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <nav style={styles.navbar}>
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
              title="Menu"
            >
              <FaBars />
            </div>
          </div>

          <div style={styles.brand}>
            Director
          </div>

          <div style={styles.rightSection}>
            <NotificationBell />
            <div
              style={styles.avatarContainer}
              onClick={toggleDropdown}
            >
              <div
                style={{
                  ...styles.avatar,
                  ...(avatarHover ? styles.avatarHover : {}),
                }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
              >
                {initials}
              </div>
              {showDropdown && (
                <div
                  style={styles.dropdown}
                  onMouseLeave={closeDropdown}
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
        />
      )}

      <aside
        style={{
          ...styles.sidebar,
          ...(showSidebar ? styles.sidebarVisible : {}),
        }}
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

export default DirectorNavbar;
