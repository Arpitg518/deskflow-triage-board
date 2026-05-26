import React, { useState } from 'react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TicketForm({ isOpen, onClose, onSubmit }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [priority, setPriority] = useState('low');
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!customerEmail.trim()) {
      newErrors.customerEmail = 'Customer email is required';
    } else if (!emailRegex.test(customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const success = await onSubmit({
      subject: subject.trim(),
      description: description.trim(),
      customerEmail: customerEmail.trim(),
      priority
    });

    setSubmitting(false);
    if (success) {
      setSubject('');
      setDescription('');
      setCustomerEmail('');
      setPriority('low');
      onClose();
    }
  };

  return (
    <>
      <div
        className={`panel-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        id="create-ticket-backdrop"
      ></div>
      <div
        className={`form-panel ${isOpen ? 'active' : ''}`}
        id="create-ticket-panel"
      >
        <div className="panel-header">
          <h2 className="panel-title">New Support Ticket</h2>
          <button
            onClick={onClose}
            className="btn-close"
            aria-label="Close ticket form"
            id="btn-close-panel"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ticket-form" noValidate id="ticket-form-elem">
          <div className="form-group">
            <label className="form-label" htmlFor="ticket-subject">
              Subject
            </label>
            <input
              id="ticket-subject"
              type="text"
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. System is down"
            />
            {errors.subject && <span className="form-error">{errors.subject}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ticket-desc">
              Description
            </label>
            <textarea
              id="ticket-desc"
              className="form-input form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ticket-email">
              Customer Email
            </label>
            <input
              id="ticket-email"
              type="email"
              className="form-input"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@email.com"
            />
            {errors.customerEmail && <span className="form-error">{errors.customerEmail}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ticket-priority">
              Priority
            </label>
            <select
              id="ticket-priority"
              className="select-filter"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent (1 hour target)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={submitting}
            id="btn-submit-ticket"
          >
            {submitting ? 'Creating Ticket...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </>
  );
}
