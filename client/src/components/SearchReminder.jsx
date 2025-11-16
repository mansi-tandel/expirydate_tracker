import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './SearchReminder.css';

const SearchReminder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError('Please enter an item name to search');
      return;
    }

    setLoading(true);
    setError('');
    setReminders([]);

    try {
      const response = await api.get(`/reminder/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setReminders(response.data);
      setHasSearched(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to search reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      await api.delete(`/reminder/${id}`);
      setReminders(reminders.filter(reminder => reminder._id !== id));
      alert('Reminder deleted successfully!');
    } catch (error) {
      alert('Failed to delete reminder');
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', text: 'Expired', className: 'expiry-warning', badgeClass: 'expired' };
    } else if (diffDays <= 3) {
      return { status: 'warning', text: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, className: 'expiry-warning', badgeClass: 'warning' };
    } else if (diffDays <= 7) {
      return { status: 'soon', text: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, className: 'expiry-soon', badgeClass: 'warning' };
    } else {
      return { status: 'safe', text: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, className: 'expiry-safe', badgeClass: 'safe' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const ReminderCard = ({ reminder }) => {
    const expiryStatus = getExpiryStatus(reminder.expiryDate);
    return (
      <div className={`reminder-card ${expiryStatus.status}`}>
        {reminder.image && (
          <img 
            src={reminder.image} 
            alt={reminder.itemType}
            className="reminder-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        
        <div className="reminder-card-head">
          <h3>{reminder.itemType}</h3>
          <span className={`status-badge ${expiryStatus.badgeClass}`}>
            {expiryStatus.status === 'expired' ? 'Expired' : 
             expiryStatus.status === 'warning' || expiryStatus.status === 'soon' ? 'Warning' : 'Safe'}
          </span>
        </div>
        
        <p><strong>Expiry Date:</strong> {formatDate(reminder.expiryDate)}</p>
        <p className={expiryStatus.className}>
          <strong>Status:</strong> {expiryStatus.text}
        </p>
        <p><strong>Notify Before:</strong> {reminder.notifyBeforeDays.join(', ')} days</p>
        
        <div className="reminder-actions">
          <Link 
            to={`/edit-reminder/${reminder._id}`} 
            className="btn btn-success"
          >
            Edit
          </Link>
          <button 
            onClick={() => handleDelete(reminder._id)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="reminder-list-container">
      <div className="card">
        <h2>Search Reminders</h2>
        <p className="muted">Find your reminders by searching for item names</p>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label htmlFor="searchTerm">Search by Item Name</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="e.g., milk, medicine, food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Searching...
              </>
            ) : (
              'Search Reminders'
            )}
          </button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {hasSearched && !loading && (
          <div className="search-results">
            <div className="search-results-head">
              <h3>
                Search Results for "{searchTerm}" 
                {reminders.length > 0 && (
                  <span className="count">
                    {' '}({reminders.length} found)
                  </span>
                )}
              </h3>
              {reminders.length > 0 && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setReminders([]);
                    setHasSearched(false);
                    setError('');
                  }} 
                  className="btn btn-secondary"
                >
                  Clear Search
                </button>
              )}
            </div>
            
            {reminders.length === 0 ? (
              <div className="empty-state">
                <h3>No reminders found</h3>
                <p>No reminders found matching "{searchTerm}"</p>
                <p>Try searching with a different term or check your spelling.</p>
              </div>
            ) : (
              <div className="reminder-grid">
                {reminders.map(reminder => (
                  <ReminderCard key={reminder._id} reminder={reminder} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="nav-back">
          <Link to="/" className="btn btn-primary">
            View All Reminders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchReminder;


