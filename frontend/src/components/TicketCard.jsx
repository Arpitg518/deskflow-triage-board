import React from 'react';

const formatAge = (minutes) => {
  if (minutes < 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return `${days}d ${hrs}h`;
};

export default function TicketCard({ ticket, onTransition, onDelete, onDragStart }) {
  const { _id, subject, description, customerEmail, priority, status, ageMinutes, slaBreached } = ticket;

  const handleMoveLeft = (e) => {
    e.stopPropagation();
    if (status === 'closed') onTransition(_id, 'resolved');
    else if (status === 'resolved') onTransition(_id, 'in_progress');
    else if (status === 'in_progress') onTransition(_id, 'open');
  };

  const handleMoveRight = (e) => {
    e.stopPropagation();
    if (status === 'open') onTransition(_id, 'in_progress');
    else if (status === 'in_progress') onTransition(_id, 'resolved');
    else if (status === 'resolved') onTransition(_id, 'closed');
  };

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', _id);
    if (onDragStart) {
      onDragStart(_id);
    }
  };

  // Determine button displays
  const showLeft = status !== 'open';
  const showRight = status !== 'closed';

  return (
    <div
      className={`ticket-card ${slaBreached ? 'breached' : ''}`}
      draggable
      onDragStart={handleDragStart}
      id={`ticket-${_id}`}
    >
      <div className="card-header">
        <span className="card-subject">{subject}</span>
        <span className={`card-priority-badge badge-${priority}`}>
          {priority}
        </span>
      </div>

      <p className="card-desc" title={description}>{description}</p>
      
      <div className="card-email">
        <svg style={{width:'12px', height:'12px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        {customerEmail}
      </div>

      <div className="card-footer">
        <div className="card-age">
          <svg style={{width:'12px', height:'12px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {formatAge(ageMinutes)}
          {slaBreached && (
            <span className="sla-badge sla-breached-badge">
              SLA BREACHED
            </span>
          )}
        </div>

        <div className="card-actions">
          {showLeft && (
            <button
              onClick={handleMoveLeft}
              className="btn-action"
              title="Move backward"
              aria-label="Move backward"
            >
              ←
            </button>
          )}
          {showRight && (
            <button
              onClick={handleMoveRight}
              className="btn-action"
              title="Move forward"
              aria-label="Move forward"
            >
              →
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(_id); }}
            className="btn-action"
            style={{ color: '#ef4444' }}
            title="Delete ticket"
            aria-label="Delete ticket"
          >
            <svg style={{width:'12px', height:'12px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
