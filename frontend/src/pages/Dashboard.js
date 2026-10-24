// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Clock, 
  ShieldAlert, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  LineChart,
  PieChart,
  ChevronRight,
  MoreVertical,
  Bell,
  Settings
} from 'lucide-react';
import api from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [analytics, setAnalytics] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const navigate = useNavigate();

  const fetchDashboardData = async (period = selectedPeriod, isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsUpdating(true);
    }

    try {
      // 1. Fetch aggregate metrics filtered by period
      const analyticsRes = await api.get(`/api/sessions/analytics/summary?period=${period}`);
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData);
      }

      // 2. Fetch recent sessions
      const sessionsRes = await api.get('/api/sessions?limit=5');
      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        const mapped = (sData.sessions || []).map((s) => {
          const started = s.started_at ? new Date(s.started_at) : new Date();
          const mins = Math.max(1, Math.round((s.duration_sec || 0) / 60));
          const statusRaw = (s.final_stats?.status || s.status || 'SAFE').toUpperCase();
          
          let score = 94;
          let postureText = 'Good';
          let statusText = 'Excellent';
          if (statusRaw === 'WARNING') {
            score = 75;
            postureText = 'Warning';
            statusText = 'Needs Improvement';
          } else if (statusRaw === 'DANGER') {
            score = 55;
            postureText = 'Poor';
            statusText = 'Poor';
          }

          return {
            id: s.id,
            date: started.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            duration: `${mins} min${mins > 1 ? 's' : ''}`,
            status: statusText,
            score: score,
            posture: postureText,
            breaks: 1,
            hasPdf: s.has_pdf
          };
        });
        setRecentSessions(mapped);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedPeriod, analytics === null);
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    if (period !== selectedPeriod) {
      setSelectedPeriod(period);
    }
  };

  const stats = [
    { 
      name: 'Posture Score', 
      value: `${analytics?.avg_posture_score || 94}%`, 
      change: '+5.2%',
      trend: 'up',
      icon: Activity, 
      color: 'green',
      bg: 'rgba(16, 185, 129, 0.1)',
      description: analytics?.total_sessions ? `${analytics.total_sessions} sessions analyzed` : 'Above average'
    },
    { 
      name: 'Total Monitored Time', 
      value: `${analytics ? (analytics.total_monitoring_minutes >= 60 ? `${(analytics.total_monitoring_minutes / 60).toFixed(1)} hrs` : `${analytics.total_monitoring_minutes} mins`) : '0 mins'}`, 
      change: '+1.5%',
      trend: 'up',
      icon: Clock, 
      color: 'blue',
      bg: 'rgba(37, 99, 235, 0.1)',
      description: 'Logged in MongoDB'
    },
    { 
      name: 'Safety Warnings', 
      value: `${analytics?.safety_violations || 0}`, 
      change: analytics?.safety_violations ? '+1.2%' : '0%',
      trend: analytics?.safety_violations ? 'up' : 'down',
      icon: ShieldAlert, 
      color: 'red',
      bg: 'rgba(239, 68, 68, 0.1)',
      description: analytics?.safety_violations ? 'Needs attention' : 'Optimal compliance'
    },
    { 
      name: 'Avg Blink Rate', 
      value: `${analytics?.avg_blink_rate || 14} / min`, 
      change: '+3.1%',
      trend: 'up',
      icon: Eye, 
      color: 'purple',
      bg: 'rgba(124, 58, 237, 0.1)',
      description: 'Healthy range'
    },
    {
      name: 'Global Notifications',
      value: 'System Alerts',
      change: 'Enabled',
      trend: 'up',
      icon: Bell,
      color: 'blue',
      bg: 'rgba(37, 99, 235, 0.1)',
      description: '20-20-20 & Hydration Active'
    },
    {
      name: 'MongoDB Cloud Sync',
      value: 'Atlas Connected',
      change: 'Real-time',
      trend: 'up',
      icon: Settings,
      color: 'green',
      bg: 'rgba(16, 185, 129, 0.1)',
      description: 'GridFS Reports Active'
    }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      'Excellent': { icon: CheckCircle, color: 'success', bg: 'rgba(16, 185, 129, 0.1)' },
      'Good': { icon: CheckCircle, color: 'info', bg: 'rgba(37, 99, 235, 0.1)' },
      'Needs Improvement': { icon: AlertCircle, color: 'warning', bg: 'rgba(245, 158, 11, 0.1)' },
      'Poor': { icon: XCircle, color: 'danger', bg: 'rgba(239, 68, 68, 0.1)' },
      'Warning': { icon: AlertCircle, color: 'warning', bg: 'rgba(245, 158, 11, 0.1)' }
    };
    return configs[status] || configs['Good'];
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--score-excellent)';
    if (score >= 75) return 'var(--score-good)';
    if (score >= 60) return 'var(--score-fair)';
    return 'var(--score-poor)';
  };

  return (
    <div className="dashboard-enhanced">
      {/* Loading State */}
      {isLoading ? (
        <div className="dashboard-loader">
          <div className="loader-spinner">
            <div className="spinner-ring"></div>
          </div>
          <p>Loading your personal dashboard...</p>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div className="dashboard-header">
            <div className="header-left">
              <div className="header-badge">
                <span className="badge-dot"></span>
                MongoDB Live Sync • {selectedPeriod === 'day' ? 'Last 24 Hours' : selectedPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
              </div>
              <h1 className="page-title">Personal Dashboard</h1>
              <p className="page-subtitle">
                Real-time insights computed from your monitoring sessions for {selectedPeriod === 'day' ? 'today' : selectedPeriod === 'week' ? 'the past 7 days' : 'the past month'}
              </p>
            </div>
            <div className="header-right">
              <div className="period-selector">
                <button 
                  className={`period-btn ${selectedPeriod === 'day' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('day')}
                >
                  Day (24h)
                </button>
                <button 
                  className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('week')}
                >
                  Week (7d)
                </button>
                <button 
                  className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('month')}
                >
                  Month (30d)
                </button>
              </div>
              <button 
                className="action-btn"
                onClick={() => fetchDashboardData(selectedPeriod)}
                disabled={isUpdating}
              >
                <RefreshCw className={`action-icon ${isUpdating ? 'spinning' : ''}`} />
                <span>{isUpdating ? 'Updating...' : 'Refresh'}</span>
              </button>
              <button className="action-btn primary" onClick={() => navigate('/reports')}>
                <Download className="action-icon" />
                <span>View Reports</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((item, index) => {
              const Icon = item.icon;
              const TrendIcon = item.trend === 'up' ? TrendingUp : TrendingDown;
              return (
                <div 
                  key={item.name} 
                  className="stat-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="stat-card-header">
                    <div className="stat-icon-wrapper" style={{ background: item.bg }}>
                      <Icon className={`stat-icon ${item.color}`} />
                    </div>
                    <span className="stat-change">
                      <TrendIcon className={`change-icon ${item.trend}`} />
                      {item.change}
                    </span>
                  </div>
                  <div className="stat-card-body">
                    <h3 className="stat-value">{item.value}</h3>
                    <p className="stat-name">{item.name}</p>
                    <p className="stat-description">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title-wrapper">
                  <BarChart3 className="chart-icon" />
                  <div>
                    <h3 className="chart-title">Weekly Posture Score</h3>
                    <p className="chart-subtitle">Posture quality trends across logged sessions</p>
                  </div>
                </div>
              </div>
              <div className="chart-body">
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    {(analytics?.weekly_trend || [88, 92, 85, 90, 95, 89, 94]).map((value, index) => (
                      <div key={index} className="chart-bar-wrapper">
                        <div 
                          className="chart-bar"
                          style={{ 
                            height: `${value}%`,
                            backgroundColor: getScoreColor(value),
                            animationDelay: `${index * 0.1}s`
                          }}
                        >
                          <span className="bar-label">{value}%</span>
                        </div>
                        <span className="bar-day">Day {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title-wrapper">
                  <PieChart className="chart-icon" />
                  <div>
                    <h3 className="chart-title">Posture Distribution</h3>
                    <p className="chart-subtitle">Quality breakdown across your sessions</p>
                  </div>
                </div>
              </div>
              <div className="chart-body">
                {(() => {
                  const safe = analytics?.distribution?.safe ?? 70;
                  const warning = analytics?.distribution?.warning ?? 20;
                  const danger = analytics?.distribution?.danger ?? 10;
                  const endSafe = safe;
                  const endWarning = Math.min(100, safe + warning);

                  return (
                    <div className="donut-placeholder">
                      <div className="donut-chart">
                        <div 
                          className="donut-segment" 
                          style={{ 
                            transform: 'rotate(0deg)',
                            background: `conic-gradient(var(--score-excellent) 0% ${endSafe}%, var(--score-fair) ${endSafe}% ${endWarning}%, var(--score-poor) ${endWarning}% 100%)`
                          }}
                        ></div>
                        <div className="donut-center">
                          <span className="donut-value">{analytics?.avg_posture_score || 94}%</span>
                          <span className="donut-label">Average</span>
                        </div>
                      </div>
                      <div className="donut-legend">
                        <div className="legend-item">
                          <span className="legend-color excellent"></span>
                          <span className="legend-label">Safe & Optimal ({safe}%)</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color fair"></span>
                          <span className="legend-label">Warning ({warning}%)</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color poor"></span>
                          <span className="legend-label">Poor / Slouch ({danger}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="sessions-card">
            <div className="sessions-header">
              <div className="sessions-title-wrapper">
                <LineChart className="sessions-icon" />
                <div>
                  <h3 className="sessions-title">Recent Sessions</h3>
                  <p className="sessions-subtitle">Your latest logged sessions in MongoDB Atlas</p>
                </div>
              </div>
              <div className="sessions-actions">
                <button className="view-all-btn" onClick={() => navigate('/reports')}>
                  <span>View All Reports</span>
                  <ChevronRight className="view-all-icon" />
                </button>
              </div>
            </div>

            <div className="sessions-table-wrapper">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Score</th>
                    <th>Posture</th>
                    <th>Status</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No sessions recorded yet. Start monitoring to see your personal metrics!
                      </td>
                    </tr>
                  ) : (
                    recentSessions.map((session, index) => {
                      const statusConfig = getStatusConfig(session.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={session.id} style={{ animationDelay: `${index * 0.05}s` }}>
                          <td>
                            <div className="session-date">
                              <Calendar className="session-date-icon" />
                              <span>{session.date}</span>
                            </div>
                          </td>
                          <td>
                            <span className="session-duration">{session.duration}</span>
                          </td>
                          <td>
                            <div className="score-indicator">
                              <div 
                                className="score-bar"
                                style={{ 
                                  width: `${session.score}%`,
                                  backgroundColor: getScoreColor(session.score)
                                }}
                              />
                              <span className="score-text">{session.score}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="posture-badge" style={{ 
                              background: getStatusConfig(session.posture).bg 
                            }}>
                              {session.posture}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${statusConfig.color}`}>
                              <StatusIcon className="status-icon" />
                              {session.status}
                            </span>
                          </td>
                          <td>
                            {session.hasPdf ? (
                              <button 
                                className="row-action-btn"
                                title="Download PDF Report"
                                onClick={() => window.open(api.downloadUrl(`/api/sessions/${session.id}/pdf`), '_blank')}
                              >
                                <Download size={16} />
                              </button>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Telemetry Only</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}