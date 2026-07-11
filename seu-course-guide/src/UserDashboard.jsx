import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BookCheck, 
  Award,
  Map, 
  Lightbulb,
  MessageSquare, 
  Search, 
  Menu, 
  LogOut, 
  Upload, 
  Send,
  User,
  Settings,
  X
} from 'lucide-react';
import CourseNoteFolderManager from './CourseNoteFolderManager';
import logoImage from './assets/logo.png';

const curriculumData = [
  {
    semester: "Semester 1",
    courses: [
      { code: "CSE141", name: "Computer Fundamentals", prerequisite: "Nil" },
      { code: "ENG101", name: "Basic Composition", prerequisite: "Nil" },
      { code: "MAT141", name: "Differential & Integral Calculus", prerequisite: "Nil" },
      { code: "ACT141", name: "Introduction to Accounting", prerequisite: "Nil" }
    ]
  },
  {
    semester: "Semester 2",
    courses: [
      { code: "ENG102", name: "Intermediate Composition", prerequisite: "ENG101" },
      { code: "PHY161", name: "Physics - I", prerequisite: "Nil" },
      { code: "CSE161", name: "Programming Language I", prerequisite: "CSE141" },
      { code: "CSE162", name: "Programming Language I Lab", prerequisite: "CSE141" },
      { code: "MAT161", name: "Coordinate Geometry and Vector Analysis", prerequisite: "MAT141" }
    ]
  },
  {
    semester: "Semester 3",
    courses: [
      { code: "CSE181", name: "Discrete Mathematics", prerequisite: "CSE161" },
      { code: "ENG103", name: "Advanced English Skills", prerequisite: "ENG102" },
      { code: "EEE181", name: "Electrical Circuits Design I", prerequisite: "Nil" },
      { code: "EEE182", name: "Electrical Circuits Design I Lab", prerequisite: "Nil" },
      { code: "PHY181", name: "Physics II", prerequisite: "PHY161" },
      { code: "PHY182", name: "Physics II Lab", prerequisite: "PHY161" }
    ]
  },
  {
    semester: "Semester 4",
    courses: [
      { code: "CSE241", name: "Data Structures", prerequisite: "CSE181" },
      { code: "CSE242", name: "Data Structures Lab", prerequisite: "CSE181" },
      { code: "ENG105", name: "Public Speaking", prerequisite: "ENG103" },
      { code: "MAT241", name: "Complex Variables and Transforms (Laplace & Fourier)", prerequisite: "MAT141" },
      { code: "EEE241", name: "Electronic Devices & Circuits I", prerequisite: "EEE181" },
      { code: "EEE242", name: "Electronic Devices & Circuits I Lab", prerequisite: "EEE181, EEE182" }
    ]
  },
  {
    semester: "Semester 5",
    courses: [
      { code: "CSE261", name: "Numerical Methods", prerequisite: "CSE181, MAT161" },
      { code: "CSE263", name: "Digital Logic Design", prerequisite: "CSE161" },
      { code: "CSE264", name: "Digital Logic Design Lab", prerequisite: "CSE161" },
      { code: "MAT261", name: "Linear Algebra and Matrices", prerequisite: "MAT241" },
      { code: "CSE265", name: "Algorithm", prerequisite: "CSE241" },
      { code: "CSE266", name: "Algorithm Lab", prerequisite: "CSE241, CSE242" }
    ]
  },
  {
    semester: "Semester 6",
    courses: [
      { code: "MGT281", name: "Introduction to Business & Management", prerequisite: "CSE241" },
      { code: "CSE281", name: "Introduction to Programming Language II (Java)", prerequisite: "CSE161, CSE162" },
      { code: "CSE282", name: "Introduction to Programming Language II (Java) Lab", prerequisite: "CSE161, CSE162" },
      { code: "ETE281", name: "Communication Theory", prerequisite: "MAT241, EEE241" },
      { code: "ETE282", name: "Communication Lab", prerequisite: "MAT241, EEE241" },
      { code: "STA281", name: "Statistical Methods & Probability", prerequisite: "Nil" }
    ]
  }
];

export default function UserDashboard({ userName, onLogout, token }) {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tab toggles & modals
  const [treeMode, setTreeMode] = useState('curriculum');
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);

  // User details
  const [profileData, setProfileData] = useState({
    name: userName,
    email: '',
    cgpa: '',
    department: '',
    profile_status: null
  });
  const [editForm, setEditForm] = useState({ name: '', email: '', cgpa: '', department: '' });

  // Data States
  const [recentNotes, setRecentNotes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [foldersMap, setFoldersMap] = useState({});
  const [scholars, setScholars] = useState([]);
  const [userRank, setUserRank] = useState('N/A');

  // Form States
  const [questionForm, setQuestionForm] = useState({ courseName: '', courseCode: '', termType: 'Mid', academicYear: '' });
  const [questionFile, setQuestionFile] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hydrate dashboard metrics and lists
  const fetchDashboardData = async () => {
    try {
      // 1. Get recent notes
      const notesRes = await fetch('http://localhost:5000/api/notes/recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notesRes.ok) {
        const data = await notesRes.json();
        setRecentNotes(data);
      }

      // 2. Get questions
      const qRes = await fetch('http://localhost:5000/api/questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (qRes.ok) {
        const data = await qRes.json();
        setQuestions(data);
      }

      // 3. Get all folders/notes to generate tree map & statistics
      const mapRes = await fetch('http://localhost:5000/api/folders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mapRes.ok) {
        const data = await mapRes.json();
        setFoldersMap(data);
      }

      // 4. Get Scholars List
      const scholarsRes = await fetch('http://localhost:5000/api/scholars', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (scholarsRes.ok) {
        const data = await scholarsRes.json();
        setScholars(data);
        
        // Find user's rank
        const match = data.find(s => s.name.toLowerCase() === profileData.name.toLowerCase());
        if (match) {
          setUserRank(`# ${String(match.rankPosition).padStart(2, '0')}`);
        } else {
          setUserRank('N/A');
        }
      }

      // 5. Hydrate current logged in user details
      const parts = token.split('-');
      const userId = parts[2];
      const usersListRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersListRes.ok) {
        const users = await usersListRes.json();
        const me = users.find(u => String(u.id) === String(userId));
        if (me) {
          setProfileData({
            name: me.name || userName,
            email: me.email || '',
            cgpa: me.cgpa || '',
            department: me.department || '',
            profile_status: me.profile_status || null
          });
        }
      }
    } catch (err) {
      console.error('Error hydrating user dashboard:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, activeTab, profileData.name]);

  // Open edit profile and prefill form
  const handleOpenEditProfile = () => {
    setEditForm({
      name: profileData.name,
      email: profileData.email,
      cgpa: profileData.cgpa,
      department: profileData.department
    });
    setEditProfileOpen(true);
    setProfileDropdownOpen(false);
  };

  // Submit Profile Edits
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/user/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        alert('Profile updates submitted. Pending Admin approval.');
        setEditProfileOpen(false);
        fetchDashboardData();
      } else {
        alert('Failed to submit profile update.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Question Upload
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionForm.courseName || !questionForm.courseCode || !questionForm.academicYear) {
      alert('Please fill out all question bank fields');
      return;
    }

    const payload = new FormData();
    payload.append('courseName', questionForm.courseName);
    payload.append('courseCode', questionForm.courseCode);
    payload.append('termType', questionForm.termType);
    payload.append('academicYear', questionForm.academicYear);
    if (questionFile) {
      payload.append('document', questionFile);
    }

    try {
      const res = await fetch('http://localhost:5000/api/questions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });
      if (res.ok) {
        alert('Question uploaded successfully!');
        setQuestionForm({ courseName: '', courseCode: '', termType: 'Mid', academicYear: '' });
        setQuestionFile(null);
        fetchDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to upload question');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading question paper');
    }
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: feedbackMsg })
      });
      if (res.ok) {
        alert('Feedback submitted. Thank you!');
        setFeedbackMsg('');
      } else {
        alert('Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render tree node recursive component with recursion-loop guard
  const renderTreeNode = (id, depth = 0, visited = new Set()) => {
    if (visited.has(id)) return null;
    const node = foldersMap[id];
    if (!node) return null;
    visited.add(id);

    return (
      <div key={id} style={{ marginLeft: `${depth * 20}px`, marginTop: '6px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '4px' }}>
          <span>{node.type === 'folder' ? '📁' : '📄'}</span>
          <span style={{ fontWeight: node.type === 'folder' ? '700' : '400', fontSize: '13px', color: '#1B2559' }}>
            {node.name} {node.courseCode ? `(${node.courseCode})` : ''}
          </span>
        </div>
        {node.children && node.children.map(childId => renderTreeNode(childId, depth + 1, new Set(visited)))}
      </div>
    );
  };

  // Filtered Questions
  const filteredQuestions = questions.filter(q => 
    q.courseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarMenuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, id: 'Dashboard' },
    { label: 'Course Notes', icon: <BookOpen size={18} />, id: 'Course Notes' },
    { label: 'Question Bank', icon: <BookCheck size={18} />, id: 'Question Bank' },
    { label: 'Top Scholars', icon: <Award size={18} />, id: 'Top Scholars' },
    { label: 'Course Tree Map', icon: <Map size={18} />, id: 'Course Tree Map' },
    { label: 'Course Tips', icon: <Lightbulb size={18} />, id: 'Course Tips' },
    { label: 'Course Feedback', icon: <MessageSquare size={18} />, id: 'Course Feedback' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FD', color: '#1B2559', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ 
        width: isSidebarOpen ? '280px' : '0px', 
        background: 'white', 
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000,
        boxShadow: isSidebarOpen ? '4px 0px 30px rgba(0, 0, 0, 0.03)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #EAF0FA'
      }}>
        {/* Logo block */}
        <div style={{ padding: '2rem 1.5rem 2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoImage} alt="Logo" style={{ width: '38px', height: '38px' }} />
          <span style={{ color: '#001571', fontWeight: '800', fontSize: '18px', whiteSpace: 'nowrap' }}>
            SEU <span style={{ color: '#5e5adb' }}>Course Guide</span>
          </span>
        </div>

        {/* Menu list */}
        <nav style={{ padding: '0 1rem', flex: 1 }}>
          {sidebarMenuItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '15px',
                color: activeTab === item.id ? '#5e5adb' : '#707EAE',
                background: activeTab === item.id ? '#F0EFFF' : 'transparent',
                cursor: 'pointer', marginBottom: '6px', fontWeight: '700', fontSize: '14px'
              }}
            >
              {item.icon} <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Logout button */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid #F0F4FA' }}>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', width: '100%', border: 'none', background: '#FFEDED', color: '#dc2626', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Structural Wrapper */}
      <main style={{ flex: 1, marginLeft: isSidebarOpen && window.innerWidth >= 1024 ? '280px' : '0px', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Content Body Container */}
        <div style={{ padding: '2rem max(1.5rem, 3%)', flex: 1, boxSizing: 'border-box' }}>
          
          {/* Header Panel */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Welcome messages */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Menu size={20} color="#001571" />
              </button>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#1B2559' }}>
                  Welcome Back, <span style={{ color: '#5e5adb' }}>{profileData.name}</span>!
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#A3AED0', fontWeight: '600' }}>Let's Continue Your Learning Journey.</p>
              </div>
            </div>
            
            {/* Topbar controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              
              {/* Search Core */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'white', borderRadius: '30px', padding: '6px 18px', border: '1px solid #E2E8F0', width: '100%', maxWidth: '300px' }}>
                <Search size={16} color="#707EAE" />
                <input type="text" placeholder="Search For Notes, Questions, Topics..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', padding: '8px 10px', width: '100%', outline: 'none', fontSize: '13px', color: '#1B2559' }} />
              </div>

              {/* Profile Card and Dropdown */}
              <div style={{ position: 'relative' }}>
                <div onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '6px 16px', borderRadius: '30px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=5e5adb&color=fff&bold=true`} 
                    alt="User Profile" 
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }} 
                  />
                  <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1B2559', display: 'block' }}>{profileData.name}</span>
                    <span style={{ fontSize: '10px', color: '#A3AED0', display: 'block', textTransform: 'capitalize', marginTop: '-2px' }}>Student</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#707EAE' }}>▼</span>
                </div>

                {isProfileDropdownOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '48px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 100, width: '160px', overflow: 'hidden' }}>
                    <button onClick={handleOpenEditProfile} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', border: 'none', background: 'transparent', padding: '12px 16px', color: '#1B2559', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                      <Settings size={15} /> Edit Profile
                    </button>
                    <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', border: 'none', background: 'transparent', padding: '12px 16px', color: '#dc2626', borderTop: '1px solid #F0F4FA', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* DYNAMIC VIEWS */}
          {activeTab === 'Dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              
              {/* Premium Dashboard Navigation Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                
                {/* 1. Course Notes Card */}
                <div onClick={() => setActiveTab('Course Notes')} style={{ background: '#FFF5F5', border: '1px solid #FFE3E3', padding: '1.5rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255, 227, 227, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#7A1C1C' }}>Courses Notes</h3>
                    <span style={{ fontSize: '12px', color: '#A37575', fontWeight: '700', marginTop: '6px', display: 'block' }}>View All Notes</span>
                  </div>
                  <BookOpen size={36} color="#A83F3F" />
                </div>

                {/* 2. Question Bank Card */}
                <div onClick={() => setActiveTab('Question Bank')} style={{ background: '#E6FFFA', border: '1px solid #B2F5EA', padding: '1.5rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(178, 245, 234, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#005A5B' }}>Question Bank</h3>
                    <span style={{ fontSize: '12px', color: '#4D8B8C', fontWeight: '700', marginTop: '6px', display: 'block' }}>View All Question</span>
                  </div>
                  <BookCheck size={36} color="#319795" />
                </div>

                {/* 3. Top Scholars Card */}
                <div onClick={() => setActiveTab('Top Scholars')} style={{ background: '#FAF5FF', border: '1px solid #E9D8FD', padding: '1.5rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(233, 216, 253, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#44337A' }}>Top Scholars</h3>
                    <span style={{ fontSize: '12px', color: '#71639E', fontWeight: '700', marginTop: '6px', display: 'block' }}>Meet All Toopers</span>
                  </div>
                  <Award size={36} color="#805AD5" />
                </div>

                {/* 4. Your Rank Card */}
                <div onClick={() => setActiveTab('Top Scholars')} style={{ background: '#FEFCBF', border: '1px solid #FAF089', padding: '1.5rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(250, 240, 137, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#744210' }}>Your Rank</h3>
                    <span style={{ fontSize: '14px', color: '#975A16', fontWeight: '800', marginTop: '6px', display: 'block' }}>{userRank}</span>
                  </div>
                  <Award size={36} color="#D69E2E" />
                </div>

                {/* 5. Course Tree Map Card */}
                <div onClick={() => setActiveTab('Course Tree Map')} style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '1.5rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(220, 252, 231, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#14532D' }}>Courses Tree Map</h3>
                    <span style={{ fontSize: '12px', color: '#166534', fontWeight: '700', marginTop: '6px', display: 'block' }}>View All Mapping</span>
                  </div>
                  <Map size={36} color="#16A34A" />
                </div>

                {/* 6. Course Tips Card */}
                <div onClick={() => setActiveTab('Course Tips')} style={{ background: '#EBF8FF', border: '1px solid #BEE3F8', padding: '1.5rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(190, 227, 248, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#2A4365' }}>Course Tips</h3>
                    <span style={{ fontSize: '12px', color: '#495D7A', fontWeight: '700', marginTop: '6px', display: 'block' }}>View All Tips</span>
                  </div>
                  <Lightbulb size={36} color="#3182CE" />
                </div>

                {/* 7. Course Feedback Card */}
                <div onClick={() => setActiveTab('Course Feedback')} style={{ background: '#FFFAF0', border: '1px solid #FEEBC8', padding: '1.5rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(254, 235, 200, 0.2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#7B341E' }}>Courses Feedback</h3>
                    <span style={{ fontSize: '12px', color: '#9C5844', fontWeight: '700', marginTop: '6px', display: 'block' }}>View All Feedback</span>
                  </div>
                  <MessageSquare size={36} color="#DD6B20" />
                </div>

              </div>

              {/* Quick Access Ribbon */}
              <div style={{ background: '#EFF4FB', padding: '1.5rem 2.5rem', borderRadius: '18px' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#5e5adb', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Access</h4>
                <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Course Notes', icon: <BookOpen size={20} />, tab: 'Course Notes' },
                    { label: 'Question Bank', icon: <BookCheck size={20} />, tab: 'Question Bank' },
                    { label: 'Top Scholars', icon: <Award size={20} />, tab: 'Top Scholars' },
                    { label: 'Course Tree Map', icon: <Map size={20} />, tab: 'Course Tree Map' },
                    { label: 'Course Tips', icon: <Lightbulb size={20} />, tab: 'Course Tips' },
                    { label: 'Course Feedback', icon: <MessageSquare size={20} />, tab: 'Course Feedback' }
                  ].map((qa, index) => (
                    <div 
                      key={index}
                      onClick={() => setActiveTab(qa.tab)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <div style={{ background: 'white', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        {qa.icon}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1B2559' }}>{qa.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'Course Notes' && (
            <CourseNoteFolderManager token={token} role="student" />
          )}

          {activeTab === 'Question Bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Upload New Question Card */}
              <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#001571', fontWeight: '800' }}>Submit Course Exam Paper</h3>
                <form onSubmit={handleQuestionSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Course Title</label>
                    <input type="text" placeholder="e.g. Database Systems" required value={questionForm.courseName} onChange={e => setQuestionForm({...questionForm, courseName: e.target.value})} style={{ width: '100%', padding: '11px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Course Code</label>
                    <input type="text" placeholder="e.g. CSE 3113" required value={questionForm.courseCode} onChange={e => setQuestionForm({...questionForm, courseCode: e.target.value})} style={{ width: '100%', padding: '11px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Term Scope</label>
                    <select value={questionForm.termType} onChange={e => setQuestionForm({...questionForm, termType: e.target.value})} style={{ width: '100%', padding: '11px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px' }}>
                      <option value="Mid">Mid Term</option>
                      <option value="Final">Final Term</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Academic Year</label>
                    <input type="text" placeholder="e.g. 2026" required value={questionForm.academicYear} onChange={e => setQuestionForm({...questionForm, academicYear: e.target.value})} style={{ width: '100%', padding: '11px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Upload Question File (PDF/Image)</label>
                    <input type="file" onChange={e => setQuestionFile(e.target.files[0])} style={{ width: '100%', fontSize: '12px' }} />
                  </div>
                  <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#5e5adb', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                    <Upload size={16} /> Upload Paper
                  </button>
                </form>
              </div>

              {/* Question Papers Ledger */}
              <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#001571', fontWeight: '800' }}>Question Papers Bank</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#A3AED0', fontSize: '13px' }}>
                        <th style={{ padding: '12px 16px' }}>Course</th>
                        <th style={{ padding: '12px 16px' }}>Code</th>
                        <th style={{ padding: '12px 16px' }}>Term</th>
                        <th style={{ padding: '12px 16px' }}>Year</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Document</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '2rem', textTransform: 'none', color: '#A3AED0', textAlign: 'center' }}>No exam papers found matching query.</td>
                        </tr>
                      ) : (
                        filteredQuestions.map((q) => (
                          <tr key={q.id} style={{ borderBottom: '1px solid #E2E8F0', color: '#1B2559', fontSize: '14px' }}>
                            <td style={{ padding: '12px 16px', fontWeight: '700' }}>{q.courseName}</td>
                            <td style={{ padding: '12px 16px' }}>{q.courseCode}</td>
                            <td style={{ padding: '12px 16px' }}>{q.termType}</td>
                            <td style={{ padding: '12px 16px' }}>{q.academicYear}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              {q.filePath && q.filePath !== '#' ? (
                                <a href={`http://localhost:5000${q.filePath}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: '700' }}>View Paper 📄</a>
                              ) : (
                                <span style={{ color: '#A3AED0' }}>No File</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Top Scholars' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Profile setup reminder banner for Scholars */}
              <div style={{ background: '#F0EFFF', padding: '1.5rem', borderRadius: '18px', border: '1px solid #DEDAFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#001571', fontWeight: '800' }}>Add Yourself to the Leaderboard!</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#707EAE', fontWeight: '600' }}>
                    Click "Edit Profile" from the top avatar dropdown, update your CGPA and Department, and submit. Ranks are assigned automatically once approved!
                  </p>
                </div>
                <button onClick={handleOpenEditProfile} style={{ background: '#5e5adb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>
                  Edit Profile Data
                </button>
              </div>

              {/* Leaderboard registry list */}
              <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#001571', fontWeight: '800' }}>Top Scholars Academic Leaderboard</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#A3AED0', fontSize: '13px' }}>
                        <th style={{ padding: '12px' }}>Rank</th>
                        <th style={{ padding: '12px' }}>Scholar Name</th>
                        <th style={{ padding: '12px' }}>Department</th>
                        <th style={{ padding: '12px' }}>CGPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scholars.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '2rem', textTransform: 'none', color: '#A3AED0', textAlign: 'center' }}>No scholars registered yet.</td>
                        </tr>
                      ) : (
                        scholars.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #E2E8F0', fontSize: '14px', color: '#1B2559' }}>
                            <td style={{ padding: '12px' }}>
                              <span style={{ background: '#F0EFFF', color: '#5e5adb', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }}>
                                #{String(s.rankPosition).padStart(2, '0')}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: '700' }}>{s.name}</td>
                            <td style={{ padding: '12px' }}>{s.department}</td>
                            <td style={{ padding: '12px', color: '#059669', fontWeight: '800' }}>{parseFloat(s.cgpa).toFixed(2)} / 4.00</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Course Tree Map' && (
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: '#001571', fontWeight: '800' }}>Course Tree Mapping</h3>
                
                {/* Toggles */}
                <div style={{ display: 'flex', background: '#F4F7FE', borderRadius: '12px', padding: '4px' }}>
                  <button 
                    onClick={() => setTreeMode('curriculum')}
                    style={{ 
                      padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                      background: treeMode === 'curriculum' ? '#001571' : 'transparent',
                      color: treeMode === 'curriculum' ? 'white' : '#A3AED0'
                    }}
                  >
                    Curriculum & Prerequisites
                  </button>
                  <button 
                    onClick={() => setTreeMode('files')}
                    style={{ 
                      padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                      background: treeMode === 'files' ? '#001571' : 'transparent',
                      color: treeMode === 'files' ? 'white' : '#A3AED0'
                    }}
                  >
                    Repository Files
                  </button>
                </div>
              </div>

              {treeMode === 'curriculum' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {curriculumData.map((sem, idx) => (
                    <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem', background: '#F8FAFC' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#001571', fontWeight: '800' }}>{sem.semester}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {sem.courses.map((course) => (
                          <div key={course.code} style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontWeight: '800', color: '#5e5adb', fontSize: '12px', background: '#F4F7FE', padding: '4px 10px', borderRadius: '8px' }}>{course.code}</span>
                              <span style={{ 
                                fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                                background: course.prerequisite === 'Nil' ? '#E6F4EA' : '#FCE8E6',
                                color: course.prerequisite === 'Nil' ? '#137333' : '#C5221F'
                              }}>
                                Prereq: {course.prerequisite}
                              </span>
                            </div>
                            <h5 style={{ margin: 0, fontSize: '14px', color: '#1B2559', fontWeight: '700' }}>{course.name}</h5>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  {Object.keys(foldersMap).length === 0 ? (
                    <p style={{ color: '#A3AED0' }}>Loading tree map...</p>
                  ) : (
                    renderTreeNode('root')
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Course Tips' && (
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#001571', fontWeight: '800' }}>SEU Academic Tips & Guidelines</h3>
              <p style={{ fontSize: '13px', color: '#A3AED0', margin: '0 0 2rem 0' }}>Here are study guidelines and tricks from senior toppers and faculty members.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  { title: "Excel in Programming Languages Lab (CSE162)", tips: "Practice coding from HackerRank regularly. The lab exams are mostly based on simple logic loops, so trace array manipulations manually!" },
                  { title: "Ace Data Structures (CSE241)", tips: "Visualize standard pointers operations: Linked Lists nodes and Trees rotations. Draw graphs on paper before converting to structures!" },
                  { title: "Prepare for Digital Logic Design (CSE263)", tips: "Build clean Karnaugh Maps (K-Maps) and double-check truth tables. Minimize Boolean expressions first to construct circuits with fewer gates." }
                ].map((tip, idx) => (
                  <div key={idx} style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#5e5adb', fontWeight: '800' }}>💡 {tip.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#1B2559', lineHeight: '1.6' }}>{tip.tips}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Course Feedback' && (
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #E2E8F0', maxWidth: '600px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#001571', fontWeight: '800' }}>Submit Platform Feedback</h3>
              <p style={{ fontSize: '13px', color: '#A3AED0', margin: '0 0 1.5rem 0' }}>Share your feedback, suggestions, or reports directly with the system administrator.</p>
              
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea 
                  placeholder="Enter your message here..." 
                  required 
                  value={feedbackMsg} 
                  onChange={e => setFeedbackMsg(e.target.value)} 
                  style={{ width: '100%', height: '150px', padding: '15px', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} 
                />
                <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#001571', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', width: 'fit-content' }}>
                  <Send size={16} /> Send Feedback
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Global Premium Dark Footer */}
        <footer style={{ background: '#000839', color: 'white', padding: '4rem 4rem 2rem 4rem', borderTop: '1px solid #111B5A', marginTop: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '18px', marginBottom: '1.5rem' }}>
                <img src={logoImage} alt="Logo" style={{ width: '32px', height: '32px' }} />
                <span style={{ color: '#fff' }}>SEU <span style={{ color: '#5e5adb' }}>Course Guide</span></span>
              </div>
              <p style={{ color: '#7C88C0', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                Empowering Students With The Best Learning Resources, Expert Guidance And Smart Tools To Achieve Greatness
              </p>
            </div>

            <div>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '15px', color: '#fff', fontWeight: '800' }}>Features</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#7C88C0' }}>
                <span onClick={() => setActiveTab('Course Notes')} style={{ cursor: 'pointer' }}>Course Notes</span>
                <span onClick={() => setActiveTab('Question Bank')} style={{ cursor: 'pointer' }}>Question Bank</span>
                <span onClick={() => setActiveTab('Top Scholars')} style={{ cursor: 'pointer' }}>Top Scholars</span>
                <span onClick={() => setActiveTab('Course Tips')} style={{ cursor: 'pointer' }}>Course Tips</span>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '15px', color: '#fff', fontWeight: '800' }}>Resources</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#7C88C0' }}>
                <span>Blog</span><span>Study Guides</span><span>Help Centre</span><span>Community</span>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '15px', color: '#fff', fontWeight: '800' }}>Account</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#7C88C0' }}>
                <span onClick={handleOpenEditProfile} style={{ cursor: 'pointer' }}>Profile</span>
                <span onClick={() => setActiveTab('Top Scholars')} style={{ cursor: 'pointer' }}>My Progress</span>
                <span onClick={handleOpenEditProfile} style={{ cursor: 'pointer' }}>Settings</span>
                <span>Notification</span>
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '15px', color: '#fff', fontWeight: '800' }}>Get In Touch</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#7C88C0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📧 seucourseguide2026@gmail.com</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📞 +8801674316811</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📍 Southeast University, Tejgaon</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #111B5A', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#7C88C0', flexWrap: 'wrap', gap: '1rem' }}>
            <span>© 2026 SEU Course Guide. All Right Reserved.</span>
            <span>Privacy | Terms & Condition</span>
          </div>
        </footer>

      </main>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', width: '100%', maxWidth: '480px', boxSizing: 'border-box', position: 'relative' }}>
            <button onClick={() => setEditProfileOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#707EAE' }}>
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 8px 0', color: '#001571', fontWeight: '800' }}>Edit Profile Information</h3>
            <p style={{ fontSize: '12px', color: '#A3AED0', margin: '0 0 1.5rem 0' }}>Update your user records. Edits require administrative approval before taking effect.</p>

            {profileData.profile_status === 'pending' && (
              <div style={{ background: '#FFFDF0', border: '1px solid #FBE09C', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#7B5E1E', fontWeight: '600', marginBottom: '1.5rem' }}>
                ⚠️ You have updates pending approval from an admin.
              </div>
            )}

            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Academic CGPA</label>
                <input type="number" step="0.01" min="0" max="4.00" placeholder="e.g. 3.90" value={editForm.cgpa} onChange={e => setEditForm({...editForm, cgpa: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#1B2559', display: 'block', marginBottom: '6px' }}>Department Code</label>
                <input type="text" placeholder="e.g. CSE" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" style={{ background: '#5e5adb', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}>
                Submit Changes for Approval
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}