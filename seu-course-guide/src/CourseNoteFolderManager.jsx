import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, Plus, Trash2, FileText, Upload } from 'lucide-react';

export default function CourseNoteFolderManager({ token, role }) {
  const [folders, setFolders] = useState({
    'root': { id: 'root', name: 'SEU Repository Core', type: 'folder', parent: null, children: [] }
  });
  const [currentFolder, setCurrentFolder] = useState('root');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState(['root']);
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseCode, setCourseCode] = useState('');

  useEffect(() => {
    // Database Core Hydration Call
    const fetchDirectoryStructure = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/folders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const systemMap = await res.json();
          setFolders(systemMap);
        }
      } catch (err) { console.error('Schema parsing failure:', err); }
    };
    fetchDirectoryStructure();
  }, [token]);

  const contents = folders[currentFolder]?.children?.map(id => folders[id]).filter(Boolean) || [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newFolderName, parentId: currentFolder })
      });
      if (res.ok) {
        const addedFolder = await res.json();
        setFolders(prev => ({
          ...prev,
          [addedFolder.id]: addedFolder,
          [currentFolder]: { ...prev[currentFolder], children: [...prev[currentFolder].children, addedFolder.id] }
        }));
        setNewFolderName('');
        setShowNewFolderInput(false);
      }
    } catch (err) { alert('Folder synchronization transaction dropped'); }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !courseCode) return;

    const serverPayload = new FormData();
    serverPayload.append('document', selectedFile);
    serverPayload.append('courseCode', courseCode);
    serverPayload.append('folderId', currentFolder);

    try {
      const res = await fetch('http://localhost:5000/api/notes/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: serverPayload
      });
      if (res.ok) {
        const trackingNode = await res.json();
        setFolders(prev => ({
          ...prev,
          [trackingNode.id]: trackingNode,
          [currentFolder]: { ...prev[currentFolder], children: [...prev[currentFolder].children, trackingNode.id] }
        }));
        setSelectedFile(null);
        setCourseCode('');
      }
    } catch (err) { alert('Blob upload transaction faulted'); }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/entities/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFolders(prev => {
          const updated = { ...prev };
          const entity = updated[itemId];
          if (!entity) return prev;
          if (updated[entity.parent]) {
            updated[entity.parent].children = updated[entity.parent].children.filter(id => id !== itemId);
          }
          delete updated[itemId];
          return updated;
        });
      }
    } catch (err) { alert('Deletion instruction rejected by storage controller'); }
  };

  return (
    <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #E2E8F0', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Responsive Breadcrumb Pipeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', fontSize: '13px', flexWrap: 'wrap' }}>
        {breadcrumb.map((id, idx) => (
          <React.Fragment key={id}>
            {idx > 0 && <ChevronRight size={14} color="#A3AED0" />}
            <span onClick={() => { setCurrentFolder(id); setBreadcrumb(breadcrumb.slice(0, idx + 1)); }} style={{ cursor: 'pointer', color: currentFolder === id ? '#1B2559' : '#6366f1', fontWeight: currentFolder === id ? '700' : '500' }}>
              {folders[id]?.name === 'SEU Repository Core' ? 'Home Root' : folders[id]?.name}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Directory Modification Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1B2559', fontSize: '20px', fontWeight: '800' }}>{folders[currentFolder]?.name}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#A3AED0' }}>{contents.length} structural elements tracking active state</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowNewFolderInput(true)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px' }}>
            <Plus size={16} /> New Folder
          </button>
        </div>
      </div>

      {/* Dynamic Native Multi-part Data Upload Area */}
      <form onSubmit={handleFileUpload} style={{ background: '#F4F7FE', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="file" required onChange={e => setSelectedFile(e.target.files[0])} style={{ fontSize: '13px' }} />
        <input type="text" required placeholder="Course Key (e.g. CSE221)" value={courseCode} onChange={e => setCourseCode(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }} />
        <button type="submit" style={{ background: '#001571', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Upload size={14} /> Pipeline Binary Data
        </button>
      </form>

      {showNewFolderInput && (
        <div style={{ display: 'flex', gap: '10px', background: '#F4F7FE', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input placeholder="Directory node title" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
          <button onClick={handleCreateFolder} style={{ background: '#001571', color: 'white', border: 'none', padding: '0 20px', height: '42px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Commit</button>
          <button onClick={() => setShowNewFolderInput(false)} style={{ background: '#E2E8F0', border: 'none', padding: '0 15px', height: '42px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* Storage Node Visual Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {contents.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#A3AED0', fontSize: '14px', margin: 0 }}>This sub-directory layer returns no items.</p>
        ) : (
          contents.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', alignItems: 'center', gap: '1rem' }}>
              <div onClick={() => item.type === 'folder' && (setCurrentFolder(item.id) || setBreadcrumb([...breadcrumb, item.id]))} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: item.type === 'folder' ? 'pointer' : 'default', flex: 1, minWidth: 0 }}>
                {item.type === 'folder' ? <Folder color="#6366f1" size={20} /> : <FileText color="#A3AED0" size={20} />}
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: '#1B2559', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  {item.size && <span style={{ fontSize: '11px', color: '#A3AED0' }}>Allocation footprint: {item.size}</span>}
                </div>
              </div>
              <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}