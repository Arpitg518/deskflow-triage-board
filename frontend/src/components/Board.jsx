import React, { useState } from 'react';
import TicketCard from './TicketCard';

const COLUMNS = [
  { id: 'open', title: 'Open', color: '#3b82f6' },
  { id: 'in_progress', title: 'In Progress', color: '#f59e0b' },
  { id: 'resolved', title: 'Resolved', color: '#10b981' },
  { id: 'closed', title: 'Closed', color: '#6b7280' }
];

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

export default function Board({ tickets, onTransition, onDelete, draggedTicket, setDraggedTicket, triggerError }) {
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverIsValid, setDragOverIsValid] = useState(true);

  const handleDragStart = (ticketId) => {
    const ticket = tickets.find(t => t._id === ticketId);
    if (ticket) {
      setDraggedTicket(ticket);
    }
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (!draggedTicket) return;

    if (dragOverCol !== colId) {
      setDragOverCol(colId);
      const fromIndex = STATUS_ORDER.indexOf(draggedTicket.status);
      const toIndex = STATUS_ORDER.indexOf(colId);
      const isValid = Math.abs(toIndex - fromIndex) === 1;
      setDragOverIsValid(isValid);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTicket) return;

    const fromStatus = draggedTicket.status;
    const toStatus = colId;

    if (fromStatus === toStatus) {
      setDraggedTicket(null);
      return;
    }

    const fromIndex = STATUS_ORDER.indexOf(fromStatus);
    const toIndex = STATUS_ORDER.indexOf(toStatus);
    const isValid = Math.abs(toIndex - fromIndex) === 1;

    if (isValid) {
      onTransition(draggedTicket._id, toStatus);
    } else {
      triggerError(`Cannot move directly from '${fromStatus}' to '${toStatus}'. Statuses must change step-by-step.`);
    }
    setDraggedTicket(null);
  };

  return (
    <div className="board-grid" id="deskflow-board">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.id);
        const isCurrentlyOver = dragOverCol === col.id;
        
        let colClass = "board-column";
        if (isCurrentlyOver) {
          colClass += dragOverIsValid ? " drag-over" : " drag-over-invalid";
        }

        return (
          <div
            key={col.id}
            className={colClass}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            id={`column-${col.id}`}
          >
            <div className="column-header">
              <div className="column-title-group">
                <span
                  className="column-dot"
                  style={{ backgroundColor: col.color }}
                ></span>
                <h3 className="column-title">{col.title}</h3>
              </div>
              <span className="column-count">{colTickets.length}</span>
            </div>

            <div className="column-cards-container">
              {colTickets.length > 0 ? (
                colTickets.map((ticket) => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    onTransition={onTransition}
                    onDelete={onDelete}
                    onDragStart={handleDragStart}
                  />
                ))
              ) : (
                <div className="empty-state">
                  No tickets
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
