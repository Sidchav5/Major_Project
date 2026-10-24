// src/pages/Reports.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Sparkles,
  FileArchive,
  RefreshCw,
  Loader2
} from 'lucide-react';
import api from '../utils/api';
import './Reports.css';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/sessions?limit=50');
      if (res.ok) {
        const data = await res.json();
        const formatted = (data.sessions || []).map((s) => {
          const started = s.started_at ? new Date(s.started_at) : new Date();
          const dateStr = started.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const mins = Math.max(1, Math.round((s.duration_sec || 0) / 60));
          const statusRaw = (s.final_stats?.status || s.status || 'SAFE').toUpperCase();
          
          let score = 94;
          let uiStatus = 'excellent';
          if (statusRaw === 'WARNING') {
            score = 75;
            uiStatus = 'fair';
          } else if (statusRaw === 'DANGER') {
            score = 55;
            uiStatus = 'poor';
          }

          return {
            id: s.id,
            name: `Ergonomic_Report_${s.id.slice(-6)}.pdf`,
            date: dateStr,
            rawDate: started,
            size: s.has_pdf ? '1.4 MB' : 'Telemetry',
            score: score,
            status: uiStatus,
            duration: `${mins} min${mins > 1 ? 's' : ''}`,
            sessions: 1,
            hasPdf: s.has_pdf,
            hasRecommendations: true,
            finalStats: s.final_stats || {},
          };
        });
        setReports(formatted);
      }
    } catch (err) {
      console.error('Failed to load reports from MongoDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      'excellent': { 
        label: 'Excellent', 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.1)',
        icon: CheckCircle,
        barColor: '#10b981'
      },
      'good': { 
        label: 'Good', 
        color: '#3b82f6', 
        bg: 'rgba(37, 99, 235, 0.1)',
        icon: CheckCircle,
        barColor: '#3b82f6'
      },
      'fair': { 
        label: 'Fair', 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.1)',
        icon: AlertCircle,
        barColor: '#f59e0b'
      },
      'poor': { 
        label: 'Needs Improvement', 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.1)',
        icon: AlertCircle,
        barColor: '#ef4444'
      },
    };
    return configs[status] || configs['good'];
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreBarWidth = (score) => {
    return Math.max(10, score);
  };

  const filteredReports = useMemo(() => {
    let result = [...reports];
    
    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(report => 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.date.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = (a.rawDate || 0) - (b.rawDate || 0);
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [reports, searchTerm, sortBy, sortOrder, filterStatus]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDownload = (report) => {
    if (report.hasPdf) {
      window.open(api.downloadUrl(`/api/sessions/${report.id}/pdf`), '_blank');
    } else {
      window.open(api.downloadUrl('/api/download_pdf'), '_blank');
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this session and its report?')) {
      try {
        const res = await api.delete(`/api/sessions/${reportId}`);
        if (res.ok) {
          setReports((prev) => prev.filter((r) => r.id !== reportId));
        } else {
          alert('Failed to delete report.');
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const getStats = () => {
    const total = reports.length;
    if (total === 0) {
      return { total: 0, avgScore: 100, excellent: 0, needsWork: 0 };
    }
    const avgScore = Math.round(reports.reduce((sum, r) => sum + r.score, 0) / total);
    const excellent = reports.filter(r => r.status === 'excellent').length;
    const needsWork = reports.filter(r => r.status === 'poor' || r.status === 'fair').length;
    return { total, avgScore, excellent, needsWork };
  };

  const stats = getStats();

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div className="header-left">
          <div className="header-badge">
            <Sparkles className="badge-icon" />
            <span>AI-Generated Reports & History</span>
          </div>
          <h1 className="page-title">Personalized Reports</h1>
          <p className="page-subtitle">
            Access your real session logs, AI-generated ergonomic insights, and downloadable PDF reports
          </p>
        </div>
        <div className="header-right">
          <button className="header-action-btn primary" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={`action-icon ${isLoading ? 'spinning' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <FileText className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <BarChart3 className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.avgScore}%</span>
            <span className="stat-label">Average Score</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper success">
            <CheckCircle className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.excellent}</span>
            <span className="stat-label">Optimal Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper warning">
            <AlertCircle className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.needsWork}</span>
            <span className="stat-label">Needs Improvement</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="reports-toolbar">
        <div className="toolbar-left">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="search-clear"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FileText className="view-icon" />
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <PieChart className="view-icon" />
            </button>
          </div>
        </div>
        <div className="toolbar-right">
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Sessions</option>
              <option value="excellent">Optimal (Safe)</option>
              <option value="fair">Fair (Warning)</option>
              <option value="poor">Needs Improvement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#60a5fa' }}>
          <Loader2 className="spinning" size={36} style={{ margin: '0 auto 16px' }} />
          <p>Loading your sessions from MongoDB Atlas...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="reports-list">
          <div className="reports-table-header">
            <div className="header-cell name" onClick={() => handleSort('name')}>
              <span>Session / Report</span>
              <ArrowUpDown className="sort-icon" />
            </div>
            <div className="header-cell date" onClick={() => handleSort('date')}>
              <span>Date</span>
              <ArrowUpDown className="sort-icon" />
            </div>
            <div className="header-cell score" onClick={() => handleSort('score')}>
              <span>Posture Score</span>
              <ArrowUpDown className="sort-icon" />
            </div>
            <div className="header-cell status">Status</div>
            <div className="header-cell actions">Actions</div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-icon" />
              <h3 className="empty-title">No sessions recorded yet</h3>
              <p className="empty-description">
                Start a monitoring session from the Live Monitor page to automatically record telemetry and generate your first AI report.
              </p>
            </div>
          ) : (
            filteredReports.map((report, index) => {
              const statusConfig = getStatusConfig(report.status);
              const StatusIcon = statusConfig.icon;
              const scoreColor = getScoreColor(report.score);
              const barWidth = getScoreBarWidth(report.score);
              
              return (
                <div 
                  key={report.id} 
                  className="report-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="report-item-content">
                    <div className="report-info">
                      <div className="report-icon-wrapper">
                        <FileText className="report-icon" />
                      </div>
                      <div className="report-details">
                        <div className="report-name-wrapper">
                          <span className="report-name">{report.name}</span>
                          {report.hasPdf && (
                            <span className="recommendation-badge">
                              <Sparkles className="recommendation-icon" />
                              PDF in GridFS
                            </span>
                          )}
                        </div>
                        <div className="report-meta">
                          <span className="meta-item">
                            <Calendar className="meta-icon" />
                            {report.date}
                          </span>
                          <span className="meta-divider">•</span>
                          <span className="meta-item">
                            <Clock className="meta-icon" />
                            {report.duration}
                          </span>
                          <span className="meta-divider">•</span>
                          <span className="meta-item">{report.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="report-score">
                      <div className="score-bar-wrapper">
                        <div 
                          className="score-bar"
                          style={{ 
                            width: `${barWidth}%`,
                            backgroundColor: scoreColor
                          }}
                        />
                      </div>
                      <span className="score-value" style={{ color: scoreColor }}>
                        {report.score}%
                      </span>
                    </div>

                    <div className="report-status">
                      <span 
                        className="status-badge"
                        style={{ 
                          background: statusConfig.bg,
                          color: statusConfig.color
                        }}
                      >
                        <StatusIcon className="status-icon" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="report-actions">
                      <button 
                        className="action-btn download"
                        title="Download PDF"
                        onClick={() => handleDownload(report)}
                      >
                        <Download className="action-icon" />
                      </button>
                      <button 
                        className="action-btn delete"
                        title="Delete Session"
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 className="action-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="reports-grid-view">
          {filteredReports.map((report) => {
            const statusConfig = getStatusConfig(report.status);
            const StatusIcon = statusConfig.icon;
            const scoreColor = getScoreColor(report.score);
            
            return (
              <div key={report.id} className="report-grid-card">
                <div className="grid-card-header">
                  <div className="grid-card-icon">
                    <FileText className="grid-icon" />
                  </div>
                  <div className="grid-card-badge" style={{ 
                    background: statusConfig.bg,
                    color: statusConfig.color
                  }}>
                    <StatusIcon className="grid-badge-icon" />
                    {statusConfig.label}
                  </div>
                </div>
                <h4 className="grid-card-name">{report.name}</h4>
                <div className="grid-card-meta">
                  <span className="grid-meta-item">
                    <Calendar className="grid-meta-icon" />
                    {report.date}
                  </span>
                  <span className="grid-meta-item">{report.duration}</span>
                </div>
                <div className="grid-card-score">
                  <div className="grid-score-wrapper">
                    <div 
                      className="grid-score-bar"
                      style={{ 
                        width: `${getScoreBarWidth(report.score)}%`,
                        backgroundColor: scoreColor
                      }}
                    />
                  </div>
                  <span className="grid-score-value" style={{ color: scoreColor }}>
                    {report.score}%
                  </span>
                </div>
                <div className="grid-card-actions">
                  <button className="grid-action-btn primary" onClick={() => handleDownload(report)}>
                    <Download className="grid-action-icon" />
                    Download
                  </button>
                  <button className="grid-action-btn" onClick={() => handleDelete(report.id)}>
                    <Trash2 className="grid-action-icon" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="reports-footer">
        <p>
          Sessions and AI reports are saved to your account in MongoDB Atlas.
          <span className="footer-highlight"> GridFS storage</span> keeps your high-fidelity PDF documents accessible anytime.
        </p>
      </div>
    </div>
  );
}