'use client';

import React, { useState } from 'react';
import { ButtonConfig } from './ButtonGrid';
import { ButtonGrid as GridDisplay } from './ButtonGrid';
import { ButtonEditor } from './ButtonEditor';

interface GridEditorProps {
  buttons: ButtonConfig[];
  rows?: number;
  cols?: number;
  onUpdate: (buttons: ButtonConfig[]) => void;
}

export const GridEditor: React.FC<GridEditorProps> = ({ buttons, rows = 3, cols = 3, onUpdate }) => {
  const [editingBtn, setEditingBtn] = useState<ButtonConfig | null>(null);

  // Calculate grid usage
  const totalCells = rows * cols;
  const usedCells = buttons.reduce((acc, btn) => acc + ((btn.colSpan || 1) * (btn.rowSpan || 1)), 0);
  const isOverflow = usedCells > totalCells;

  // Generate placeholders
  const placeholders: ButtonConfig[] = [];
  if (!isOverflow && usedCells < totalCells) {
      const remaining = totalCells - usedCells;
      for (let i = 0; i < remaining; i++) {
          placeholders.push({
              id: `placeholder_${i}`,
              label: '+',
              icon: 'plus',
              action: 'placeholder',
              params: [],
              isPlaceholder: true
          });
      }
  }

  const displayButtons = [...buttons, ...placeholders];

  const handleButtonPress = (btn: ButtonConfig) => {
    if (btn.isPlaceholder) {
        // Create new button
        const newBtn: ButtonConfig = {
            id: `btn_${Date.now()}`,
            label: 'New Btn',
            icon: 'square',
            action: 'press',
            params: [],
            colSpan: 1,
            rowSpan: 1
        };
        onUpdate([...buttons, newBtn]);
        setEditingBtn(newBtn);
    } else {
        setEditingBtn(btn);
    }
  };

  const handleSaveButton = (updatedBtn: ButtonConfig) => {
    const newButtons = buttons.map(b => b.id === updatedBtn.id ? updatedBtn : b);
    onUpdate(newButtons);
    setEditingBtn(null);
  };

  const handleDeleteButton = (btnId: string) => {
      onUpdate(buttons.filter(b => b.id !== btnId));
      setEditingBtn(null);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      
      {isOverflow && (
          <div style={{ 
              padding: '12px 20px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid #ef4444', 
              borderRadius: '8px', 
              color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: '8px'
          }}>
              <span>⚠️ Grid Overflow! Total size exceeds {rows}x{cols}. Please resize or remove buttons.</span>
          </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tap a button to edit. Tap '+' to add.</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Usage: {usedCells} / {totalCells}</p>
      </div>

      <div style={{ width: '100%', position: 'relative', opacity: editingBtn ? 0.3 : 1, transition: 'opacity 0.3s' }}>
        <GridDisplay 
            buttons={displayButtons} 
            rows={rows} 
            cols={cols} 
            onPress={handleButtonPress} 
            onDelete={handleDeleteButton}
        />
      </div>

      {editingBtn && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)'
        }}>
          <ButtonEditor 
            button={editingBtn} 
            onSave={handleSaveButton} 
            onCancel={() => setEditingBtn(null)} 
          />
        </div>
      )}
    </div>
  );
};
