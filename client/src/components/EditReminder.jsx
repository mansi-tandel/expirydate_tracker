import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './ReminderForm.css';

const EditReminder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemType: '',
    image: '',
    expiryDate: '',
    notifyBeforeDays: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);

  const fetchReminder = useCallback(async () => {
    try {
      const response = await api.get(`/reminder/${id}`);
      const reminder = response.data;
      setFormData({
        itemType: reminder.itemType,
        image: reminder.image || '',
        expiryDate: reminder.expiryDate.split('T')[0],
        notifyBeforeDays: reminder.notifyBeforeDays
      });
      if (reminder.image) {
        setImagePreview(reminder.image);
      }
    } catch (error) {
      setError('Failed to fetch reminder');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReminder();
  }, [fetchReminder]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files.length > 0) {
      const file = files[0];
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (days) => {
    setFormData(prev => ({
      ...prev,
      notifyBeforeDays: prev.notifyBeforeDays.includes(days)
        ? prev.notifyBeforeDays.filter(d => d !== days)
        : [...prev.notifyBeforeDays, days].sort((a, b) => a - b)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.itemType.trim()) {
      setError('Item type is required');
      return;
    }

    if (!formData.expiryDate) {
      setError('Expiry date is required');
      return;
    }

    if (formData.notifyBeforeDays.length === 0) {
      setError('Please select at least one notification day');
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('itemType', formData.itemType);
      fd.append('expiryDate', formData.expiryDate);
      formData.notifyBeforeDays.forEach(day => fd.append('notifyBeforeDays', day));
      if (newImageFile) {
        fd.append('image', newImageFile);
      }
      // debug log
      console.log('Edit FormData being sent:');
      for (const pair of fd.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }
      await api.put(`/reminder/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/');
    } catch (error) {
      console.error('Update error:', error, error?.response?.data);
      setError(error.response?.data?.message || 'Failed to update reminder');
    } finally {
      setSaving(false);
    }
  };

  const notificationOptions = [
    { days: 1, label: '1 day before' },
    { days: 3, label: '3 days before' },
    { days: 7, label: '1 week before' },
    { days: 14, label: '2 weeks before' },
    { days: 30, label: '1 month before' }
  ];

  const getDaysUntilExpiry = useCallback(() => {
    if (!formData.expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(formData.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  }, [formData.expiryDate]);

  const daysUntilExpiry = getDaysUntilExpiry();

  if (loading) {
    return (
      <div className="reminder-form-container">
        <div className="loading">
          <div className="loading-spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px' }}></div>
          Loading reminder...
        </div>
      </div>
    );
  }

  if (error && !formData.itemType) {
    return (
      <div className="reminder-form-container">
        <div className="alert alert-error">{error}</div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            Back to Reminders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reminder-form-container">
      <div className="card">
        <h2>Edit Reminder</h2>
        <p className="muted">
          Update your reminder details and notification preferences
        </p>

        <form onSubmit={handleSubmit} className="reminder-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="itemType">Item Name *</label>
              <input
                type="text"
                id="itemType"
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                placeholder="e.g., Milk, Medicine, Food..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date *</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">Item Image (Optional)</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
            <small className="help">Upload a new image to replace the current one</small>
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img 
                src={imagePreview} 
                alt="Preview" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  setError('Invalid image');
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label>Notification Settings *</label>
            <p className="help">
              Choose when you want to be notified before the expiry date
            </p>
            <div className="checkbox-group">
              {notificationOptions.map(option => {
                const tooLate = (daysUntilExpiry == null) ? false : option.days > daysUntilExpiry || option.days <= 0;
                return (
                  <label key={option.days} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.notifyBeforeDays.includes(option.days)}
                      onChange={() => handleCheckboxChange(option.days)}
                      disabled={tooLate}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="loading-spinner"></span>
                  Updating Reminder...
                </>
              ) : (
                'Update Reminder'
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReminder;


