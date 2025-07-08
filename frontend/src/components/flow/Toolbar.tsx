import React, { memo, useCallback } from 'react';
import { type NodeType } from '../../store/useFlowStore';

interface ToolbarProps {
  onAddNode: (type: NodeType) => void;
  onStateClick: () => void;
  onMemoryClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = memo(({ onAddNode, onStateClick, onMemoryClick }) => {
  const NodeButton = useCallback(({ type, label, icon, bgColor, textColor, hoverBgColor, hoverShadowColor }: {
    type: NodeType;
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    hoverBgColor: string;
    hoverShadowColor: string;
  }) => (
    <button 
      className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
      onClick={() => onAddNode(type)}
      title={`${label} Node`}
    >
      <div className={`p-3 rounded-full ${bgColor} ${hoverBgColor} transition-all duration-200 ${hoverShadowColor}`}>
        {icon}
      </div>
      <span className={`text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200`}>
        {label}
      </span>
      <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 ${textColor} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200`}></div>
    </button>
  ), [onAddNode]);

  const ActionButton = useCallback(({ 
    onClick, 
    label, 
    icon, 
    bgColor, 
    textColor, 
    hoverBgColor, 
    hoverShadowColor 
  }: {
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    hoverBgColor: string;
    hoverShadowColor: string;
  }) => (
    <button 
      className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
      onClick={onClick}
      title={label}
    >
      <div className={`p-3 rounded-full ${bgColor} ${hoverBgColor} transition-all duration-200 ${hoverShadowColor}`}>
        {icon}
      </div>
      <span className="text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200">
        {label}
      </span>
      <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 ${textColor} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200`}></div>
    </button>
  ), []);

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex items-center justify-center bg-gray-800/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gray-700/50">
        <NodeButton
          type="start"
          label="Start"
          icon={
            <svg className="w-5 h-5 text-emerald-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor="bg-emerald-500/20"
          textColor="bg-emerald-400"
          hoverBgColor="group-hover:bg-emerald-500/30"
          hoverShadowColor="group-hover:shadow-[0_0_15px_3px_rgba(52,211,153,0.3)]"
        />

        <NodeButton
          type="node"
          label="Node"
          icon={
            <svg className="w-5 h-5 text-blue-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 15 15">
              <path d="M4 6.25A2.25 2.25 0 016.25 4h3a2.25 2.25 0 012.25 2.25V7h3.25a.75.75 0 010 1.5H11.5v.75a2.25 2.25 0 01-2.25 2.25h-3A2.25 2.25 0 014 9.25V8.5H.75a.75.75 0 010-1.5H4v-.75zm6 0a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3z" />
            </svg>
          }
          bgColor="bg-blue-500/20"
          textColor="bg-blue-400"
          hoverBgColor="group-hover:bg-blue-500/30"
          hoverShadowColor="group-hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.3)]"
        />

        <NodeButton
          type="router"
          label="Router"
          icon={
            <svg className="w-5 h-5 text-cyan-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 16 16">
              <path xmlns="http://www.w3.org/2000/svg" d="M14.533 2.953H9.53a.493.493 0 0 0-.325.79l1.049 1.36.15.194L8 7.137l-2.403-1.84.15-.194 1.048-1.36a.493.493 0 0 0-.325-.79H1.467a.496.496 0 0 0-.434.683L2.276 8.39a.493.493 0 0 0 .847.113l.935-1.211.281-.366 2.638 2.02-.006 6.074a1.026 1.026 0 0 0 2.05 0l.007-6.078 2.632-2.016.282.366.934 1.211a.493.493 0 0 0 .847-.113l1.244-4.755a.496.496 0 0 0-.434-.683z"/>
            </svg>
          }
          bgColor="bg-cyan-500/20"
          textColor="bg-cyan-400"
          hoverBgColor="group-hover:bg-cyan-500/30"
          hoverShadowColor="group-hover:shadow-[0_0_15px_3px_rgba(6,182,212,0.3)]"
        />

        <NodeButton
          type="end"
          label="End"
          icon={
            <svg className="w-5 h-5 text-rose-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          }
          bgColor="bg-rose-500/20"
          textColor="bg-rose-400"
          hoverBgColor="group-hover:bg-rose-500/30"
          hoverShadowColor="group-hover:shadow-[0_0_15px_3px_rgba(244,63,94,0.3)]"
        />

        <div className="h-8 w-px bg-gray-600/50 mx-1"></div>

        <ActionButton
          onClick={onStateClick}
          label="State"
          icon={
            <svg className="w-5 h-5 text-amber-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
          bgColor="bg-amber-500/20"
          textColor="bg-amber-400"
          hoverBgColor="group-hover:bg-amber-500/30"
          hoverShadowColor="group-hover:shadow-[0_0_15px_3px_rgba(245,158,11,0.3)]"
        />

        <ActionButton
          onClick={onMemoryClick}
          label="Memory"
          icon={
            <svg className="w-5 h-5 text-purple-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14c0 1.656 4.03 3 9 3s9-1.344 9-3V5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0 1.656 4.03 3 9 3s9-1.344 9-3" />
            </svg>
          }
          bgColor="bg-purple-500/20"
          textColor="bg-purple-400"
          hoverBgColor="group-hover:bg-purple-500/30"
          hoverShadowColor="group-hover:shadow-[0_0_15px_3px_rgba(139,92,246,0.3)]"
        />
      </div>
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;
