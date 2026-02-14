import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const styles = {
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    fontFamily: "'Poppins', sans-serif",
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #0f2850 0%, #1e3c72 25%, #2a5298 50%, #356ca3 75%, #2a5298 100%)',
    padding: '1.8rem 2rem',
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    letterSpacing: '0.4px',
    lineHeight: '1.5',
  },
  headerSubtext: {
    fontSize: '0.65rem',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 400,
    margin: 0,
    display: 'none',
  },
  container: {
    flex: 1,
    background: 'url(https://cdn.builder.io/api/v1/image/assets%2F0fa9afba93164b4c810db5def2af61fa%2F0eb7b24006ee4f838788061b7348ad8c?format=webp&width=800) center/cover no-repeat',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.2rem',
    position: 'relative',
    overflow: 'hidden',
  },
  sidePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingX: '1.5rem',
    position: 'relative',
    zIndex: 10,
  },
  featureCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.8rem',
    animation: 'slideIn 0.6s ease-out',
  },
  featureIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: '#fff',
    flexShrink: 0,
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#1e3c72',
    margin: '0 0 0.35rem 0',
    letterSpacing: '0.3px',
  },
  featureText: {
    fontSize: '0.75rem',
    color: '#555',
    margin: 0,
    lineHeight: '1.5',
    fontWeight: 400,
  },
  blob1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle at 30% 30%, rgba(42, 82, 152, 0.15), transparent 70%)',
    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%)',
    top: '-100px',
    left: '-100px',
    animation: 'float1 8s ease-in-out infinite',
    filter: 'blur(40px)',
  },
  blob2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle at 70% 70%, rgba(58, 123, 213, 0.1), transparent 70%)',
    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
    bottom: '-80px',
    right: '-100px',
    animation: 'float2 10s ease-in-out infinite',
    filter: 'blur(40px)',
  },
  blob3: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle at 50% 50%, rgba(30, 60, 114, 0.08), transparent 70%)',
    borderRadius: '50% 50% 40% 60% / 50% 40% 60% 50%',
    top: '50%',
    right: '5%',
    animation: 'float3 12s ease-in-out infinite',
    filter: 'blur(40px)',
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '1.9rem 2.3rem',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.14)',
    width: '100%',
    maxWidth: '380px',
    animation: 'slideIn 0.5s ease-out',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    position: 'relative',
    zIndex: 10,
  },
  formIcon: {
    marginBottom: '0.8rem',
  },
  logoImage: {
    width: '82px',
    height: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))',
  },
  title: {
    fontSize: '1.28rem',
    fontWeight: 700,
    color: '#1e3c72',
    marginBottom: '0.3rem',
    textAlign: 'center',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '0.72rem',
    color: '#555',
    marginBottom: '1.15rem',
    textAlign: 'center',
    fontWeight: 400,
    lineHeight: '1.5',
  },
  inputField: {
    width: '100%',
    backgroundColor: '#f7f9fc',
    margin: '0.55rem 0',
    height: '44px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.1rem',
    position: 'relative',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: '#dce3ec',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  inputFieldFocus: {
    backgroundColor: '#fff',
    borderColor: '#2a5298',
    boxShadow: '0 0 0 3px rgba(42, 82, 152, 0.12)',
  },
  inputIcon: {
    marginRight: '0.75rem',
    color: '#7d8fa3',
    fontSize: '0.9rem',
    width: '16px',
    textAlign: 'center',
  },
  input: {
    flex: 1,
    background: 'none',
    outline: 'none',
    border: 'none',
    fontWeight: 500,
    fontSize: '0.85rem',
    color: '#2c3e50',
  },
  toggleBtn: {
    position: 'absolute',
    right: '0.9rem',
    background: 'none',
    border: 'none',
    color: '#7d8fa3',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    padding: '0.3rem',
  },
  toggleBtnHover: {
    color: '#2a5298',
  },
  forgotPassword: {
    width: '100%',
    textAlign: 'right',
    marginTop: '0.6rem',
    marginBottom: '1.1rem',
    display: 'none',
  },
  forgotLink: {
    fontSize: '0.74rem',
    color: '#2a5298',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  forgotLinkHover: {
    opacity: 0.75,
    textDecoration: 'underline',
  },
  btn: {
    width: '100%',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    border: 'none',
    outline: 'none',
    height: '46px',
    borderRadius: '9px',
    color: '#fff',
    fontWeight: 700,
    margin: '0.4rem 0 0 0',
    cursor: 'pointer',
    fontSize: '0.88rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Poppins', sans-serif",
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  btnHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 32px rgba(42, 82, 152, 0.3)',
  },
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [error, setError] = useState('');
  const [usernameFocus, setUsernameFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [toggleHover, setToggleHover] = useState(false);
  const [forgotHover, setForgotHover] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);

    try {
      // Make API call to login endpoint
      const response = await axios.post('/auth/login', {
        username,
        password
      });

      if (response.data.token && response.data.user) {
        const { token, user } = response.data;

        // Store authentication data
        const expiryTime = Date.now() + 8 * 60 * 60 * 1000; // 8 hours

        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('username', user.username);
        localStorage.setItem('name', user.name || user.employeeName || '');
        localStorage.setItem('userId', user.id);
        localStorage.setItem('expiry', expiryTime.toString());
        localStorage.setItem('displayName', user.name || user.employeeName || user.username);
        
        // Store employee-specific data if available
        if (user.employeeId) {
          localStorage.setItem('employeeId', user.employeeId);
          localStorage.setItem('employeeName', user.employeeName || '');
        }
        if (user.department) {
          localStorage.setItem('department', user.department);
        }

        toast.success('Login successful!');

        // Redirect based on role
        setTimeout(() => {
          switch (user.role) {
            case 'super_admin':
            case 'hrms_handler':
              navigate('/dashboard');
              break;
            case 'director':
              navigate('/director-dashboard');
              break;
            case 'hod':
              navigate('/hod-dashboard');
              break;
            case 'employee':
              navigate('/employee-dashboard');
              break;
            default:
              navigate('/dashboard');
          }
        }, 500);
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body, html {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes float1 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -50px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 30px) rotate(240deg);
          }
        }
        @keyframes float2 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(-40px, 50px) rotate(120deg);
          }
          66% {
            transform: translate(50px, -30px) rotate(240deg);
          }
        }
        @keyframes float3 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(-30px, 40px) rotate(120deg);
          }
          66% {
            transform: translate(40px, -40px) rotate(240deg);
          }
        }
        input::placeholder {
          color: #a0aec0;
          opacity: 0.9;
        }
        input:focus::placeholder {
          opacity: 0.5;
        }
        @media (max-width: 600px) {
          h1 {
            font-size: 1.15rem !important;
          }
          h2 {
            font-size: 1.05rem !important;
          }
          p {
            font-size: 0.68rem !important;
          }
          input {
            font-size: 0.8rem !important;
          }
          button {
            font-size: 0.78rem !important;
          }
        }
      `}</style>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      <div style={styles.pageWrapper}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Human Resource Management System</h1>
        </header>

        <div style={styles.container}>
          <div style={styles.blob1}></div>
          <div style={styles.blob2}></div>
          <div style={styles.blob3}></div>

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.formIcon}>
              <img src="https://cdn.builder.io/api/v1/image/assets%2F0fa9afba93164b4c810db5def2af61fa%2F906c966f8a0d45d698eee1870f3b64d7?format=webp&width=800" alt="APCP Group Logo" style={styles.logoImage} />
            </div>

            <h2 style={styles.title}>Welcome User</h2>
            <p style={styles.subtitle}>Enter your credentials to access your HRMS account</p>

            {error && (
              <div style={{
                width: '100%',
                padding: '9px 11px',
                marginBottom: '0.9rem',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                borderRadius: '8px',
                fontSize: '0.71rem',
                textAlign: 'center',
                border: '1px solid #ef5350',
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <div style={{
              ...styles.inputField,
              ...(usernameFocus ? styles.inputFieldFocus : {}),
            }}>
              <i className="fas fa-phone" style={styles.inputIcon}></i>
              <input
                type="text"
                placeholder="Phone Number"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUsernameFocus(true)}
                onBlur={() => setUsernameFocus(false)}
                style={styles.input}
                required
                autoComplete="tel"
              />
            </div>

            <div style={{
              ...styles.inputField,
              ...(passwordFocus ? styles.inputFieldFocus : {}),
            }}>
              <i className="fas fa-lock" style={styles.inputIcon}></i>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                style={styles.input}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                onMouseEnter={() => setToggleHover(true)}
                onMouseLeave={() => setToggleHover(false)}
                style={{
                  ...styles.toggleBtn,
                  ...(toggleHover ? styles.toggleBtnHover : {}),
                }}
              >
                <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>

            <div style={styles.forgotPassword}>
              <a
                href="#forgot"
                style={{
                  ...styles.forgotLink,
                  ...(forgotHover ? styles.forgotLinkHover : {}),
                }}
                onMouseEnter={() => setForgotHover(true)}
                onMouseLeave={() => setForgotHover(false)}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              style={{
                ...styles.btn,
                ...(btnHover ? styles.btnHover : {}),
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
