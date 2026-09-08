import React from "react";
import { Heart, X } from "lucide-react";
import type { AppSettings } from "../../types/settings";

interface IntimateModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const IntimateModeModal: React.FC<IntimateModeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const toggleEnabled = () => {
    onUpdateSettings({ intimateModeEnabled: !settings.intimateModeEnabled });
  };

  return (
    <div className="dia-modal-overlay" onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
    }}>
      <div className="dia-modal-content" onClick={e => e.stopPropagation()} style={{
        background: "linear-gradient(145deg, #1A1325, #110C1A)",
        border: "1px solid rgba(255, 105, 180, 0.2)",
        borderRadius: "16px", width: "400px", padding: "24px",
        boxShadow: "0 8px 32px rgba(255, 105, 180, 0.15)",
        position: "relative"
      }}>
        <button className="dia-modal-close" onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#888", cursor: "pointer"
        }}>
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", color: "#FF69B4" }}>
          <Heart size={24} fill="#FF69B4" />
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>Intimate Mode</h2>
        </div>

        <p style={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "24px" }}>
          Give Dia a more affectionate, playful, and romantic personality.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", marginBottom: "20px" }}>
          <span style={{ fontWeight: 500 }}>Intimate Mode</span>
          <button 
            onClick={toggleEnabled}
            style={{
              padding: "6px 12px", borderRadius: "20px", border: "none",
              background: settings.intimateModeEnabled ? "#FF69B4" : "#333",
              color: "#fff", cursor: "pointer", fontWeight: 600, transition: "0.2s"
            }}
          >
            {settings.intimateModeEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div style={{ marginBottom: "20px", opacity: settings.intimateModeEnabled ? 1 : 0.5, pointerEvents: settings.intimateModeEnabled ? "auto" : "none" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#ccc", fontSize: "0.9rem" }}>Affection Level</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["gentle", "playful", "romantic"] as const).map(level => (
              <button
                key={level}
                onClick={() => onUpdateSettings({ intimateAffectionLevel: level })}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "6px", cursor: "pointer", textTransform: "capitalize",
                  background: settings.intimateAffectionLevel === level ? "rgba(255, 105, 180, 0.2)" : "transparent",
                  border: settings.intimateAffectionLevel === level ? "1px solid #FF69B4" : "1px solid #444",
                  color: settings.intimateAffectionLevel === level ? "#FF69B4" : "#888",
                  transition: "0.2s"
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px", opacity: settings.intimateModeEnabled ? 1 : 0.5, pointerEvents: settings.intimateModeEnabled ? "auto" : "none" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#ccc", fontSize: "0.9rem" }}>Voice Personality</label>
          <select 
            value={settings.intimateVoicePersonality}
            onChange={(e) => onUpdateSettings({ intimateVoicePersonality: e.target.value as any })}
            style={{
              width: "100%", padding: "10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)",
              border: "1px solid #444", color: "#fff", outline: "none", appearance: "none"
            }}
          >
            <option value="default">Default</option>
            <option value="warm">Warm & Soft</option>
            <option value="playful">Playful</option>
            <option value="romantic">Romantic</option>
          </select>
        </div>

        <p style={{ color: "#666", fontSize: "0.8rem", textAlign: "center", marginBottom: "20px" }}>
          Your settings are stored locally.
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", background: "transparent", border: "1px solid #555",
            borderRadius: "6px", color: "#ccc", cursor: "pointer"
          }}>Cancel</button>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", background: "#FF69B4", border: "none",
            borderRadius: "6px", color: "#fff", fontWeight: 600, cursor: "pointer"
          }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};
