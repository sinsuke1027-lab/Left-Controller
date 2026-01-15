'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { ButtonConfig } from './ButtonGrid';
import presetData from '../data/preset_library.json';

interface ButtonEditorProps {
  button: ButtonConfig;
  onSave: (btn: ButtonConfig) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

const ACTION_TYPES = [
  { value: 'hotkey', label: 'Shortcut (Hotkey)' },
  { value: 'press', label: 'Key Press' },
  { value: 'type', label: 'Type Text' },
  { value: 'open_url', label: 'Open URL' },
  { value: 'open_app', label: 'Open App' },
  { value: 'system', label: 'System Action' },
];

export const ButtonEditor: React.FC<ButtonEditorProps> = ({ button, onSave, onDelete, onCancel }) => {
  // State for Editor (Right Column)
  const [label, setLabel] = useState(button.label);
  const [action, setAction] = useState(button.action);
  const [params, setParams] = useState(button.params.join(', '));
  const [icon, setIcon] = useState(button.icon);
  const [colSpan, setColSpan] = useState(button.colSpan || 1);
  const [rowSpan, setRowSpan] = useState(button.rowSpan || 1);
  const [backgroundColor, setBackgroundColor] = useState(button.backgroundColor || 'var(--surface)');

  // State for Library (Left Column)
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('system'); // Default open first
  const [filteredCategories, setFilteredCategories] = useState(presetData.categories);

  // Icon picking
  const [iconSearch, setIconSearch] = useState('');
  const iconList = Object.keys(Icons).filter(name => 
    name.toLowerCase().includes(iconSearch.toLowerCase())
  ).slice(0, 40);

  // Filter logic
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCategories(presetData.categories);
      return;
    }
    const lowerQ = searchQuery.toLowerCase();
    const filtered = presetData.categories.map(cat => ({
      ...cat,
      presets: cat.presets.filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.description.toLowerCase().includes(lowerQ)
      )
    })).filter(cat => cat.presets.length > 0);
    setFilteredCategories(filtered);
    if (filtered.length > 0) setExpandedCategory(filtered[0].id);
  }, [searchQuery]);

  const handleApplyPreset = (preset: any) => {
    setLabel(preset.name);
    setIcon(preset.icon);
    setAction(preset.action);
    setParams(preset.params.join(', '));
  };

  const handleCustomAction = (type: 'url' | 'app') => {
    if (type === 'url') {
      setLabel('New Link');
      setIcon('Link');
      setAction('open_url');
      setParams('https://');
    } else {
      setLabel('New App');
      setIcon('AppWindow');
      setAction('open_app');
      setParams('/Applications/App.app');
    }
  };

  const handleSave = () => {
    const paramsArray = params.split(',').map(p => p.trim());
    onSave({
      ...button,
      label,
      action,
      params: paramsArray,
      icon,
      colSpan,
      rowSpan,
      backgroundColor
    });
  };

  // @ts-ignore
  const CurrentIcon = Icons[icon] || Icons.HelpCircle;

  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      padding: '20px',
      background: 'var(--surface)',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      width: '900px',
      maxWidth: '95vw',
      height: '80vh',
      overflow: 'hidden'
    }}>
      {/* LEFT COLUMN: LIBRARY */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        borderRight: '1px solid rgba(255,255,255,0.1)',
        paddingRight: '20px',
        overflow: 'hidden'
      }}>
        <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Master Library</h3>
        
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <Icons.Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search actions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          {filteredCategories.map(cat => (
            <div key={cat.id} style={{ marginBottom: '10px' }}>
              <button 
                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                style={{ 
                  width: '100%', padding: '10px', borderRadius: '8px', 
                  border: 'none', background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--text-primary)', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', fontWeight: 600
                }}
              >
                {/* @ts-ignore */}
                {Icons[cat.icon] && React.createElement(Icons[cat.icon], { size: 18 })}
                {cat.name}
                <div style={{ marginLeft: 'auto', opacity: 0.5 }}>
                   {expandedCategory === cat.id ? <Icons.ChevronUp size={16} /> : <Icons.ChevronDown size={16} />}
                </div>
              </button>
              
              {expandedCategory === cat.id && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginTop: '8px', padding: '0 4px' }}>
                  {cat.presets.map((preset: any) => (
                    <button
                      key={preset.name}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '10px', borderRadius: '8px', border: '1px solid transparent',
                        background: 'transparent', color: 'var(--text-secondary)',
                        textAlign: 'left', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {/* @ts-ignore */}
                      {Icons[preset.icon] && React.createElement(Icons[preset.icon], { size: 16 })}
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{preset.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Custom Section */}
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
             <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Custom Actions</h4>
             <div style={{ display: 'flex', gap: '10px' }}>
               <button onClick={() => handleCustomAction('url')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icons.Globe size={18} /> Open URL
               </button>
               <button onClick={() => handleCustomAction('app')} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icons.AppWindow size={18} /> Launch App
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: EDITOR */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>Button Preview</h3>
        
        {/* Preview */}
        <div style={{ 
          display: 'flex', justifyContent: 'center', marginBottom: '30px' 
        }}>
           <div style={{
             width: colSpan * 100 + 'px',
             height: rowSpan * 100 + 'px',
             maxWidth: '200px',
             background: 'var(--surface)',
             boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
             borderRadius: '16px',
             display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
             gap: '8px',
             border: '1px solid rgba(255,255,255,0.1)',
             color: '#fff'
           }}>
              <CurrentIcon size={32} />
              <span style={{ fontWeight: 600 }}>{label}</span>
           </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Label</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: '#fff' }} />
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Action Type</label>
             <select value={action} onChange={e => setAction(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: '#fff' }}>
                {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
             </select>
          </div>

           <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
               {action === 'open_url' ? 'URL' : action === 'open_app' ? 'App Path / Name' : 'Parameters (comma separated)'}
            </label>
            <input type="text" value={params} onChange={e => setParams(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: '#fff' }} 
              placeholder={action === 'open_url' ? 'https://example.com' : 'e.g. calculator.exe'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Icon</label>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ padding: '8px', background: 'var(--background)', borderRadius: '8px' }}><CurrentIcon size={20} /></div>
                <input type="text" placeholder="Search icons..." value={iconSearch} onChange={e => setIconSearch(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: '#fff' }} />
             </div>
             <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {iconList.map(name => {
                  // @ts-ignore
                  const I = Icons[name];
                  return (
                    <button key={name} onClick={() => setIcon(name)} style={{ padding: '6px', borderRadius: '6px', background: icon===name?'var(--accent)':'transparent', border: 'none', cursor: 'pointer', color: icon===name?'#fff':'var(--text-secondary)' }}>
                      <I size={18} />
                    </button>
                  )
                })}
             </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Size</label>
             <div style={{ display: 'flex', gap: '8px' }}>
               {[{l:'1x1',c:1,r:1},{l:'2x1',c:2,r:1},{l:'1x2',c:1,r:2},{l:'2x2',c:2,r:2}].map(s => (
                 <button key={s.l} onClick={()=>{setColSpan(s.c);setRowSpan(s.r)}} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: colSpan===s.c&&rowSpan===s.r ? '1px solid var(--accent)' : '1px solid transparent', background: 'var(--background)', color: colSpan===s.c&&rowSpan===s.r ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}>{s.l}</button>
               ))}
             </div>
          </div>

        </div>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
           {onDelete && (
             <button 
               type="button"
               onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 onDelete(button.id); // Parent handles confirmation
               }} 
               style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #f87171', background: 'transparent', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
             >
               <Icons.Trash2 size={16} /> Remove
             </button>
           )}
           <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
             <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
           </div>
        </div>

      </div>
    </div>
  );
};
