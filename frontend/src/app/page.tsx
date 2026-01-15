'use client';

import { useEffect, useState } from 'react';
import { ButtonGrid, ButtonConfig } from '@/components/ButtonGrid';
import { Dashboard } from '@/components/Dashboard';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from '@/components/Tabs.module.css';

interface Profile {
  id: string;
  name: string;
  buttons: ButtonConfig[];
}

import { Settings } from 'lucide-react';
import { SettingsOverlay } from '@/components/SettingsOverlay';

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const { isConnected, sendMessage, systemStatus } = useWebSocket(8002);

  useEffect(() => {
    const fetchConfig = async () => {
      console.log("Starting fetchConfig...");
      try {
        const protocol = window.location.protocol;
        const host = window.location.hostname;
        const url = `${protocol}//${host}:8002/config`;
        console.log("Fetching from:", url);

        const res = await fetch(url);
        console.log("Response status:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("Config data received:", data);

          if (data.profiles && Array.isArray(data.profiles)) {
            console.log("Found profiles:", data.profiles.length);
            setProfiles(data.profiles);
            if (data.profiles.length > 0) {
              console.log("Setting active profile to:", data.profiles[0].id);
              setActiveProfileId(data.profiles[0].id);
            }
          } 
          else if (data.buttons) {
             console.log("Found legacy buttons");
             setProfiles([{ id: 'default', name: 'Home', buttons: data.buttons }]);
             setActiveProfileId('default');
          } else {
            console.warn("Unexpected config structure:", data);
          }
        } else {
          console.error("Fetch failed with status:", res.status);
        }
      } catch (e) {
        console.error("Error fetching config:", e);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveConfig = async (newProfiles: Profile[]) => {
    try {
      setProfiles(newProfiles);
      // Construct full config object matching backend structure
      const configToSave = { profiles: newProfiles };
      
      const protocol = window.location.protocol;
      const host = window.location.hostname;
      const res = await fetch(`${protocol}//${host}:8002/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      });
      
      if (!res.ok) {
        alert('Failed to save settings');
      }
    } catch (e) {
      console.error('Error saving config:', e);
      alert('Error saving settings');
    }
  };

  const handlePress = (btn: ButtonConfig) => {
    if (isConnected) {
      sendMessage({ action: btn.action, params: btn.params });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
        console.warn("Not connected");
    }
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  console.log("Render state:", { profilesCount: profiles.length, activeId: activeProfileId, hasActive: !!activeProfile });

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '1rem',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <header style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 1rem 1rem 1rem'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Left Device</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            backgroundColor: isConnected ? 'rgba(0,255,100,0.1)' : 'rgba(255,50,50,0.1)',
            color: isConnected ? '#4ade80' : '#f87171',
            border: `1px solid ${isConnected ? 'rgba(0,255,100,0.2)' : 'rgba(255,50,50,0.2)'}`
          }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
            }}
          >
            <Settings size={24} />
          </button>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className={styles.tabsContainer}>
        {profiles.slice(0, 5).map(profile => (
          <button
            key={profile.id}
            className={`${styles.tab} ${activeProfileId === profile.id ? styles.active : ''}`}
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
