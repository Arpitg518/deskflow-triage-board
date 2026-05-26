import React, { useState } from 'react';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TicketForm({ isOpen, onClose, onSubmit }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [priority, setPriority] = useState('low');
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const localErrors = {};

    if (!subject.trim()) {
      localErrors.subject = 'Subject heading is required';
    }
    if (!description.trim()) {
      localErrors.description = 'Description of the issue is required';
    }
    if (!customerEmail.trim()) {
      localErrors.customerEmail = 'Customer email address is required';
    } else if (!emailPattern.test(customerEmail)) {
      localErrors.customerEmail = 'Please provide a valid email format (e.g., agent@domain.com)';
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await onSubmit({
      subject: subject.trim(),
      description: description.trim(),
      customerEmail: customerEmail.trim(),
      priority
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubject('');
      setDescription('');
      setCustomerEmail('');
      setPriority('low');
      onClose();
    } else if (result.validationErrors) {
      setErrors(result.validationErrors);
    } else if (result.generalError) {
      setErrors({ general: result.generalError });
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

        {errors.general && (
          <div className="form-error" style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="ticket-form" noValidate id="ticket-form-elem">
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
              placeholder="e.g. Database connection timeouts"
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
              placeholder="Describe the problem, steps to reproduce, or errors observed..."
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
              placeholder="customer@domain.com"
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
              <option value="low">Low (72 hr SLA)</option>
              <option value="medium">Medium (24 hr SLA)</option>
              <option value="high">High (4 hr SLA)</option>
              <option value="urgent">Urgent (1 hr SLA)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={isSubmitting}
            id="btn-submit-ticket"
          >
            {isSubmitting ? 'Registering Ticket...' : 'Register Ticket'}
          </button>
        </form>
      </div>
    </>
  );
}
