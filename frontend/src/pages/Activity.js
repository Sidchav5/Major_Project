import React, { useEffect, useState } from 'react';
import { Activity as ActivityIcon, Clock, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import './ActivityAchievements.css';

export default function Activity() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await api.get('/api/sessions?limit=50');
        if (!response.ok) {
          setError('Unable to load session activity.');
          return;
        }
        const data = await response.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError('Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    loadActivity();
  }, []);

  return (
    <div className="activity-achievements-page">
      <div className="secondary-page-header">
        <div>
          <h1>Activity</h1>
          <p>Recent posture-monitoring sessions and their outcomes.</p>
        </div>
      </div>

      {loading && <div className="secondary-loading">Loading activity...</div>}
      {!loading && error && <div className="secondary-error">{error}</div>}
      {!loading && !error && sessions.length === 0 && (
        <div className="secondary-empty">
          <ActivityIcon size={38} />
          <h2>No activity yet</h2>
          <p>Start a monitoring session and it will appear here.</p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="activity-list">
          {sessions.map((session) => {
            const started = session.started_at ? new Date(session.started_at) : null;
            const duration = Math.max(0, Math.round((session.duration_sec || 0) / 60));
            const status = (session.status || 'completed').toUpperCase();

            return (
              <article className="activity-card" key={session.id}>
                <div className="activity-icon-wrap">
                  {status === 'COMPLETED'
                    ? <ShieldCheck size={22} />
                    : <AlertTriangle size={22} />}
                </div>
                <div className="activity-main">
                  <h2>Monitoring Session</h2>
                  <div className="activity-meta">
                    <span><Calendar size={15} /> {started ? started.toLocaleString() : 'Unknown date'}</span>
                    <span><Clock size={15} /> {duration} minutes</span>
                    <span>{session.frame_count || 0} frames</span>
                  </div>
                </div>
                <span className={`activity-status ${status.toLowerCase()}`}>{status}</span>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
