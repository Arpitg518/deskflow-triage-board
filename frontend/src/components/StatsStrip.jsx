import React from 'react';

export default function StatsStrip({ stats }) {
  const statusCounts = stats?.statusCounts || { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  const openSlaBreachedCount = stats?.openSlaBreachedCount || 0;

  return (
    <div className="stats-strip">
      <div className="stat-card stat-open" id="stat-open-card">
        <div className="stat-info">
          <span className="stat-title">Open</span>
          <span className="stat-value">{statusCounts.open}</span>
        </div>
        <div className="stat-indicator"></div>
      </div>
      <div className="stat-card stat-progress" id="stat-progress-card">
        <div className="stat-info">
          <span className="stat-title">In Progress</span>
          <span className="stat-value">{statusCounts.in_progress}</span>
        </div>
        <div className="stat-indicator"></div>
      </div>
      <div className="stat-card stat-resolved" id="stat-resolved-card">
        <div className="stat-info">
          <span className="stat-title">Resolved</span>
          <span className="stat-value">{statusCounts.resolved}</span>
        </div>
        <div className="stat-indicator"></div>
      </div>
      <div className="stat-card stat-closed" id="stat-closed-card">
        <div className="stat-info">
          <span className="stat-title">Closed</span>
          <span className="stat-value">{statusCounts.closed}</span>
        </div>
        <div className="stat-indicator"></div>
      </div>
      <div className="stat-card stat-breached" id="stat-breached-card">
        <div className="stat-info">
          <span className="stat-title">Active Breaches</span>
          <span className="stat-value">{openSlaBreachedCount}</span>
        </div>
        <div className="stat-indicator"></div>
      </div>
    </div>
  );
}
