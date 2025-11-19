import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import './ReminderList.css';

const ReminderList = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReminders = useCallback(async () => {
    try {
      const response = await api.get('/reminder');
      setReminders(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch reminders');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await api.delete(`/reminder/${id}`);
        setReminders(reminders.filter(reminder => reminder._id !== id));
      } catch (err) {
        setError('Failed to delete reminder');
      }
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', text: 'Expired', badgeClass: 'status-expired' };
    } else if (diffDays <= 3) {
      return { status: 'warning', text: 'Expiring Soon', badgeClass: 'status-warning' };
    } else {
      return { status: 'safe', text: 'Safe', badgeClass: 'status-safe' };
    }
  };

  const getStats = () => {
    const total = reminders.length;
    const expired = reminders.filter(r => getExpiryStatus(r.expiryDate).status === 'expired').length;
    const warning = reminders.filter(r => getExpiryStatus(r.expiryDate).status === 'warning').length;
    const safe = reminders.filter(r => getExpiryStatus(r.expiryDate).status === 'safe').length;

    return { total, expired, warning, safe };
  };

  const params = useParams();
  const viewFilter = params.filter ?? 'overview';

  const mapFilterToStatus = (f) => {
    if (f === 'safe') return 'safe';
    if (f === 'expiring-soon') return 'warning';
    if (f === 'expired') return 'expired';
    if (f === 'all') return 'all';
    return null;
  };

  const filteredReminders = (() => {
    const status = mapFilterToStatus(viewFilter);
    if (!status) return [];
    if (status === 'all') return reminders;
    return reminders.filter(r => getExpiryStatus(r.expiryDate).status === status);
  })();

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reminders...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="container">
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="stats-grid">
        <Link to="/reminders/all" className="stat-card stat-link">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Reminders</div>
        </Link>
        <Link to="/reminders/safe" className="stat-card stat-link">
          <div className="stat-number">{stats.safe}</div>
          <div className="stat-label">Safe</div>
        </Link>
        <Link to="/reminders/expiring-soon" className="stat-card stat-link">
          <div className="stat-number">{stats.warning}</div>
          <div className="stat-label">Expiring Soon</div>
        </Link>
        <Link to="/reminders/expired" className="stat-card stat-link">
          <div className="stat-number">{stats.expired}</div>
          <div className="stat-label">Expired</div>
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{viewFilter === 'overview' ? 'Overview' : (
            viewFilter === 'all' ? 'All Reminders' : (
              viewFilter === 'safe' ? 'Safe Reminders' : (
                viewFilter === 'expiring-soon' ? 'Expiring Soon' : 'Expired Reminders'
              )
            )
          )}</h2>
          <div className="card-actions">
            <Link to="/add-reminder" className="btn btn-primary">
              <span>➕</span>
              Add New Reminder
            </Link>
          </div>
        </div>
      </div>

  {viewFilter === 'overview' ? null : filteredReminders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>No Reminders</h3>
          <p>No reminders found for this category.</p>
          <Link to="/add-reminder" className="btn btn-primary">
            Create Your First Reminder
          </Link>
        </div>
      ) : (
        <div className="reminders-grid">
          {filteredReminders.map(reminder => {
            const status = getExpiryStatus(reminder.expiryDate);
            return (
              <div key={reminder._id} className={`reminder-card ${status.status}`}>
                <div className="reminder-header">
                  <h3 className="reminder-title">{reminder.itemType}</h3>
                  <span className={`reminder-status ${status.badgeClass}`}>
                    {status.text}
                  </span>
                </div>
                
                {reminder.image && (
                  <img 
                    src={reminder.image} 
                    alt={reminder.itemType} 
                    className="reminder-image"
                  />
                )}
                {reminder.attachment && (
                  <div className="reminder-attachment">
                    <a href={reminder.attachment} target="_blank" rel="noreferrer">📎 Download Attachment</a>
                  </div>
                )}
                
                <div className="reminder-details">
                  <div className="reminder-detail">
                    <span className="reminder-detail-label">Expiry Date</span>
                    <span className="reminder-detail-value">
                      {new Date(reminder.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="reminder-detail">
                    <span className="reminder-detail-label">Notify Before</span>
                    <span className="reminder-detail-value">
                      {reminder.notifyBeforeDays.join(', ')} days
                    </span>
                  </div>
                  <div className="reminder-detail">
                    <span className="reminder-detail-label">Created</span>
                    <span className="reminder-detail-value">
                      {new Date(reminder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="reminder-actions">
                  <Link to={`/edit-reminder/${reminder._id}`} className="btn btn-secondary">
                    ✏️ Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(reminder._id)} 
                    className="btn btn-danger"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReminderList;


