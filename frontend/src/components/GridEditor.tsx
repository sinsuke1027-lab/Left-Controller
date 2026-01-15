'use client';

import React, { useState } from 'react';
import { ButtonConfig } from './ButtonGrid';
import { ButtonEditor } from './ButtonEditor';
import styles from './ButtonGrid.module.css';
import * as Icons from 'lucide-react';

// DnD Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GridEditorProps {
  buttons: ButtonConfig[];
  rows?: number;
  cols?: number;
  onUpdate: (buttons: ButtonConfig[]) => void;
}

// Format Icon Name Helper
const toPascalCase = (str: string) => {
    return str
        .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
        .replace(/^\w/, (c) => c.toUpperCase());
};

// Sortable Item Component
const SortableGridItem = ({ btn, onPress, onDelete }: { btn: ButtonConfig, onPress: (b:any)=>void, onDelete: (id:string)=>void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: btn.id, disabled: btn.isPlaceholder });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${btn.colSpan || 1}`,
        gridRow: `span ${btn.rowSpan || 1}`,
        backgroundColor: btn.backgroundColor || 'var(--surface)',
        position: 'relative' as const,
        zIndex: isDragging ? 2 : 1,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Important for touch dnd
        aspectRatio: (btn.colSpan || 1) === 1 && (btn.rowSpan || 1) === 1 ? '1 / 1' : 'auto'
    };

    const iconName = toPascalCase(btn.icon);
    // @ts-ignore
    const Icon = Icons[iconName] || Icons.HelpCircle;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${styles.button} ${btn.isPlaceholder ? styles.placeholder : ''}`}
            onClick={() => onPress(btn)}
        >
            {!btn.isPlaceholder && <Icon className={styles.icon} />}
            <span className={styles.label}>{btn.label}</span>
            
            {onDelete && !btn.isPlaceholder && (
                <div 
                    onClick={(e) => {
                         e.stopPropagation(); // Avoid triggering edit
                         onDelete(btn.id); // Triggers parent confirmation UI
                    }}
                    onPointerDown={e => e.stopPropagation()} // Prevent drag start on delete
                    className={styles.deleteBadge}
                >
                    <Icons.X size={12} color="#fff" />
                </div>
            )}
        </div>
    );
};



export const GridEditor: React.FC<GridEditorProps> = ({ buttons, rows = 3, cols = 3, onUpdate }) => {
  const [editingBtn, setEditingBtn] = useState<ButtonConfig | null>(null);
  const [deletingBtnId, setDeletingBtnId] = useState<string | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  // Combined display list
  const displayButtons = [...buttons, ...placeholders];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = buttons.findIndex(b => b.id === active.id);
      const newIndex = buttons.findIndex(b => b.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
          onUpdate(arrayMove(buttons, oldIndex, newIndex));
      }
    }
  };

  const handleButtonPress = (btn: ButtonConfig) => {
    if (btn.isPlaceholder) {
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

  const requestDeleteButton = (btnId: string) => {
      setDeletingBtnId(btnId); // Open confirmation
  };

  const confirmDeleteButton = () => {
      if (deletingBtnId) {
          onUpdate(buttons.filter(b => b.id !== deletingBtnId));
          setDeletingBtnId(null);
          setEditingBtn(null); // Close editor if open
      }
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Drag to Reorder. Tap to Edit.</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Usage: {usedCells} / {totalCells}</p>
      </div>

      <div style={{ width: '100%', position: 'relative', opacity: (editingBtn || deletingBtnId) ? 0.3 : 1, transition: 'opacity 0.3s' }}>
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
        >
            <div 
                className={styles.grid} // Reusing CSS Grid layout
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                } as React.CSSProperties}
            >
                <SortableContext 
                    items={buttons.map(b => b.id)} 
                    strategy={rectSortingStrategy}
                >
                    {displayButtons.map(btn => (
                        <SortableGridItem 
                            key={btn.id} 
                            btn={btn} 
                            onPress={handleButtonPress} 
                            onDelete={requestDeleteButton} 
                        />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
      </div>

      {/* Editor Modal */}
      {editingBtn && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)'
        }}>
          <ButtonEditor 
            button={editingBtn} 
            onSave={handleSaveButton} 
            onDelete={() => requestDeleteButton(editingBtn.id)}
            onCancel={() => setEditingBtn(null)} 
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBtnId && (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            zIndex: 1100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)'
        }}>
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', width: '300px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Confirm Remove</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Are you sure you want to remove this button?</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => setDeletingBtnId(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={confirmDeleteButton} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Remove</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
