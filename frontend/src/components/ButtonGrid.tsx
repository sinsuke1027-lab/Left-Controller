'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import styles from './ButtonGrid.module.css';

export interface ButtonConfig {
    id: string;
    label: string;
    icon: string;
    action: string;
    params: any[];
    colSpan?: number;
    rowSpan?: number;
    backgroundColor?: string;
    isPlaceholder?: boolean;
}

interface ButtonGridProps {
    buttons: ButtonConfig[];
    rows?: number;
    cols?: number;
    onPress: (btn: ButtonConfig) => void;
    onDelete?: (id: string) => void;
}

// Helper to convert kebab-case or snake_case to PascalCase for Icon names
const toPascalCase = (str: string) => {
    return str
        .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
        .replace(/^\w/, (c) => c.toUpperCase());
};

export const ButtonGrid: React.FC<ButtonGridProps> = ({ buttons, rows = 3, cols = 3, onPress, onDelete }) => {
    return (
        <div className={styles.container}>
            <div 
                className={styles.grid}
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                } as React.CSSProperties}
            >
                {buttons.map((btn) => {
                    const iconName = toPascalCase(btn.icon);
                    // @ts-ignore: Dynamic access
                    const Icon = Icons[iconName] || Icons.HelpCircle; 
                    
                    return (
                        <div
                            key={btn.id}
                            className={`${styles.button} ${btn.isPlaceholder ? styles.placeholder : ''}`}
                            onClick={() => onPress(btn)}
                            style={{
                                gridColumn: `span ${btn.colSpan || 1}`,
                                gridRow: `span ${btn.rowSpan || 1}`,
                                backgroundColor: btn.backgroundColor || 'var(--surface)',
                                position: 'relative'
                            }}
                        >
                            {!btn.isPlaceholder && <Icon className={styles.icon} />}
                            <span className={styles.label}>{btn.label}</span>
                            
                            {onDelete && !btn.isPlaceholder && (
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this button?")) {
                                            onDelete(btn.id);
                                        }
                                    }}
                                    className={styles.deleteBadge}
                                >
                                    <Icons.X size={12} color="#fff" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
