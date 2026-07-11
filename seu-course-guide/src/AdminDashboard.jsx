import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Upload, 
  Trash2, 
  FileText, 
  BookOpen, 
  Award, 
  Users, 
  MessageSquare,
  CheckCircle,
  UserCheck,
  LogOut 
} from 'lucide-react';

export default function AdminDashboard({ onLogout, token }) {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('notes');
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);

  // Form states
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [noteForm, setNoteForm] = useState({ name: '', courseCode: '' });
  const [noteFile, setNoteFile] = useState(null);
  
  const [questionForm, setQuestionForm] = useState({ courseName: '', courseCode: '', termType: 'Mid', academicYear: '' });
  const [questionFile, setQuestionFile] = useState(null);

  const [scholarForm, setScholarForm] = useState({ name: '', cgpa: '', rankPosition: '', department: '' });

  // --- API DATA PIPELINE ---
  const executeDataFetchPipeline = async () => {
    try {
      // 1. Fetch Folders/Notes Map
      const foldersRes = await fetch('http://localhost:5000/api/folders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (foldersRes.ok) {
        const mapData = await foldersRes.json();
        const folderList = [];
        const fileList = [];
        Object.values(mapData).forEach(node => {
          if (node.id === 'root') return;
          if (node.type === 'folder') {
            folderList.push(node);
          } else {
            fileList.push({
              id: parseInt(node.id.split('_')[1], 10),
              name: node.name,
              courseCode: node.courseCode,
              fileSize: node.size,
              folder_id: node.parent
            });
          }
        });
        setFolders(folderList);
        setNotes(fileList);
      }

      // 2. Fetch Pending Notes
      const pendingRes = await fetch('http://localhost:5000/api/admin/notes/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pendingRes.ok) {
        const pData = await pendingRes.json();
        setPendingNotes(pData);
      }

      // 3. Fetch Questions
      const questionsRes = await fetch('http://localhost:5000/api/questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (questionsRes.ok) {
        const qData = await questionsRes.json();
        setQuestions(qData);
      }

      // 4. Fetch Scholars
      const scholarsRes = await fetch('http://localhost:5000/api/scholars', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (scholarsRes.ok) {
        const sData = await scholarsRes.json();
        setScholars(sData);
      }

      // 5. Fetch Feedbacks
      const feedbackRes = await fetch('http://localhost:5000/api/feedback', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (feedbackRes.ok) {
        const fData = await feedbackRes.json();
        setFeedbacks(fData);
      }

      // 6. Fetch Registered Users
      const usersRes = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData);
      }

      // 7. Fetch Pending Profile Requests
      const prRes = await fetch('http://localhost:5000/api/admin/profile-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (prRes.ok) {
        const prData = await prRes.json();
        setProfileRequests(prData);
      }

    } catch (error) {
      console.error('Data pipeline error:', error);
    }
  };

  useEffect(() => {
    executeDataFetchPipeline();
  }, [token, activeTab]);

  // --- ACTION HANDLERS ---
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newFolderName, parentId: 'root' })
      });
      if (res.ok) {
        setNewFolderName('');
        executeDataFetchPipeline();
        alert('Folder directory registered successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadNote = async (e) => {
    e.preventDefault();
    if (!noteForm.name || !selectedFolder || !noteFile) {
      alert('Please fill out note name, folder, and choose a file.');
      return;
    }

    const payload = new FormData();
    payload.append('document', noteFile);
    payload.append('courseCode', noteForm.courseCode || 'GENERIC');
    payload.append('folderId', selectedFolder);

    try {
      const res = await fetch('http://localhost:5000/api/notes/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });
      if (res.ok) {
        setNoteForm({ name: '', courseCode: '' });
        setNoteFile(null);
        executeDataFetchPipeline();
        alert('Course note record saved (Approved automatically for Admin).');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveNote = async (noteId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${noteId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Note approved and published successfully.');
        executeDataFetchPipeline();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.courseName || !questionForm.courseCode || !questionForm.academicYear) {
      alert('Fill out all fields for question');
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
        setQuestionForm({ courseName: '', courseCode: '', termType: 'Mid', academicYear: '' });
        setQuestionFile(null);
        executeDataFetchPipeline();
        alert('Question bank record saved.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddScholar = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/scholars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: scholarForm.name,
          cgpa: parseFloat(scholarForm.cgpa),
          rankPosition: parseInt(scholarForm.rankPosition, 10),
          department: scholarForm.department
        })
      });
      if (res.ok) {
        setScholarForm({ name: '', cgpa: '', rankPosition: '', department: '' });
        executeDataFetchPipeline();
        alert('Academic scholar ledger updated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveProfile = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/profile-requests/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Profile details approved and updated successfully.');
        executeDataFetchPipeline();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectProfile = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/profile-requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Profile updates rejected.');
        executeDataFetchPipeline();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this item from the ${type} registry?`)) {
      return;
    }

    try {
      let endpoint = '';
      if (type === 'folder') endpoint = `http://localhost:5000/api/entities/${id}`;
      if (type === 'note') endpoint = `http://localhost:5000/api/entities/n_${id}`;
      if (type === 'question') endpoint = `http://localhost:5000/api/questions/${id}`;
      if (type === 'scholar') endpoint = `http://localhost:5000/api/scholars/${id}`;
      if (type === 'user') endpoint = `http://localhost:5000/api/admin/users/${id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        executeDataFetchPipeline();
        alert('Deleted successfully.');
      } else {
        alert('Failed to delete item.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar Navigation */}
      <div style={{ width: '280px', background: '#001571', color: 'white', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            SEU Admin Board
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setActiveTab('notes')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: activeTab === 'notes' ? '#5e5adb' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}>
              <FileText size={18} /> Course Notes Control
            </button>
            <button onClick={() => setActiveTab('approvals')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: activeTab === 'approvals' ? '#5e5adb' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}>
              <CheckCircle size={18} /> Pending Approvals ({pendingNotes.length})
            </button>
            <button onClick={() => setActiveTab('profile-approvals')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: activeTab === 'profile-approvals' ? '#5e5adb' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}>
              <UserCheck size={18} /> Profile Approvals ({profileRequests.length})
            </button>
            <button onClick={() => setActiveTab('questions')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: activeTab === 'questions' ? '#5e5adb' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}>
              <BookOpen size={18} /> Question Bank Registry
            </button>
            <button onClick={() => setActiveTab('scholars')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: activeTab === 'scholars' ? '#5e5adb' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}>
              <Award size={18} /> Top Scholars Tracking
            </button>
            <button onClick={() => setActiveTab('users')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: activeTab === 'users' ? '#5e5adb' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}>
              <Users size={18} /> User Ledger
            </button>
            <button onClick={() => setActiveTab('feedback')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: activeTab === 'feedback' ? '#5e5adb' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600' }}>
              <MessageSquare size={18} /> User Feedbacks ({feedbacks.length})
            </button>
          </div>
        </div>
        
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: '600', marginTop: 'auto' }}>
          <LogOut size={18} /> Exit Dashboard
        </button>
      </div>

      {/* Main Dynamic View Area */}
      <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 2rem 0', color: '#111827', fontSize: '28px' }}>
          {activeTab === 'notes' && 'Course Notes & Directory Control'}
          {activeTab === 'approvals' && 'Pending Student Lecture Notes'}
          {activeTab === 'profile-approvals' && 'Pending Profile Update Requests'}
          {activeTab === 'questions' && 'Academic Evaluation Question Bank'}
          {activeTab === 'scholars' && 'Top Scholars Academic Rankings'}
          {activeTab === 'users' && 'Student & User Accounts'}
          {activeTab === 'feedback' && 'Platform Feedbacks Inbox'}
        </h2>

        {/* TAB CONTENT: COURSE NOTES */}
        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Create Folder Block */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', color: '#374151' }}>Create New Directory Folder</h3>
              <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" placeholder="e.g., CSE 4123 - Artificial Intelligence" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
                <button type="submit" style={{ background: '#5e5adb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  <FolderPlus size={16} /> Create Folder
                </button>
              </form>
            </div>

            {/* Upload Note Block */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', color: '#374151' }}>Upload Note Document</h3>
              <form onSubmit={handleUploadNote} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>Target Folder</label>
                  <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                    <option value="">-- Choose Folder --</option>
                    <option value="root">Root Folder</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>Course Code</label>
                  <input type="text" placeholder="e.g., CSE 3111" value={noteForm.courseCode} onChange={(e) => setNoteForm(prev => ({...prev, courseCode: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>Select PDF Document</label>
                  <input type="file" required onChange={e => setNoteFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                </div>
                <button type="submit" style={{ background: '#059669', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  <Upload size={16} /> Save & Approve
                </button>
              </form>
            </div>

            {/* Current Folder Tree Representation */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', color: '#374151' }}>Active Directory Tree</h3>
              
              {/* Root Level Notes */}
              <div style={{ border: '1px dashed #d1d5db', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', background: '#fafafa' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '6px', marginBottom: '6px' }}>📁 Home Root Notes</div>
                {notes.filter(n => !n.folder_id || n.folder_id === 'root').map(note => (
                  <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
                    <span>📄 {note.name} ({note.courseCode})</span>
                    <button onClick={() => handleDeleteItem(note.id, 'note')} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>

              {folders.map(folder => (
                <div key={folder.id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', background: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#111827' }}>📁 {folder.name}</span>
                    <button onClick={() => handleDeleteItem(folder.id, 'folder')} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                  <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {notes.filter(n => n.folder_id === folder.id).map(note => (
                      <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4b5563' }}>
                        <span>📄 {note.name} ({note.courseCode})</span>
                        <button onClick={() => handleDeleteItem(note.id, 'note')} style={{ color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: PENDING NOTE APPROVALS */}
        {activeTab === 'approvals' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' }}>
                  <th style={{ padding: '12px' }}>Note Name</th>
                  <th style={{ padding: '12px' }}>Course</th>
                  <th style={{ padding: '12px' }}>Size</th>
                  <th style={{ padding: '12px' }}>Uploaded By</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingNotes.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No lecture notes pending approval.</td>
                  </tr>
                ) : (
                  pendingNotes.map(pn => (
                    <tr key={pn.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{pn.name}</td>
                      <td style={{ padding: '12px' }}>{pn.course_code}</td>
                      <td style={{ padding: '12px' }}>{pn.file_size}</td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>@{pn.uploader || 'Student'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleApproveNote(pn.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Approve</button>
                        <button onClick={() => handleDeleteItem(pn.id, 'note')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Reject</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT: PENDING PROFILE APPROVALS */}
        {activeTab === 'profile-approvals' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' }}>
                  <th style={{ padding: '12px' }}>Student</th>
                  <th style={{ padding: '12px' }}>Active Info</th>
                  <th style={{ padding: '12px' }}>Requested Updates</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profileRequests.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No profile update requests pending approval.</td>
                  </tr>
                ) : (
                  profileRequests.map(pr => (
                    <tr key={pr.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '13px' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: 'bold', display: 'block' }}>@{pr.username}</span>
                        <span style={{ color: '#6b7280', fontSize: '11px' }}>ID: {pr.id}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>
                        <div>Name: {pr.name}</div>
                        <div>Email: {pr.email}</div>
                        <div>CGPA: {pr.cgpa ? parseFloat(pr.cgpa).toFixed(2) : 'N/A'}</div>
                        <div>Dept: {pr.department || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#111827' }}>
                        <div style={{ fontWeight: pr.pending_name ? 'bold' : 'normal', color: pr.pending_name ? '#4f46e5' : 'inherit' }}>Name: {pr.pending_name || pr.name}</div>
                        <div style={{ fontWeight: pr.pending_email ? 'bold' : 'normal', color: pr.pending_email ? '#4f46e5' : 'inherit' }}>Email: {pr.pending_email || pr.email}</div>
                        <div style={{ fontWeight: pr.pending_cgpa !== null ? 'bold' : 'normal', color: pr.pending_cgpa !== null ? '#059669' : 'inherit' }}>CGPA: {pr.pending_cgpa !== null ? parseFloat(pr.pending_cgpa).toFixed(2) : (pr.cgpa ? parseFloat(pr.cgpa).toFixed(2) : 'N/A')}</div>
                        <div style={{ fontWeight: pr.pending_department ? 'bold' : 'normal', color: pr.pending_department ? '#059669' : 'inherit' }}>Dept: {pr.pending_department || pr.department || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleApproveProfile(pr.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Approve</button>
                          <button onClick={() => handleRejectProfile(pr.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT: QUESTION BANK */}
        {activeTab === 'questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', color: '#374151' }}>Register New Exam Question Paper</h3>
              <form onSubmit={handleUploadQuestion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Course Title</label>
                  <input type="text" placeholder="e.g., Compiler Design" value={questionForm.courseName} onChange={(e) => setQuestionForm(prev => ({...prev, courseName: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Course Code</label>
                  <input type="text" placeholder="e.g., CSE 4111" value={questionForm.courseCode} onChange={(e) => setQuestionForm(prev => ({...prev, courseCode: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Term Scope</label>
                  <select value={questionForm.termType} onChange={(e) => setQuestionForm(prev => ({...prev, termType: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                    <option value="Mid">Mid Term</option>
                    <option value="Final">Final Term</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Academic Year</label>
                  <input type="text" placeholder="e.g., 2026" value={questionForm.academicYear} onChange={(e) => setQuestionForm(prev => ({...prev, academicYear: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>File Attachment</label>
                  <input type="file" onChange={e => setQuestionFile(e.target.files[0])} style={{ fontSize: '12px' }} />
                </div>
                <button type="submit" style={{ background: '#5e5adb', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Add Paper</button>
              </form>
            </div>

            {/* List Array Render */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' }}>
                    <th style={{ padding: '12px' }}>Course Details</th>
                    <th style={{ padding: '12px' }}>Term</th>
                    <th style={{ padding: '12px' }}>Year</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map(q => (
                    <tr key={q.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#111827' }}>
                      <td style={{ padding: '12px' }}><span style={{ fontWeight: '600' }}>{q.courseCode}</span> - {q.courseName}</td>
                      <td style={{ padding: '12px' }}>{q.termType}</td>
                      <td style={{ padding: '12px' }}>{q.academicYear}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteItem(q.id, 'question')} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENT: SCHOLARS */}
        {activeTab === 'scholars' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', color: '#374151' }}>Log Scholar Metric</h3>
              <form onSubmit={handleAddScholar} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Student Full Name</label>
                  <input type="text" placeholder="e.g., Sadia Islam" value={scholarForm.name} onChange={(e) => setScholarForm(prev => ({...prev, name: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>CGPA (0.00 - 4.00)</label>
                  <input type="number" step="0.01" min="0" max="4" placeholder="4.00" value={scholarForm.cgpa} onChange={(e) => setScholarForm(prev => ({...prev, cgpa: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Rank Position</label>
                  <input type="number" placeholder="1" value={scholarForm.rankPosition} onChange={(e) => setScholarForm(prev => ({...prev, rankPosition: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Department</label>
                  <input type="text" placeholder="e.g., EEE" value={scholarForm.department} onChange={(e) => setScholarForm(prev => ({...prev, department: e.target.value}))} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ background: '#5e5adb', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save Leaderboard</button>
              </form>
            </div>

            {/* Render Leaderboard Table */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' }}>
                    <th style={{ padding: '12px' }}>Rank</th>
                    <th style={{ padding: '12px' }}>Scholar Name</th>
                    <th style={{ padding: '12px' }}>Department</th>
                    <th style={{ padding: '12px' }}>CGPA Metric</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scholars.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#111827' }}>
                      <td style={{ padding: '12px' }}><span style={{ background: '#dedaff', color: '#5e5adb', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>#{s.rankPosition}</span></td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{s.name}</td>
                      <td style={{ padding: '12px' }}>{s.department}</td>
                      <td style={{ padding: '12px', color: '#059669', fontWeight: 'bold' }}>{parseFloat(s.cgpa).toFixed(2)} / 4.00</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteItem(s.id, 'scholar')} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENT: SYSTEM USERS */}
        {activeTab === 'users' && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Full Name</th>
                  <th style={{ padding: '12px' }}>Username</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No registered student accounts.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                      <td style={{ padding: '12px' }}>{u.id}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.name}</td>
                      <td style={{ padding: '12px' }}>{u.username}</td>
                      <td style={{ padding: '12px' }}>{u.email}</td>
                      <td style={{ padding: '12px' }}><span style={{ textTransform: 'capitalize', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{u.role}</span></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteItem(u.id, 'user')} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT: FEEDBACKS */}
        {activeTab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {feedbacks.length === 0 ? (
              <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#9ca3af' }}>No feedbacks left yet.</div>
            ) : (
              feedbacks.map(f => (
                <div key={f.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#111827' }}>👤 {f.user_name}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(f.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, color: '#374151', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{f.message}</p>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}