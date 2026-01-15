'use client';

import { useEffect, useState } from 'react';
import { ButtonGrid, ButtonConfig } from '@/components/ButtonGrid';
import { Dashboard } from '@/components/Dashboard';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from '@/components/Tabs.module.css';
import { Settings, Plus, Monitor, ChevronDown, Trash2, Copy, Save } from 'lucide-react';
import { SettingsOverlay } from '@/components/SettingsOverlay';
import initialDevices from '@/data/devices.json';
import initialTemplates from '@/data/templates.json';

interface Profile {
  id: string;
  name: string;
  buttons: ButtonConfig[];
  rows?: number;
  cols?: number;
}

interface Device {
  id: string;
  name: string;
  host: string;
  port: number;
  os: 'mac' | 'windows' | 'linux';
  themeColor?: string;
  profiles: Profile[]; // Store profiles directly on the device (Tablet Master)
}

interface Template {
  id: string;
  name: string;
  os: string;
  profiles: Profile[];
}

const THEME_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Mono', value: '#64748b' },
];

export default function Home() {
  // Device Management State
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  
  // Template State
  const [templates, setTemplates] = useState<Template[]>(initialTemplates as Template[]);
  
  // New Device Form State
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceHost, setNewDeviceHost] = useState('');
  const [newDeviceColor, setNewDeviceColor] = useState(THEME_COLORS[0].value);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // UI State
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Derived Active Device
  const activeDevice = devices.find(d => d.id === activeDeviceId);
  const targetHost = activeDevice?.host || 'localhost';
  const targetPort = activeDevice?.port || 8002;

  // Use profiles directly from the active device (Tablet Master Architecture)
  const profiles = activeDevice?.profiles || [];

  // WebSocket Connection
  const { isConnected, sendMessage, systemStatus, reconnect } = useWebSocket(targetHost, targetPort);

  // Load Devices and Templates on Mount
  useEffect(() => {
    // 1. Load Devices from LocalStorage
    const savedDevicesStr = localStorage.getItem('devices');
    let loadedDevices: Device[] = [];

    if (savedDevicesStr) {
      try {
        const parsed = JSON.parse(savedDevicesStr);
        // Migration Check: Ensure all loaded devices have a 'profiles' array
        loadedDevices = parsed.map((d: any) => ({
             ...d,
             profiles: Array.isArray(d.profiles) ? d.profiles : [] // Initialize if missing
        }));
      } catch(e) { console.error("Failed to parse devices", e); }
    } else {
        // Init with default if empty
        loadedDevices = (initialDevices as any[]).map(d => ({ ...d, profiles: [] }));
    }

    // 2. Initial Migration: Retrieve config from Backend if LocalStorage has empty profiles for a device
    // This supports transitioning from the old architecture to Tablet Master
    const migrateConfigs = async () => {
         const updatedDevices = [...loadedDevices];
         let dataChanged = false;

         for (let i = 0; i < updatedDevices.length; i++) {
             if (updatedDevices[i].profiles.length === 0) {
                 console.log(`[Migration] Fetching config for ${updatedDevices[i].name} from ${updatedDevices[i].host}...`);
                 try {
                     const protocol = window.location.protocol;
                     const res = await fetch(`${protocol}//${updatedDevices[i].host}:${updatedDevices[i].port}/config`);
                     if (res.ok) {
                         const data = await res.json();
                         if (data.profiles && Array.isArray(data.profiles)) {
                             updatedDevices[i].profiles = data.profiles;
                             dataChanged = true;
                         }
                     }
                 } catch (e) {
                     console.warn(`[Migration] Could not fetch config for ${updatedDevices[i].name}. It will start empty.`);
                 }
             }
         }

         setDevices(updatedDevices);
         if (updatedDevices.length > 0 && !activeDeviceId) {
             setActiveDeviceId(updatedDevices[0].id);
         }
         
         // Set initial active profile for the first device
         if (updatedDevices.length > 0 && updatedDevices[0].profiles.length > 0) {
             setActiveProfileId(updatedDevices[0].profiles[0].id);
         }
    };
    
    migrateConfigs();

    // 3. Load Templates
    const savedTemplates = localStorage.getItem('templates');
    if (savedTemplates) {
      setTemplates([...(initialTemplates as Template[]), ...JSON.parse(savedTemplates)]);
    }
  }, []);

  // Sync Active Profile Logic
  // When switching devices, ensure we have a valid activeProfileId for the new device
  useEffect(() => {
     if (activeDevice && activeDevice.profiles.length > 0) {
         // If current activeProfileId doesn't exist in this device, switch to first one
         const exists = activeDevice.profiles.find(p => p.id === activeProfileId);
         if (!exists) {
             setActiveProfileId(activeDevice.profiles[0].id);
         }
     } else {
         setActiveProfileId('');
     }
  }, [activeDeviceId, devices]); // check on device switch or Update

  // Save Devices to LocalStorage whenever they change (Tablet Master Persistence)
  useEffect(() => {
    if (devices.length > 0) {
      localStorage.setItem('devices', JSON.stringify(devices));
    }
  }, [devices]);

  // Save Templates Effect
  useEffect(() => {
    if (templates.length > initialTemplates.length) {
      const userTemplates = templates.filter(t => !t.id.startsWith('template-'));
      localStorage.setItem('templates', JSON.stringify(userTemplates));
    }
  }, [templates]);


  const handleAddDevice = async () => {
    if (!newDeviceName || !newDeviceHost) return;
    
    let initialProfiles: Profile[] = [];

    // Apply Template if selected
    if (selectedTemplateId) {
      if (selectedTemplateId === 'clone-current') {
          // Clone Active Device's profiles
          if (activeDevice) {
              initialProfiles = JSON.parse(JSON.stringify(activeDevice.profiles));
          }
      } else {
          // Clone from Template
          const template = templates.find(t => t.id === selectedTemplateId);
          if (template) {
              initialProfiles = JSON.parse(JSON.stringify(template.profiles));
          }
      }
    }

    const newDevice: Device = {
      id: Date.now().toString(),
      name: newDeviceName,
      host: newDeviceHost,
      port: 8002,
      os: 'windows', // Default to windows for new devices usually
      themeColor: newDeviceColor,
      profiles: initialProfiles
    };

    const newDevicesList = [...devices, newDevice];
    setDevices(newDevicesList);
    setActiveDeviceId(newDevice.id);
    
    // Reset Form
    setNewDeviceName('');
    setNewDeviceHost('');
    setNewDeviceColor(THEME_COLORS[0].value);
    setSelectedTemplateId('');
    setShowAddDevice(false);
    setShowDeviceMenu(false);
  };

  const handleDeleteDevice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this device?')) {
      const filtered = devices.filter(d => d.id !== id);
      setDevices(filtered);
      if (activeDeviceId === id && filtered.length > 0) {
        setActiveDeviceId(filtered[0].id);
      }
    }
  };

  const handleSaveAsTemplate = () => {
    if (!activeDevice) return;
    const name = prompt("Enter a name for this template:");
    if (name) {
      const newTemplate: Template = {
        id: Date.now().toString(),
        name,
        os: activeDevice.os,
        profiles: JSON.parse(JSON.stringify(activeDevice.profiles)) // Deep copy
      };
      setTemplates([...templates, newTemplate]);
      alert("Template saved!");
    }
  };

  // Update Profiles in Local State (Tablet Master)
  // No longer POSTs to backend for persistence.
  const handleSaveConfig = async (newProfiles: Profile[]) => {
      if (!activeDeviceId) return;
      
      // 1. Update Frontend State (Tablet Master)
      const updatedDevices = devices.map(d => {
          if (d.id === activeDeviceId) {
              return { ...d, profiles: newProfiles };
          }
          return d;
      });
      setDevices(updatedDevices);
      // LocalStorage update is handled by useEffect

      // 2. Persist to Backend (for "Sync" capability and legacy compatibility)
      // Only do this if we are editing the device that corresponds to the simple "backend" concept
      // (For now, we assume activeDevice matches targetHost)
      try {
        const protocol = window.location.protocol;
        await fetch(`${protocol}//${targetHost}:${targetPort}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profiles: newProfiles })
        });
      } catch (e) {
          console.warn("Could not sync config to backend (offline?)");
      }
  };

  // Command Execution Handler with OS Transformation
  const handlePress = (btn: ButtonConfig) => {
    if (isConnected && activeDevice) {
        let finalParams = btn.params;
        const targetOS = activeDevice.os;

        // OS-Aware Shortcut Mapping
        if (btn.action === 'hotkey') {
             // Basic naive mapping: Swap 'command' <-> 'ctrl' based on target
             // Ideally this should be more robust, but this serves the 80% case.
             const keys = btn.params;
             if (targetOS === 'windows') {
                 // Convert Mac-style to Windows
                 finalParams = keys.map((k: string) => {
                     if (k.toLowerCase() === 'command' || k.toLowerCase() === 'cmd' || k.toLowerCase() === 'meta') return 'ctrl';
                     return k;
                 });
             } else if (targetOS === 'mac') {
                 // Convert Windows-style to Mac 
                 // (Note: 'ctrl' on Windows often maps to 'cmd' on Mac for common shortcuts like C/V/Z)
                 // But for some valid ctrl-shortcuts (Ctrl-C in terminal), this might be aggressive.
                 // We will assume standard GUI shortcuts for now.
                 finalParams = keys.map((k: string) => {
                     if (k.toLowerCase() === 'ctrl' || k.toLowerCase() === 'control') return 'command';
                     // 'alt' -> 'option' is usually handled by libraries, but we can explicit if needed
                     return k;
                 });
             }
        }

      sendMessage({ action: btn.action, params: finalParams });
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  // Determine Theme Mode
  const getThemeMode = (color: string) => {
      if (color === '#3b82f6') return 'win'; // Blue = Work/Win
      if (color === '#ef4444') return 'game'; // Red = Gaming
      return 'mac'; // Default Silver/Dark
  };

  // Find Active Profile Object
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const themeColor = activeDevice?.themeColor || '#3b82f6';
  const themeMode = getThemeMode(themeColor);

  return (
    <main 
      data-theme={themeMode}
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        padding: '1rem', minHeight: '100vh', width: '100%', maxWidth: '800px', margin: '0 auto',
        position: 'relative'
      }}
    >
       {/* Ambient Background Animation */}
       <div style={{
          position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 30%, var(--accent-glow) 0%, transparent 60%)',
          animation: 'breathe 8s ease-in-out infinite'
       }} />
      {/* HEADER WITH DEVICE SELECTOR */}
      <header 
        className="glass-panel"
        style={{ 
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 1rem 1rem 1rem', position: 'relative', zIndex: 100,
          borderRadius: '0 0 24px 24px', borderTop: 'none',
          marginBottom: '24px'
        }}
      >
        
        {/* Device Selector */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '12px 12px 0 0',
              background: showDeviceMenu ? 'var(--surface)' : 'transparent', 
              borderTop: showDeviceMenu ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              borderLeft: showDeviceMenu ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              borderRight: showDeviceMenu ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              borderBottom: 'none',
              color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            <div style={{
              width: '12px', height: '12px', borderRadius: '50%',
              backgroundColor: isConnected ? '#4ade80' : '#f87171',
              boxShadow: isConnected ? '0 0 10px #4ade80' : 'none'
            }} />
            {activeDevice?.name || 'No Device'}
            <ChevronDown size={16} style={{ opacity: 0.5 }} />
          </button>

          {/* Dropdown Menu */}
          {showDeviceMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0,
              width: '320px',
              background: 'var(--surface)', borderRadius: '0 16px 16px 16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '8px' }}>
                {/* Connection Status Section with Reconnect Button */}
                {!isConnected && (
                    <div style={{ 
                        padding: '12px', marginBottom: '8px', borderRadius: '8px', 
                        background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: '#f87171' }}>Disconnected</div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); reconnect(); setShowDeviceMenu(false); }}
                            style={{ 
                                padding: '6px 12px', background: '#f87171', color: '#fff', 
                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
                            }}
                        >
                            Reconnect
                        </button>
                    </div>
                )}

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>MY COMPUTERS</span>
                  <span style={{ fontSize: '0.7em', color: themeColor }}>ACTIVE: {activeDevice?.name}</span>
                </div>
                {devices.map(device => (
                  <div 
                    key={device.id}
                    onClick={() => { setActiveDeviceId(device.id); setShowDeviceMenu(false); }}
                    style={{
                      padding: '12px', borderRadius: '8px', cursor: 'pointer',
                      background: activeDeviceId === device.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      color: '#fff', borderLeft: `4px solid ${device.themeColor || '#3b82f6'}`
                    }}
                  >
                    <Monitor size={18} />
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 500 }}>{device.name}</div>
                       <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{device.host}</div>
                    </div>
                    {devices.length > 1 && (
                      <div style={{ display: 'flex' }}>
                         <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               setNewDeviceName(`${device.name} Copy`);
                               setNewDeviceHost(device.host);
                               setNewDeviceColor(device.themeColor || THEME_COLORS[0].value);
                               setSelectedTemplateId(activeDeviceId === device.id ? 'clone-current' : ''); 
                               setShowAddDevice(true);
                               setShowDeviceMenu(false);
                            }} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
                            title="Duplicate Device Config"
                          >
                           <Copy size={16} />
                         </button>
                         <button onClick={(e) => handleDeleteDevice(device.id, e)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px' }}>
                           <Trash2 size={16} />
                         </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '8px', display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setShowAddDevice(true)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  <Plus size={16} /> Add Computer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Settings */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
             onClick={handleSaveAsTemplate}
             title="Save current layout as template"
             style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <Copy size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <Settings size={24} />
          </button>
        </div>

      </header>

      {/* ADD DEVICE MODAL */}
      {showAddDevice && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface)', padding: '24px', borderRadius: '16px',
            width: '90%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#fff' }}>Add New Computer</h3>
            
            <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Name & Color</label>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <input 
                   type="text" placeholder="Friendly Name (e.g. Office PC)" 
                   value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)}
                   style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: '#fff' }}
                 />
                 <div style={{ display: 'flex', gap: '4px', background: 'var(--background)', padding: '4px', borderRadius: '8px', alignItems: 'center' }}>
                    {THEME_COLORS.map(c => (
                      <button 
                        key={c.value} 
                        onClick={() => setNewDeviceColor(c.value)}
                        style={{ 
                          width: '24px', height: '24px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          background: c.value, transform: newDeviceColor === c.value ? 'scale(1.2)' : 'scale(1)',
                          boxShadow: newDeviceColor === c.value ? `0 0 8px ${c.value}` : 'none'
                        }}
                        title={c.name}
                      />
                    ))}
                 </div>
               </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Network Address</label>
               <input 
                  type="text" placeholder="IP Address (e.g. 192.168.1.15)" 
                  value={newDeviceHost} onChange={e => setNewDeviceHost(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: '#fff' }}
               />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Initialize Layout</label>
              <select 
                value={selectedTemplateId} 
                onChange={e => setSelectedTemplateId(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--background)', color: '#fff' }}
              >
                <option value="">Start Empty</option>
                <option value="clone-current">👯 Clone Current Device ({activeDevice?.name})</option>
                <option disabled>--- Templates ---</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>📄 {t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddDevice(false)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddDevice} style={{ padding: '10px 20px', background: themeColor, color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Create Device</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className={styles.tabsContainer} style={{ borderColor: themeColor }}>
        {profiles.slice(0, 5).map(profile => (
          <button
            key={profile.id}
            className={`${styles.tab} ${activeProfileId === profile.id ? styles.active : ''}`}
            style={activeProfileId === profile.id ? { color: themeColor, textShadow: `0 0 10px ${themeColor}40` } : {}}
            onClick={() => setActiveProfileId(profile.id)}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {/* System Monitoring Dashboard */}
      {isConnected && <Dashboard status={systemStatus} />}

      {activeProfile && (
        <ButtonGrid 
          buttons={activeProfile.buttons} 
          rows={activeProfile.rows} 
          cols={activeProfile.cols} 
          onPress={handlePress} 
        />
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <SettingsOverlay 
          initialProfiles={profiles} 
          onClose={() => setShowSettings(false)} 
          onSave={handleSaveConfig} 
        />
      )}
    </main>
  );
}
