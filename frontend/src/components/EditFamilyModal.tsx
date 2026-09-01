import React, { useState, useRef } from 'react';
import { Users, Upload, Image as ImageIcon, Save, X, DollarSign, Camera, Check } from 'lucide-react';
import { Family, updateFamily } from '../services/api';

interface EditFamilyModalProps {
  family: Family;
  onClose: () => void;
  onSuccess: (updated: Family) => void;
}

// Preset avatars user can choose from
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
];

export const EditFamilyModal: React.FC<EditFamilyModalProps> = ({ family, onClose, onSuccess }) => {
  const [name, setName] = useState(family.name);
  const [income, setIncome] = useState(String(family.total_monthly_income || ''));
  const [avatarUrl, setAvatarUrl] = useState(family.avatar_url || PRESET_AVATARS[0]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload (converts to base64 data URI)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setAvatarUrl(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !income || Number(income) <= 0) {
      alert('Please enter a valid family name and positive monthly income');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateFamily(
        family.id,
        name.trim(),
        Number(income),
        avatarUrl
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update family profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={20} color="var(--accent-green)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Household Profile & Photo</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Avatar Preview & Upload Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', marginBottom: '1.4rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={avatarUrl}
                alt="Family Avatar"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--accent-green)',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.2)'
                }}
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', PRESET_AVATARS[0]);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--sidebar-active-bg)',
                  border: '2px solid #ffffff',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
                title="Upload Photo from Computer"
              >
                <Camera size={13} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click the camera icon to upload a photo, or choose a preset below:
            </div>

            {/* Preset Avatars Row */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {PRESET_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Preset ${idx + 1}`}
                  onClick={() => setAvatarUrl(url)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: avatarUrl === url ? '2px solid var(--accent-green)' : '1px solid var(--card-border)',
                    transform: avatarUrl === url ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>

            {/* Custom Image URL Input */}
            <div style={{ display: 'flex', width: '100%', gap: '0.4rem', marginTop: '0.2rem' }}>
              <input
                type="url"
                className="form-input"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                placeholder="Or paste image URL (https://...)"
                value={customUrlInput}
                onChange={e => setCustomUrlInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.76rem' }}
                onClick={handleApplyCustomUrl}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Household Name Input */}
          <div className="form-group">
            <label className="form-label">Family / Household Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sharma Household / Divine Family"
              required
            />
          </div>

          {/* Monthly Income Input */}
          <div className="form-group">
            <label className="form-label">Total Monthly Net Income (₹)</label>
            <input
              type="number"
              className="form-input"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder="150000"
              min="1"
              required
            />
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Updating monthly income automatically recalibrates your 50/30/20 budget allocations.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Save size={15} />
              <span>{submitting ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
