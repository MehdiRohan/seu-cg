import React, { useState } from 'react';
import SEUHomePage from './SEUHomePage';
import CourseNoteFolderManager from './CourseNoteFolderManager';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';

export default function SEUCourseGuideApp() {
  const [auth, setAuth] = useState({
    isLoggedIn: false,
    userRole: null,
    token: null,
    userData: null
  });
  const [currentPage, setCurrentPage] = useState('home');

  const handleLogin = (authPayload) => {
    setAuth({
      isLoggedIn: true,
      userRole: authPayload.role,
      token: authPayload.token,
      userData: authPayload.user
    });
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, userRole: null, token: null, userData: null });
    setCurrentPage('home');
  };

  if (!auth.isLoggedIn) {
    return <SEUHomePage onLogin={handleLogin} />;
  }

  if (currentPage === 'home') {
    if (auth.userRole === 'admin') {
      return <AdminDashboard onLogout={handleLogout} token={auth.token} />;
    }
    return <UserDashboard userName={auth.userData?.name || "User"} onNavigate={setCurrentPage} onLogout={handleLogout} token={auth.token} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FE', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '1rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => setCurrentPage('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', color: '#6366f1', fontSize: '14px' }}>
          ← Back to Dashboard
        </button>
        <span style={{ fontSize: '14px', fontWeight: '800', color: '#1B2559', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {currentPage} Engine
        </span>
      </nav>

      <main style={{ padding: '2rem 5%', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        {currentPage === 'notes' && <CourseNoteFolderManager token={auth.token} role={auth.userRole} />}
      </main>
    </div>
  );
}