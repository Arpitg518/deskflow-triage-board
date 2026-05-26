import Ticket from '../models/Ticket.js';

const SLA_TARGETS_HOURS = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72
};

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

// Helper to compute derived fields on the fly
export function computeDerivedFields(ticket) {
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  const createdAt = new Date(ticketObj.createdAt);
  const now = new Date();
  
  const targetHours = SLA_TARGETS_HOURS[ticketObj.priority] || 72;
  const targetMinutes = targetHours * 60;
  
  let ageMinutes = 0;
  if (ticketObj.resolvedAt) {
    const resolvedAt = new Date(ticketObj.resolvedAt);
    ageMinutes = Math.floor((resolvedAt - createdAt) / 60000);
  } else {
    ageMinutes = Math.floor((now - createdAt) / 60000);
  }
  
  if (ageMinutes < 0) ageMinutes = 0;
  
  // slaBreached is true if ticket is still unresolved past its target,
  // or if it was resolved after its target
  const slaBreached = ageMinutes > targetMinutes;
  
  return {
    ...ticketObj,
    ageMinutes,
    slaBreached
  };
}

// Create Ticket
export const createTicket = async (req, res) => {
  try {
    const { subject, description, customerEmail, priority } = req.body;
    
    // Express / Mongoose validation
    const ticket = new Ticket({
      subject,
      description,
      customerEmail,
      priority
    });
    
    await ticket.save();
    
    res.status(201).json(computeDerivedFields(ticket));
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
};

// List Tickets
export const getTickets = async (req, res) => {
  try {
    const { status, priority, breached } = req.query;
    
    const dbQuery = {};
    if (status) dbQuery.status = status;
    if (priority) dbQuery.priority = priority;
    
    const tickets = await Ticket.find(dbQuery).sort({ createdAt: -1 });
    
    let computedTickets = tickets.map(computeDerivedFields);
    
    if (breached !== undefined) {
      const targetBreached = breached === 'true';
      computedTickets = computedTickets.filter(t => t.slaBreached === targetBreached);
    }
    
    res.status(200).json(computedTickets);
  } catch (error) {
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
};

// Update Ticket (handles status transitions with validation rules)
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, subject, description, customerEmail, priority } = req.body;
    
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(444).json({ error: 'Ticket not found' });
    }
    
    // If status is being updated, enforce transitions
    if (status && status !== ticket.status) {
      const currIndex = STATUS_ORDER.indexOf(ticket.status);
      const newIndex = STATUS_ORDER.indexOf(status);
      
      if (newIndex === -1) {
        return res.status(400).json({ error: `Invalid status: ${status}` });
      }
      
      // Enforce status transitions
      if (newIndex > currIndex) {
        // Forward transitions: only adjacent is allowed
        if (newIndex !== currIndex + 1) {
          return res.status(400).json({
            error: `Invalid transition: cannot move directly from '${ticket.status}' to '${status}'. Transition must follow: open -> in_progress -> resolved -> closed.`
          });
        }
      } else {
        // Backward transitions: only adjacent is allowed
        if (newIndex !== currIndex - 1) {
          return res.status(400).json({
            error: `Invalid transition: cannot move directly from '${ticket.status}' to '${status}'. Backward movement is allowed only one step at a time.`
          });
        }
      }
      
      // Apply status change
      ticket.status = status;
      
      // Side effects of status transitions
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (newIndex < STATUS_ORDER.indexOf('resolved')) {
        // Cleared if moved back before resolved
        ticket.resolvedAt = null;
      }
    }
    
    // Update other fields if provided
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (customerEmail) ticket.customerEmail = customerEmail;
    if (priority) ticket.priority = priority;
    
    await ticket.save();
    
    res.status(200).json(computeDerivedFields(ticket));
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
};

// Delete Ticket
export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
};

// Get Ticket Stats
export const getTicketStats = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const computed = tickets.map(computeDerivedFields);
    
    const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    let openSlaBreachedCount = 0;
    
    computed.forEach(t => {
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
      // "the number of SLA-breached tickets currently open"
      // Open means either status 'open' or 'in_progress'
      if (t.slaBreached && (t.status === 'open' || t.status === 'in_progress')) {
        openSlaBreachedCount++;
      }
    });
    
    res.status(200).json({
      statusCounts,
      priorityCounts,
      openSlaBreachedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
};
