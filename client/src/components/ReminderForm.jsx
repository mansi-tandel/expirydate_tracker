import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './ReminderForm.css';

const ReminderForm = () => {
  const [formData, setFormData] = useState({
    itemType: '',
    image: null, // now a File
    expiryDate: '',
    notifyBeforeDays: [1, 3, 7]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const navigate = useNavigate();

  // Helper: returns how many full days between today and expiryDate (inclusive/exclusive)
  const getDaysUntilExpiry = useCallback(() => {
    if (!formData.expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(formData.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  }, [formData.expiryDate]);

  // Deselect any notifyBeforeDays now impossible (date moved earlier)
  useEffect(() => {
    const daysUntilExpiry = getDaysUntilExpiry();
    if (daysUntilExpiry == null) return;
    setFormData(prev => ({
      ...prev,
      notifyBeforeDays: prev.notifyBeforeDays.filter(d => d <= daysUntilExpiry && d > 0)
    }));
  }, [formData.expiryDate, getDaysUntilExpiry]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('itemType', formData.itemType);
      formDataToSend.append('expiryDate', formData.expiryDate);
      // Properly append each notifyBeforeDays value (do NOT JSON.stringify)
      formData.notifyBeforeDays.forEach(day =>
        formDataToSend.append('notifyBeforeDays', day)
      );
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      console.log('FormData being sent:');
      for (const pair of formDataToSend.entries()) {
        console.log(pair[0]+ ':', pair[1]);
      }
      const response = await api.post('/reminder', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Success:', response.data);
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error, error?.response?.data);
      if (Array.isArray(error.response?.data?.errors)) {
        setError(error.response.data.errors[0]?.msg || 'Invalid input');
      } else {
        setError(error.response?.data?.message || 'Failed to create reminder');
      }
    } finally {
      setLoading(false);
    }
  };

  const notificationOptions = [
    { days: 1, label: '1 day before' },
    { days: 3, label: '3 days before' },
    { days: 7, label: '1 week before' },
    { days: 14, label: '2 weeks before' },
    { days: 30, label: '1 month before' }
  ];

  const daysUntilExpiry = getDaysUntilExpiry();
  return (
    <div className="reminder-form-container">
      <div className="card">
        <h2>Add New Reminder</h2>
        <p className="muted">Track your items and never miss an expiry date again</p>
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
          {/* Image upload section */}
          <div className="form-group">
            <label htmlFor="image">Item Image (Optional)</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
            <small className="help">
              Upload an image of your item for easy identification
            </small>
          </div>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
          <div className="form-group">
            <label>Notification Settings *</label>
            <p className="help">Choose when you want to be notified before the expiry date</p>
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Reminder...
                </>
              ) : (
                'Create Reminder'
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

export default ReminderForm;


