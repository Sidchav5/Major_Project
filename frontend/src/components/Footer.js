// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Mail, 
  Phone 
} from 'lucide-react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-enhanced">
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>
      
      <div className="footer-content">
        <div className="footer-container">
          {/* Brand Section */}
          <div className="footer-brand-section">
            <Link to="/" className="footer-logo-wrapper" style={{ textDecoration: 'none' }} title="Go to Home">
              <div className="footer-logo-icon">
                <Activity className="footer-logo-svg" />
              </div>
              <div className="footer-logo-text">
                <span className="logo-main">AI Ergonomics</span>
                <span className="logo-sub">Monitor</span>
              </div>
            </Link>
            <p className="footer-brand-description">
              Smart posture monitoring powered by artificial intelligence.
              Stay healthy, work better.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-links-wrapper">
            <div className="footer-links-column">
              <h4>Quick Links</h4>
              <Link to="/">Home</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/live">Live Monitor</Link>
              <Link to="/reports">Reports</Link>
            </div>
            <div className="footer-links-column">
              <h4>Resources</h4>
              <Link to="/dashboard">Dashboard Overview</Link>
              <Link to="/live">Live Camera</Link>
              <Link to="/reports">Session History</Link>
              <Link to="/signup">Get Started</Link>
            </div>
            <div className="footer-links-column">
              <h4>Contact</h4>
              <a href="mailto:info@aiergonomics.com">
                <Mail size={16} className="contact-icon" /> info@aiergonomics.com
              </a>
              <a href="tel:+1234567890">
                <Phone size={16} className="contact-icon" /> +1 (234) 567-890
              </a>
              <div className="footer-social">
                <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                    <polygon points="10 15 15 12 10 9 10 15"></polygon>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <span>© {currentYear} AI Ergonomics Monitor</span>
              <span className="footer-divider">|</span>
              <span>All Rights Reserved</span>
            </div>
            <div className="footer-bottom-right">
              <Link to="/dashboard">Terms of Service</Link>
              <span className="footer-divider">|</span>
              <Link to="/dashboard">Privacy Policy</Link>
              <span className="footer-divider">|</span>
              <Link to="/dashboard">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;