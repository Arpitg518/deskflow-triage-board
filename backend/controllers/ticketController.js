import Ticket from '../models/Ticket.js';

const PRIORITY_SLA_LIMITS = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72
};

const WORKFLOW_STEPS = ['open', 'in_progress', 'resolved', 'closed'];

export function computeDerivedFields(ticket) {
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  const createdAt = new Date(ticketObj.createdAt);
  const now = new Date();
  
  const limitHours = PRIORITY_SLA_LIMITS[ticketObj.priority] || 72;
  const targetMinutes = limitHours * 60;
  
  let ageMinutes = 0;
  if (ticketObj.resolvedAt) {
    const resolvedAt = new Date(ticketObj.resolvedAt);
    ageMinutes = Math.floor((resolvedAt - createdAt) / 60000);
  } else {
    ageMinutes = Math.floor((now - createdAt) / 60000);
  }
  
  if (ageMinutes < 0) {
    ageMinutes = 0;
  }
  
  const slaBreached = ageMinutes > targetMinutes;
  
  return {
    ...ticketObj,
    ageMinutes,
    slaBreached
  };
}

function validateWorkflowTransition(currentStatus, newStatus) {
  const currIndex = WORKFLOW_STEPS.indexOf(currentStatus);
  const newIndex = WORKFLOW_STEPS.indexOf(newStatus);
  
  if (newIndex === -1) {
    return { isValid: false, error: `Requested status '${newStatus}' is unrecognized.` };
  }
  
  if (newIndex > currIndex) {
    if (newIndex !== currIndex + 1) {
      return {
        isValid: false,
        error: `Cannot skip steps. Path must be: Open → In Progress → Resolved → Closed. (Attempted: ${currentStatus} → ${newStatus})`
      };
    }
  } else {
    if (newIndex !== currIndex - 1) {
      return {
        isValid: false,
        error: `Backward transitions are restricted to one step at a time. (Attempted: ${currentStatus} → ${newStatus})`
      };
    }
  }
  
  return { isValid: true };
}

export const createTicket = async (req, res) => {
  try {
    const { subject, description, customerEmail, priority } = req.body;
    
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
      const errorFields = {};
      Object.keys(error.errors).forEach((key) => {
        errorFields[key] = error.errors[key].message;
      });
      return res.status(400).json({
        error: 'Validation failed',
        fields: errorFields
      });
    }
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, priority, breached } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const dbTickets = await Ticket.find(filter).sort({ createdAt: -1 });
    
    let computedList = dbTickets.map(computeDerivedFields);
    
    if (breached !== undefined) {
      const filterBreached = breached === 'true';
      computedList = computedList.filter(t => t.slaBreached === filterBreached);
    }
    
    res.status(200).json(computedList);
  } catch (error) {
    res.status(500).json({ error: 'Database query error: ' + error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, subject, description, customerEmail, priority } = req.body;
    
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: `Support ticket with ID ${id} was not found.` });
    }
    
    if (status && status !== ticket.status) {
      const validation = validateWorkflowTransition(ticket.status, status);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      ticket.status = status;
      
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (WORKFLOW_STEPS.indexOf(status) < WORKFLOW_STEPS.indexOf('resolved')) {
        ticket.resolvedAt = null;
      }
    }
    
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (customerEmail) ticket.customerEmail = customerEmail;
    if (priority) ticket.priority = priority;
    
    await ticket.save();
    res.status(200).json(computeDerivedFields(ticket));
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errorFields = {};
      Object.keys(error.errors).forEach((key) => {
        errorFields[key] = error.errors[key].message;
      });
      return res.status(400).json({
        error: 'Validation failed',
        fields: errorFields
      });
    }
    res.status(500).json({ error: 'Database save error: ' + error.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Ticket.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: `Support ticket with ID ${id} was not found.` });
    }
    res.status(200).json({ message: 'Ticket removed successfully.', id });
  } catch (error) {
    res.status(500).json({ error: 'Database deletion error: ' + error.message });
  }
};

export const getTicketStats = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const enrichedTickets = tickets.map(computeDerivedFields);
    
    const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    let openSlaBreachedCount = 0;
    
    enrichedTickets.forEach((t) => {
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
      
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
    res.status(500).json({ error: 'Database aggregation error: ' + error.message });
  }
};
