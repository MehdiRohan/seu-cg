const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1. ADVANCED CORS CONFIGURATION (Must be placed before endpoints)
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173', 
    'http://127.0.0.1:5173'  
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 2. BODY PARSING MIDDLEWARE
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Configure connection pool matching your seucg_db architecture
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Helper: Token Generator & Authentication Middleware
const generateToken = (user) => {
  return `session-token-${user.id}-${user.role}`;
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  
  try {
    const parts = token.split('-');
    if (parts[0] === 'session' && parts[1] === 'token') {
      const userId = parseInt(parts[2], 10);
      const userResult = await pool.query('SELECT id, name, username, email, role FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(403).json({ message: 'Invalid session token' });
      }
      req.user = userResult.rows[0];
      next();
    } else {
      return res.status(403).json({ message: 'Invalid token signature' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Auth middleware error' });
  }
};

// Database Initialization & Auto-Seeding
const initializeDatabase = async () => {
  try {
    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student'
      );
    `);

    // Alter Users table to add profile edit fields and CGPA/dept
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS cgpa DECIMAL(3,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_cgpa DECIMAL(3,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_department VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_status VARCHAR(50);
    `);

    // 2. Folders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id VARCHAR(100) REFERENCES folders(id) ON DELETE CASCADE
      );
    `);

    // Seed root folder if not exists
    await pool.query(`
      INSERT INTO folders (id, name, parent_id) 
      VALUES ('root', 'SEU Repository Core', NULL) 
      ON CONFLICT DO NOTHING;
    `);

    // 3. Notes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        course_code VARCHAR(100),
        file_path VARCHAR(255),
        file_size VARCHAR(100),
        folder_id VARCHAR(100) REFERENCES folders(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending'
      );
    `);

    // 4. Questions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(100) NOT NULL,
        term_type VARCHAR(50) DEFAULT 'Mid',
        academic_year VARCHAR(50) NOT NULL,
        file_path VARCHAR(255),
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // 5. Feedback Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_name VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Scholars Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scholars (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cgpa DECIMAL(3,2) NOT NULL,
        rank_position INTEGER NOT NULL,
        department VARCHAR(100) NOT NULL
      );
    `);

    // Seed superadmin
    const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['superadmin']);
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadminrohan', salt);
      await pool.query(
        'INSERT INTO users (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        ['Super Admin', 'superadmin', 'superadminrohan@seu.edu.bd', hashedPassword, 'admin']
      );
      console.log('Seeded superadmin successfully!');
    }
  } catch (err) {
    console.error('Database schema initialization failed:', err.message);
  }
};

// Test Database Connection and Initialize Schema
pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('PostgreSQL Connection Failure:', err.stack);
  } else {
    console.log('Successfully connected to seucg_db at:', res.rows[0].now);
    await initializeDatabase();
  }
});

// --- API ENDPOINTS ---

// 1. Auth Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    const userExist = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'Username or Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (name, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, email, role',
      [name, username, email, hashedPassword, 'student']
    );

    const user = newUser.rows[0];
    const token = generateToken(user);
    res.status(201).json({ role: user.role, token, user, message: 'Registration successful' });
  } catch (err) {
    console.error('Registration processing error:', err.message);
    res.status(500).json({ message: 'Server registration error' });
  }
});

// 2. Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Username' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    const token = generateToken(user);
    res.json({
      role: user.role,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: 'Login verification passed'
    });
  } catch (err) {
    console.error('Login processing error:', err.message);
    res.status(500).json({ message: 'Server login validation error' });
  }
});

// 3. Folders - GET Structure Map
app.get('/api/folders', authenticateToken, async (req, res) => {
  try {
    const foldersResult = await pool.query('SELECT * FROM folders');
    
    // Notes visibility logic: admin sees everything; students see approved ones plus their own pending notes
    let notesQuery = 'SELECT * FROM notes WHERE status = $1';
    let queryParams = ['approved'];
    if (req.user.role === 'admin') {
      notesQuery = 'SELECT * FROM notes';
      queryParams = [];
    } else {
      notesQuery = 'SELECT * FROM notes WHERE status = $1 OR uploaded_by = $2';
      queryParams = ['approved', req.user.id];
    }
    const notesResult = await pool.query(notesQuery, queryParams);

    // Build hierarchical flat map matching frontend representation
    const systemMap = {
      'root': { id: 'root', name: 'SEU Repository Core', type: 'folder', parent: null, children: [] }
    };

    foldersResult.rows.forEach(folder => {
      if (folder.id === 'root') return;
      systemMap[folder.id] = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parent: folder.parent_id || 'root',
        children: []
      };
    });

    // Link folders to parents
    Object.values(systemMap).forEach(node => {
      if (node.parent && systemMap[node.parent]) {
        systemMap[node.parent].children.push(node.id);
      }
    });

    // Link files/notes
    notesResult.rows.forEach(note => {
      const noteId = `n_${note.id}`;
      systemMap[noteId] = {
        id: noteId,
        name: note.name + (note.status === 'pending' ? ' (Pending Approval)' : ''),
        type: 'file',
        parent: note.folder_id || 'root',
        size: note.file_size || '1.0 MB',
        courseCode: note.course_code,
        filePath: note.file_path,
        status: note.status,
        uploaded_by: note.uploaded_by
      };
      
      const parentId = note.folder_id || 'root';
      if (systemMap[parentId]) {
        systemMap[parentId].children.push(noteId);
      }
    });

    res.json(systemMap);
  } catch (err) {
    console.error('Folders sync error:', err.message);
    res.status(500).json({ message: 'Internal server error fetching folders' });
  }
});

// 4. Folders - Create Folder
app.post('/api/folders', authenticateToken, async (req, res) => {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ message: 'Folder name is required' });
  
  const id = `f_${Date.now()}`;
  const parent = parentId === 'root' ? null : parentId;
  
  try {
    await pool.query(
      'INSERT INTO folders (id, name, parent_id) VALUES ($1, $2, $3)',
      [id, name, parent]
    );
    res.status(201).json({
      id,
      name,
      type: 'folder',
      parent: parentId,
      children: []
    });
  } catch (err) {
    console.error('Folder creation error:', err.message);
    res.status(500).json({ message: 'Internal server folder creation error' });
  }
});

// 5. Notes - Upload Class Notes
app.post('/api/notes/upload', authenticateToken, upload.single('document'), async (req, res) => {
  const { courseCode, folderId } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const name = file.originalname;
  const filePath = `/uploads/${file.filename}`;
  const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  const folder = folderId === 'root' ? null : folderId;
  
  // Admins' uploads are auto-approved; students' uploads require approval
  const status = req.user.role === 'admin' ? 'approved' : 'pending';

  try {
    const result = await pool.query(
      'INSERT INTO notes (name, course_code, file_path, file_size, folder_id, uploaded_by, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [name, courseCode, filePath, fileSize, folder, req.user.id, status]
    );
    const newId = result.rows[0].id;

    res.status(201).json({
      id: `n_${newId}`,
      name: name + (status === 'pending' ? ' (Pending Approval)' : ''),
      type: 'file',
      parent: folderId,
      size: fileSize,
      courseCode,
      filePath,
      status
    });
  } catch (err) {
    console.error('Note upload error:', err.message);
    res.status(500).json({ message: 'Internal server note upload error' });
  }
});

// 6. Delete entity (folder or note)
app.delete('/api/entities/:id', authenticateToken, async (req, res) => {
  const entityId = req.params.id;
  try {
    if (entityId.startsWith('f_')) {
      // Delete folder
      await pool.query('DELETE FROM folders WHERE id = $1', [entityId]);
      res.json({ message: 'Folder deleted successfully' });
    } else if (entityId.startsWith('n_')) {
      // Delete note
      const numericId = parseInt(entityId.split('_')[1], 10);
      await pool.query('DELETE FROM notes WHERE id = $1', [numericId]);
      res.json({ message: 'Note deleted successfully' });
    } else {
      res.status(400).json({ message: 'Invalid entity ID' });
    }
  } catch (err) {
    console.error('Deletion error:', err.message);
    res.status(500).json({ message: 'Failed to delete entity' });
  }
});

// 7. GET Recent Notes (Approved ones)
app.get('/api/notes/recent', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, course_code, file_size, file_path FROM notes WHERE status = $1 ORDER BY id DESC LIMIT 5',
      ['approved']
    );
    res.json(result.rows.map(row => ({
      id: `n_${row.id}`,
      name: row.name,
      courseCode: row.course_code,
      fileSize: row.file_size,
      filePath: row.file_path
    })));
  } catch (err) {
    console.error('Error fetching recent notes:', err.message);
    res.status(500).json({ message: 'Failed to fetch recent notes' });
  }
});

// 8. Questions - GET all
app.get('/api/questions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions ORDER BY id DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      courseName: row.course_name,
      courseCode: row.course_code,
      termType: row.term_type,
      academicYear: row.academic_year,
      filePath: row.file_path
    })));
  } catch (err) {
    console.error('Error fetching questions:', err.message);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// 9. Questions - POST
app.post('/api/questions', authenticateToken, upload.single('document'), async (req, res) => {
  const { courseName, courseCode, termType, academicYear } = req.body;
  const file = req.file;
  const filePath = file ? `/uploads/${file.filename}` : '#';

  try {
    const result = await pool.query(
      'INSERT INTO questions (course_name, course_code, term_type, academic_year, file_path, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [courseName, courseCode, termType, academicYear, filePath, req.user.id]
    );
    res.status(201).json({
      id: result.rows[0].id,
      courseName,
      courseCode,
      termType,
      academicYear,
      filePath
    });
  } catch (err) {
    console.error('Error saving question:', err.message);
    res.status(500).json({ message: 'Failed to save question' });
  }
});

// 10. Questions - DELETE
app.delete('/api/questions/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Error deleting question:', err.message);
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

// 11. Feedback - GET
app.get('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM feedback ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting feedback:', err.message);
    res.status(500).json({ message: 'Failed to get feedback' });
  }
});

// 12. Feedback - POST
app.post('/api/feedback', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Feedback message is required' });
  try {
    const result = await pool.query(
      'INSERT INTO feedback (user_id, user_name, message) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, req.user.name || req.user.username, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error posting feedback:', err.message);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// 13. Admin - GET Users list
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const result = await pool.query('SELECT id, name, username, email, role FROM users WHERE username != $1 ORDER BY id DESC', ['superadmin']);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting users:', err.message);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// 14. Admin - DELETE User
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// 15. Admin - GET Pending notes
app.get('/api/admin/notes/pending', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const result = await pool.query(
      'SELECT n.id, n.name, n.course_code, n.file_size, u.username as uploader FROM notes n LEFT JOIN users u ON n.uploaded_by = u.id WHERE n.status = $1 ORDER BY n.id DESC',
      ['pending']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error loading pending notes:', err.message);
    res.status(500).json({ message: 'Failed to load pending notes' });
  }
});

// 16. Admin - Approve note
app.put('/api/notes/:id/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const noteId = parseInt(req.params.id, 10);
  try {
    await pool.query('UPDATE notes SET status = $1 WHERE id = $2', ['approved', noteId]);
    res.json({ message: 'Note approved successfully' });
  } catch (err) {
    console.error('Error approving note:', err.message);
    res.status(500).json({ message: 'Failed to approve note' });
  }
});

// 17. Scholars - GET
app.get('/api/scholars', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scholars ORDER BY rank_position ASC');
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      cgpa: row.cgpa,
      rankPosition: row.rank_position,
      department: row.department
    })));
  } catch (err) {
    console.error('Error fetching scholars:', err.message);
    res.status(500).json({ message: 'Failed to fetch scholars' });
  }
});

// 18. Scholars - POST (Admin only)
app.post('/api/scholars', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { name, cgpa, rankPosition, department } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO scholars (name, cgpa, rank_position, department) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, cgpa, rankPosition, department]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding scholar:', err.message);
    res.status(500).json({ message: 'Failed to add scholar' });
  }
});

// 19. Scholars - DELETE (Admin only)
app.delete('/api/scholars/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await pool.query('DELETE FROM scholars WHERE id = $1', [req.params.id]);
    res.json({ message: 'Scholar deleted successfully' });
  } catch (err) {
    console.error('Error deleting scholar:', err.message);
    res.status(500).json({ message: 'Failed to delete scholar' });
  }
});

// 20. Profile Edit - POST update request
app.post('/api/user/profile/update', authenticateToken, async (req, res) => {
  const { name, email, cgpa, department } = req.body;
  try {
    await pool.query(
      `UPDATE users SET 
        pending_name = $1, 
        pending_email = $2, 
        pending_cgpa = $3, 
        pending_department = $4, 
        profile_status = $5 
       WHERE id = $6`,
      [name, email, cgpa ? parseFloat(cgpa) : null, department || null, 'pending', req.user.id]
    );
    res.json({ message: 'Profile update request submitted for admin approval' });
  } catch (err) {
    console.error('Profile edit submit error:', err.message);
    res.status(500).json({ message: 'Failed to submit profile update request' });
  }
});

// 21. Admin - GET pending profile update requests
app.get('/api/admin/profile-requests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const result = await pool.query(
      `SELECT id, name, username, email, cgpa, department, 
              pending_name, pending_email, pending_cgpa, pending_department 
       FROM users 
       WHERE profile_status = $1 
       ORDER BY id DESC`,
      ['pending']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting profile requests:', err.message);
    res.status(500).json({ message: 'Failed to get profile requests' });
  }
});

// 22. Admin - Approve profile update request
app.put('/api/admin/profile-requests/:id/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const userId = parseInt(req.params.id, 10);
  try {
    // 1. Fetch pending info
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = userRes.rows[0];
    
    // 2. Update user's active fields
    await pool.query(
      `UPDATE users SET 
        name = COALESCE(pending_name, name), 
        email = COALESCE(pending_email, email),
        cgpa = COALESCE(pending_cgpa, cgpa),
        department = COALESCE(pending_department, department),
        pending_name = NULL,
        pending_email = NULL,
        pending_cgpa = NULL,
        pending_department = NULL,
        profile_status = 'approved'
       WHERE id = $1`,
      [userId]
    );

    // 3. Upsert scholar record if CGPA exists
    const targetCgpa = user.pending_cgpa !== null ? user.pending_cgpa : user.cgpa;
    const targetDept = user.pending_department || user.department;
    const targetName = user.pending_name || user.name;
    
    if (targetCgpa !== null && targetCgpa !== undefined && targetDept) {
      // Check if scholar already exists
      const scholarCheck = await pool.query('SELECT * FROM scholars WHERE name = $1 AND department = $2', [targetName, targetDept]);
      if (scholarCheck.rows.length > 0) {
        await pool.query(
          'UPDATE scholars SET cgpa = $1 WHERE id = $2',
          [targetCgpa, scholarCheck.rows[0].id]
        );
      } else {
        await pool.query(
          'INSERT INTO scholars (name, cgpa, rank_position, department) VALUES ($1, $2, $3, $4)',
          [targetName, targetCgpa, 99, targetDept]
        );
      }

      // 4. Recalculate ranks automatically based on CGPA
      await pool.query(`
        UPDATE scholars SET rank_position = sub.rank
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY cgpa DESC) as rank 
          FROM scholars
        ) sub 
        WHERE scholars.id = sub.id
      `);
    }

    res.json({ message: 'Profile update approved successfully' });
  } catch (err) {
    console.error('Error approving profile:', err.message);
    res.status(500).json({ message: 'Failed to approve profile update' });
  }
});

// 23. Admin - Reject profile update request
app.put('/api/admin/profile-requests/:id/reject', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const userId = parseInt(req.params.id, 10);
  try {
    await pool.query(
      `UPDATE users SET 
        pending_name = NULL, 
        pending_email = NULL, 
        pending_cgpa = NULL, 
        pending_department = NULL, 
        profile_status = 'rejected' 
       WHERE id = $1`,
      [userId]
    );
    res.json({ message: 'Profile update rejected' });
  } catch (err) {
    console.error('Error rejecting profile:', err.message);
    res.status(500).json({ message: 'Failed to reject profile update' });
  }
});


// 3. FORCE NETWORK INTERFACE BINDING (0.0.0.0 listens to both localhost and 127.0.0.1)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend communication bridge active on port ${PORT}`);
});