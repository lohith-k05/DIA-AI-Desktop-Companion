import React from "react";
import type { CharacterActivity } from "../../types/character";
import "./VoiceVisualizer.css";

interface VoiceVisualizerProps {
  activity: CharacterActivity;
  isListening: boolean;
  isSpeaking: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  activity,
  isListening,
  isSpeaking,
}) => {
  return (
    <div className={`dia-voice-visualizer activity-${activity}`}>
      {/* Outer Atmospheric Pulse Rings */}
      <div className="vis-ring vis-ring-1" />
      <div className="vis-ring vis-ring-2" />
      <div className="vis-ring vis-ring-3" />

      {/* Audio Wave Frequency Bars when speaking */}
      {isSpeaking && (
        <div className="speech-freq-bars">
          <span className="bar bar-1" />
          <span className="bar bar-2" />
          <span className="bar bar-3" />
          <span className="bar bar-4" />
          <span className="bar bar-5" />
          <span className="bar bar-6" />
          <span className="bar bar-7" />
        </div>
      )}

      {/* Listening Wave Emitter */}
      {isListening && (
        <div className="listening-sonar-ring" />
      )}
    </div>
  );
};
