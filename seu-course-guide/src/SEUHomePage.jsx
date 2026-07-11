import React, { useState } from 'react';
import { ArrowRight, Send } from 'lucide-react';
import logoImage from './assets/logo.png';
import modelImage from './assets/modelHome.png';

export default function SEUHomePage({ onLogin }) {
  // Default to false so the "Sign Up" view matches your reference image exactly
  const [isLoginMode, setIsLoginMode] = useState(false); 
  const [formData, setFormData] = useState({
    name: '', username: '', email: '', password: '', confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Fallback strategy using localhost to catch both IPv4/IPv6 resolving interfaces
    const endpoint = isLoginMode 
      ? 'http://localhost:5000/api/auth/login' 
      : 'http://localhost:5000/api/auth/register';

    // Client-side validation check for password matching on Sign Up
    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Authentication failed');
        return;
      }

      alert(isLoginMode ? 'Login Successful!' : 'Registration Successful!');
      
      // Pass the payload (role, token, user info) returned from the database to App.js
      onLogin(data); 

    } catch (error) {
      console.error('Server connection error:', error);
      alert('Cannot connect to the server. Make sure your backend node process is running.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'sans-serif' }}>
      {/* Navigation Bar */}
      <nav style={{ padding: '1.5rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '20px' }}>
          <img src={logoImage} alt="Logo" style={{ width: '40px' }} />
          <span style={{ color: '#001571' }}>SEU <span style={{ color: '#5e5adb' }}>Course Guide</span></span>
        </div>
        
        <div style={{ display: 'flex', gap: '2.5rem', color: '#444', fontSize: '15px', fontWeight: 'bold' }}>
          <span style={{ cursor: 'pointer' }}>Features</span>
          <span style={{ cursor: 'pointer' }}>Courses</span>
          <span style={{ cursor: 'pointer' }}>Top Scholars</span>
          <span style={{ cursor: 'pointer' }}>About Us</span>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={(e) => { e.preventDefault(); setIsLoginMode(true); }} 
            style={{ display: 'inline-block', background: isLoginMode ? '#5e5adb' : '#b2aeff', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
          >
            Log In
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); setIsLoginMode(false); }} 
            style={{ display: 'inline-block', background: !isLoginMode ? '#5e5adb' : '#b2aeff', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Content Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: '20px', padding: '2rem 4rem', alignItems: 'center' }}>
        
        {/* Left Copywriting Block */}
        <div>
          <div style={{ background: '#dbeafe', color: '#6366f1', padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-block', marginBottom: '25px', boxShadow: '0 2px 10px rgba(99, 102, 241, 0.15)' }}>
            Learning platform for Students
          </div>
          <h1 style={{ fontSize: '56px', margin: '0', color: '#000', fontWeight: '500' }}>Learn <span style={{ color: '#a78bfa' }}>Smarter.</span></h1>
          <h1 style={{ fontSize: '56px', margin: '0 0 25px 0', color: '#000', fontWeight: '500' }}>Achieve <span style={{ color: '#5e5adb' }}>Greater.</span></h1>
          <p style={{ color: '#999', lineHeight: '1.6', marginBottom: '35px', fontSize: '16px', maxWidth: '380px' }}>
            Access High-Quality course note, practice questions, learn form toppers and track your progress - all in one place
          </p>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={() => setIsLoginMode(false)} style={{ border: 'none', background: '#5e5adb', color: 'white', padding: '14px 28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              Get Started Free <ArrowRight size={18} />
            </button>
            <button style={{ background: '#fff', color: '#000', border: '1px solid #000', padding: '14px 28px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              Explore Features 📋
            </button>
          </div>
        </div>

        {/* Center Graphic Asset Box */}
        <div style={{ textAlign: 'center' }}>
          <img src={modelImage} alt="Vector Illustration" style={{ width: '100%', maxWidth: '460px' }} />
        </div>

        {/* Right Form Card Block */}
        <div style={{ background: '#fff', padding: '2rem 1.8rem', borderRadius: '12px', border: '1px solid #ccc', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
            {isLoginMode ? 'Welcome Back!' : 'Join SEU Course Guide Today'}
          </h3>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 20px 0' }}>
            {isLoginMode 
              ? 'Enter your credentials to access your dashboard' 
              : 'Create your account and start learning'
            }
          </p>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {!isLoginMode && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>Name</label>
                <input name="name" value={formData.name} style={{ width: '100%', padding: '11px', border: '1px solid #aaa', borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }} placeholder="Enter your name" onChange={handleInputChange} />
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>Username/Student Code</label>
              <input name="username" value={formData.username} required style={{ width: '100%', padding: '11px', border: '1px solid #aaa', borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }} placeholder="Enter your username" onChange={handleInputChange} />
            </div>

            {!isLoginMode && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>Email</label>
                <input name="email" type="email" value={formData.email} style={{ width: '100%', padding: '11px', border: '1px solid #aaa', borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }} placeholder="Enter your email" onChange={handleInputChange} />
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>Password</label>
              <input name="password" type="password" value={formData.password} required style={{ width: '100%', padding: '11px', border: '1px solid #aaa', borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }} placeholder="Enter your password" onChange={handleInputChange} />
            </div>

            {!isLoginMode && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#333' }}>Confirm Password</label>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} style={{ width: '100%', padding: '11px', border: '1px solid #aaa', borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }} placeholder="Re-enter your password" onChange={handleInputChange} />
              </div>
            )}

            <button type="submit" style={{ background: '#4c2cd9', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', marginTop: '8px', cursor: 'pointer' }}>
              {isLoginMode ? 'Log In' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>

      {/* CTA Conversion Ribbon */}
      <div style={{ padding: '2rem 4rem' }}>
        <div style={{ background: '#dedaff', padding: '1.8rem 3.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(94, 90, 219, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ background: '#fff', padding: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
              <Send size={24} color="#5e5adb" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '20px', color: '#000', fontWeight: 'bold' }}>Ready to start your learning journey?</h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#555' }}>Thousands of students who are learning, growing and achieving everyday</p>
            </div>
          </div>
          
          <button onClick={() => setIsLoginMode(false)} style={{ border: 'none', textDecoration: 'none', background: '#5e5adb', color: 'white', padding: '14px 32px', borderRadius: '8px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px' }}>
            Join Now - Free! <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Global Footer Grid */}
      <footer style={{ background: '#fff', padding: '4rem 4rem 2rem 4rem', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '4rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '18px', marginBottom: '1.5rem' }}>
              <img src={logoImage} alt="Logo" style={{ width: '32px' }} />
              <span style={{ color: '#001571' }}>SEU <span style={{ color: '#5e5adb' }}>Course Guide</span></span>
            </div>
            <p style={{ color: '#444', fontSize: '13px', lineHeight: '1.6', maxWidth: '280px' }}>
              Empowering Students With The Best Learning Resources, Expert Guidance And Smart Tools To Achieve Greatness
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '15px', color: '#000' }}>Features</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#444' }}>
              <span>Course Notes</span><span>Question Bank</span><span>Top Scholars</span><span>Course Tips</span>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '15px', color: '#000' }}>Resources</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#444' }}>
              <span>Blog</span><span>Study Guides</span><span>Help Centre</span><span>Community</span>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '15px', color: '#000' }}>Get In Touch</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#444' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📧 seucourseguide2026@gmail.com</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📞 +8801674316811</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📍 Southeast University, Tejgaon</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555' }}>
          <span>© 2026 SEU Course Guide. All Right Reserved.</span>
          <span>Made With ❤️ For Students By Team Three Bits</span>
        </div>
      </footer>
    </div>
  );
}