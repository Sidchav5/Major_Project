import React, { useEffect, useState } from 'react';
import { Award, Flame, Clock, Target, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import './ActivityAchievements.css';

export default function Achievements() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const response = await api.get('/api/sessions?limit=100');
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
      } finally {
        setLoading(false);
      }
    };
    loadAchievements();
  }, []);

  const totalMinutes = sessions.reduce(
    (sum, session) => sum + (session.duration_sec || 0) / 60,
    0
  );
  const completedSessions = sessions.filter(
    (session) => (session.status || '').toLowerCase() === 'completed'
  ).length;
  const firstSession = sessions.length > 0;
  const twentyMinutes = totalMinutes >= 20;
  const tenSessions = completedSessions >= 10;

  const achievements = [
    {
      title: 'First Session',
      description: 'Complete your first posture-monitoring session.',
      icon: Target,
      unlocked: firstSession
    },
    {
      title: 'Consistency Builder',
      description: 'Complete 10 monitoring sessions.',
      icon: Flame,
      unlocked: tenSessions
    },
    {
      title: 'Twenty Minute Watch',
      description: 'Accumulate 20 minutes of monitoring.',
      icon: Clock,
      unlocked: twentyMinutes
    },
    {
      title: 'Ergonomic Explorer',
      description: 'Finish at least one session successfully.',
      icon: ShieldCheck,
      unlocked: completedSessions > 0
    }
  ];

  return (
    <div className="activity-achievements-page">
      <div className="secondary-page-header">
        <div>
          <h1>Achievements</h1>
          <p>Progress calculated from your recorded sessions.</p>
        </div>
        <Award className="achievement-header-icon" size={42} />
      </div>

      {loading ? (
        <div className="secondary-loading">Loading achievements...</div>
      ) : (
        <div className="achievement-grid">
          {achievements.map(({ title, description, icon: Icon, unlocked }) => (
            <article className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`} key={title}>
              <div className="achievement-icon"><Icon size={28} /></div>
              <h2>{title}</h2>
              <p>{description}</p>
              <span>{unlocked ? 'Unlocked' : 'Locked'}</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
