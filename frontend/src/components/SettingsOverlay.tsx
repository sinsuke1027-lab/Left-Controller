'use client';

import React, { useState } from 'react';
import { ButtonConfig } from './ButtonGrid';
import { GridEditor } from './GridEditor';
import styles from './Tabs.module.css'; // Reusing styles for now

interface Profile {
  id: string;
  name: string;
  buttons: ButtonConfig[];
  rows?: number;
  cols?: number;
}

interface SettingsOverlayProps {
  initialProfiles: Profile[];
  onClose: () => void;
  onSave: (profiles: Profile[]) => void;
}

// ... imports ...
import { X, Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ initialProfiles, onClose, onSave }) => {
  const [profiles, setProfiles] = useState<Profile[]>(JSON.parse(JSON.stringify(initialProfiles)));
  const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'layout' | 'edit'>('layout'); // 'layout' = Tab Order, 'edit' = Content

  // Profile Management Logic
  const handleAddProfile = () => {
    const newId = `custom_${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      name: 'New Profile',
      buttons: [
        { id: `btn_${Date.now()}_1`, label: 'Btn 1', icon: 'square', action: 'press', params: [] },
      ],
      rows: 3, cols: 3
    };
    // Add to end of list
    setProfiles([...profiles, newProfile]);
  };

  const handleDeleteProfile = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Are you sure you want to delete this profile?')) {
      const newProfiles = profiles.filter(p => p.id !== id);
      setProfiles(newProfiles);
      if (activeProfileId === id && newProfiles.length > 0) {
        setActiveProfileId(newProfiles[0].id);
      }
    }
  };

  const moveProfile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === profiles.length - 1) return;
    
    const newProfiles = [...profiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newProfiles[index], newProfiles[targetIndex]] = [newProfiles[targetIndex], newProfiles[index]];
    setProfiles(newProfiles);
  };

  // ... (handleUpdateButtons, handleNameChange remain same) ...
  const handleUpdateButtons = (updatedButtons: ButtonConfig[]) => {
    setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, buttons: updatedButtons } : p));
  };

  const handleNameChange = (newName: string) => {
    setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, name: newName } : p));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(profiles);
    setIsSaving(false);
    onClose();
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--background)',
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Settings</h2>
            <div style={{ display: 'flex',  background: 'var(--surface)', borderRadius: '8px', padding: '4px' }}>
                <button 
                  onClick={() => setViewMode('layout')}
                  style={{ 
                    padding: '6px 12px', borderRadius: '6px', border: 'none', 
                    background: viewMode === 'layout' ? 'var(--accent)' : 'transparent',
                    color: viewMode === 'layout' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                  }}
                >
                  Tab Layout
                </button>
                <button 
                  onClick={() => setViewMode('edit')}
                  style={{ 
                    padding: '6px 12px', borderRadius: '6px', border: 'none', 
                    background: viewMode === 'edit' ? 'var(--accent)' : 'transparent',
                    color: viewMode === 'edit' ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                  }}
                >
                  Edit Groups
                </button>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '12px', 
              background: 'var(--accent)', color: '#fff', border: 'none',
              fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save & Close'}
          </button>
          <button 
            onClick={onClose}
            style={{ 
              padding: '8px', borderRadius: '50%', 
              background: 'var(--surface)', color: 'var(--text-secondary)', border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {viewMode === 'layout' ? (
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '20px', padding: '20px', background: 'var(--surface)', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Active Tabs (Max 5)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                    These top 5 groups will be displayed as tabs. Reorder to swap.
                </p>
                {profiles.map((p, index) => (
                    <div 
                        key={p.id} 
                        style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px', marginBottom: '8px', borderRadius: '8px',
                            background: index < 5 ? 'rgba(59, 130, 246, 0.1)' : 'var(--background)',
                            border: index < 5 ? '1px solid var(--accent)' : '1px solid transparent',
                            opacity: index < 5 ? 1 : 0.6
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ 
                                width: '24px', height: '24px', borderRadius: '50%', 
                                background: index < 5 ? 'var(--accent)' : '#555', color: '#fff', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' 
                            }}>
                                {index + 1}
                            </span>
                            <span style={{ fontWeight: 600 }}>{p.name} {index >= 5 && '(Stored)'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => moveProfile(index, 'up')} disabled={index === 0} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><ArrowUp size={16} /></button>
                            <button onClick={() => moveProfile(index, 'down')} disabled={index === profiles.length - 1} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><ArrowDown size={16} /></button>
                            <button onClick={(e) => handleDeleteProfile(p.id, e)} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: '8px' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                
                 <button 
                    onClick={handleAddProfile}
                    style={{ 
                        marginTop: '10px', width: '100%', padding: '12px', borderRadius: '8px', 
                        border: '2px dashed var(--text-secondary)', background: 'transparent', 
                        color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                >
                    <Plus size={16} /> Add New Group
                </button>
            </div>
        </div>
      ) : (
        /* Edit Mode */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px', display: 'flex', gap: '10px' }}>
                 {profiles.map((p, index) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveProfileId(p.id)}
                      style={{
                        padding: '8px 16px', borderRadius: '12px', border: 'none', whiteSpace: 'nowrap',
                        background: activeProfileId === p.id ? 'var(--accent)' : 'var(--surface)',
                        color: activeProfileId === p.id ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        opacity: index < 5 ? 1 : 0.7
                      }}
                    >
                      {index < 5 ? `#${index+1} ` : ''}{p.name}
                    </button>
                 ))}
             </div>

             {activeProfile && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', background: 'var(--surface)', borderRadius: '12px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', width: '80px' }}>Name:</span>
                        <input 
                          type="text" 
                          value={activeProfile.name} 
                          onChange={e => handleNameChange(e.target.value)}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: 'var(--text-primary)' }}
                        />
                        <button 
                          onClick={(e) => handleDeleteProfile(activeProfile.id, e)}
                          style={{ color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
                          title="Delete Group"
                        >
                          <Trash2 size={20} />
                        </button>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rows:</span>
                            <input type="number" min="1" max="8" value={activeProfile.rows || 3} onChange={e => { const val = parseInt(e.target.value) || 3; setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, rows: val } : p)); }} style={{ width: '60px', padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: 'var(--text-primary)' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cols:</span>
                            <input type="number" min="1" max="8" value={activeProfile.cols || 3} onChange={e => { const val = parseInt(e.target.value) || 3; setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, cols: val } : p)); }} style={{ width: '60px', padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: 'var(--text-primary)' }} />
                        </div>
                    </div>
                  </div>
                  <GridEditor buttons={activeProfile.buttons} rows={activeProfile.rows} cols={activeProfile.cols} onUpdate={handleUpdateButtons} />
                </div>
             )}
        </div>
      )}
    </div>
  );
};
