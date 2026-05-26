import React, { useState, useEffect } from 'react';
import StatsStrip from './components/StatsStrip';
import Board from './components/Board';
import TicketForm from './components/TicketForm';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    statusCounts: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    priorityCounts: { low: 0, medium: 0, high: 0, urgent: 0 },
    openSlaBreachedCount: 0
  });

  // Filter States
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [breachedFilter, setBreachedFilter] = useState(false);

  // Form Panel State
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Drag and Drop active state
  const [draggedTicket, setDraggedTicket] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (priorityFilter !== 'all') {
        queryParams.append('priority', priorityFilter);
      }
      if (breachedFilter) {
        queryParams.append('breached', 'true');
      }

      const res = await fetch(`/api/tickets?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/tickets/stats');
      if (!res.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Run on filters or initial load
  useEffect(() => {
    fetchTickets();
  }, [priorityFilter, breachedFilter]);

  // Set up periodic auto-polling to update age dynamically (and show breaches in real-time)
  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchTickets();
      fetchStats();
    }, 10000); // refresh every 10s

    return () => clearInterval(interval);
  }, []);

  // Handle ticket creation
  const handleCreateTicket = async (ticketData) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      // Add to list and update stats
      setTickets((prev) => [data, ...prev]);
      fetchStats();
      addToast('Ticket created successfully!', 'success');
      return true;
    } catch (err) {
      addToast(err.message, 'error');
      return false;
    }
  };

  // Handle ticket transition
  const handleTransition = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update ticket');
      }

      // Update state locally
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? data : t))
      );
      fetchStats();
      addToast(`Ticket status updated to '${newStatus.replace('_', ' ')}'!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
      
      // If drag/drop fails, shake the corresponding card
      const card = document.getElementById(`ticket-${ticketId}`);
      if (card) {
        card.classList.add('shake-animation');
        setTimeout(() => card.classList.remove('shake-animation'), 4000);
      }
    }
  };

  // Handle ticket deletion
  const handleDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete ticket');
      }

      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      fetchStats();
      addToast('Ticket deleted successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">D</div>
          <h1>DeskFlow</h1>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary"
          id="btn-new-ticket"
        >
          + Create Ticket
        </button>
      </header>

      {/* Stats Strip */}
      <StatsStrip stats={stats} />

      {/* Filter Toolbar */}
      <div className="toolbar" id="filter-toolbar">
        <div className="filters-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="filter-label" htmlFor="filter-priority">Filter Priority:</span>
            <select
              id="filter-priority"
              className="select-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <label className="checkbox-container" htmlFor="filter-sla">
            <input
              id="filter-sla"
              type="checkbox"
              checked={breachedFilter}
              onChange={(e) => setBreachedFilter(e.target.checked)}
            />
            Show SLA Breached Only
          </label>
        </div>
        
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Auto-polling active (10s)
        </span>
      </div>

      {/* Board Triage view */}
      <Board
        tickets={tickets}
        onTransition={handleTransition}
        onDelete={handleDelete}
        draggedTicket={draggedTicket}
        setDraggedTicket={setDraggedTicket}
        triggerError={(msg) => addToast(msg, 'error')}
      />

      {/* Create Ticket Sliding Drawer Form */}
      <TicketForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTicket}
      />

      {/* Toasts List */}
      <div className="toast-container" id="toast-alerts">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${
              toast.type === 'error' ? 'toast-error' : 'toast-success'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
