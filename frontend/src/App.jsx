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

  const [priorityFilter, setPriorityFilter] = useState('all');
  const [breachedFilter, setBreachedFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draggedTicket, setDraggedTicket] = useState(null);

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadTicketData = async () => {
    try {
      const params = new URLSearchParams();
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }
      if (breachedFilter) {
        params.append('breached', 'true');
      }

      const response = await fetch(`/api/tickets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to retrieve support ticket records.');
      }
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/tickets/stats');
      if (!response.ok) {
        throw new Error('Failed to retrieve dashboard summaries.');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [priorityFilter, breachedFilter]);

  useEffect(() => {
    loadDashboardStats();

    const fetchInterval = setInterval(() => {
      loadTicketData();
      loadDashboardStats();
    }, 10000);

    return () => clearInterval(fetchInterval);
  }, []);

  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.fields) {
          return { success: false, validationErrors: data.fields };
        }
        throw new Error(data.error || 'Unable to register support ticket.');
      }

      setTickets((prev) => [data, ...prev]);
      loadDashboardStats();
      addToast('Ticket registered successfully.', 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message, 'error');
      return { success: false, generalError: err.message };
    }
  };

  const handleTransitionStatus = async (ticketId, nextStatus) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update ticket state.');
      }

      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? data : t))
      );
      loadDashboardStats();
      addToast(`Status changed to '${nextStatus.replace('_', ' ')}'.`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
      
      const card = document.getElementById(`ticket-${ticketId}`);
      if (card) {
        card.classList.add('shake-animation');
        setTimeout(() => card.classList.remove('shake-animation'), 500);
      }
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this support ticket permanently?')) return;
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete ticket.');
      }

      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      loadDashboardStats();
      addToast('Ticket deleted.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  let processedTickets = tickets.filter((ticket) => {
    const text = searchQuery.toLowerCase().trim();
    if (!text) return true;
    return (
      ticket.subject.toLowerCase().includes(text) ||
      ticket.description.toLowerCase().includes(text) ||
      ticket.customerEmail.toLowerCase().includes(text)
    );
  });

  processedTickets.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'priority') {
      const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
    }
    return 0;
  });

  return (
    <div className="app-container">
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

      <StatsStrip stats={stats} />

      <div className="toolbar" id="filter-toolbar">
        <div className="filters-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="filter-label">Search:</span>
            <input
              type="text"
              className="select-filter"
              style={{ width: '180px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Subject, email, desc..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="filter-label">Priority:</span>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="filter-label">Sort:</span>
            <select
              className="select-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
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
          Polling server every 10s
        </span>
      </div>

      <Board
        tickets={processedTickets}
        onTransition={handleTransitionStatus}
        onDelete={handleDeleteTicket}
        draggedTicket={draggedTicket}
        setDraggedTicket={setDraggedTicket}
        triggerError={(msg) => addToast(msg, 'error')}
      />

      <TicketForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTicket}
      />

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
