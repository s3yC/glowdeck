'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useLayoutStore, usePreferenceStore, usePremiumStore } from '@/stores';
import type { GridConfig } from '@/types';
import { GRID_COLS, GRID_MARGIN, GRID_PADDING } from '@/lib/constants';

const SPACE_ICONS = ['🏠', '💼', '🎯', '🎮', '📚', '🎵', '🧘', '🌙'];

export function SpaceManager() {
  const spaces = useLayoutStore((s) => s.spaces);
  const activeSpaceId = usePreferenceStore((s) => s.activeSpaceId);
  const setActiveSpaceId = usePreferenceStore((s) => s.setActiveSpaceId);
  const setActiveSpace = useLayoutStore((s) => s.setActiveSpace);
  const createSpace = useLayoutStore((s) => s.createSpace);
  const deleteSpace = useLayoutStore((s) => s.deleteSpace);
  const updateSpace = useLayoutStore((s) => s.updateSpace);
  const canAccessFeature = usePremiumStore((s) => s.canAccessFeature);
  const isPremium = canAccessFeature('premium');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSwitchSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    setActiveSpace(spaceId);
  };

  const handleStartEdit = (spaceId: string, currentName: string) => {
    setEditingId(spaceId);
    setEditName(currentName);
  };

  const handleSaveEdit = (spaceId: string) => {
    if (editName.trim()) {
      updateSpace(spaceId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleCreateSpace = () => {
    if (!isPremium) return;

    const defaultGridConfig: GridConfig = {
      cols: GRID_COLS,
      rowHeight: 120,
      margin: GRID_MARGIN,
      padding: GRID_PADDING,
    };

    const newSpace = {
      id: nanoid(),
      name: 'New Space',
      icon: SPACE_ICONS[Math.floor(Math.random() * SPACE_ICONS.length)],
      widgets: [],
      gridConfig: defaultGridConfig,
      isDefault: false,
      createdAt: Date.now(),
    };

    createSpace(newSpace);
    handleSwitchSpace(newSpace.id);
  };

  return (
    <div className="space-y-4">
      <h3
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Spaces
      </h3>

      <div className="space-y-1">
        {spaces.map((space) => {
          const isActive = space.id === activeSpaceId;
          const isEditing = editingId === space.id;

          return (
            <div
              key={space.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              style={{
                backgroundColor: isActive
                  ? 'var(--bg-tertiary)'
                  : 'transparent',
              }}
              onClick={() => handleSwitchSpace(space.id)}
            >
              <span className="text-base flex-shrink-0">{space.icon}</span>

              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleSaveEdit(space.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(space.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 bg-transparent text-sm outline-none border-b"
                  style={{
                    color: 'var(--text-primary)',
                    borderColor: 'var(--accent)',
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 text-sm"
                  style={{
                    color: isActive
                      ? 'var(--accent)'
                      : 'var(--text-primary)',
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(space.id, space.name);
                  }}
                >
                  {space.name}
                </span>
              )}

              {/* Delete button (not for default spaces) */}
              {!space.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSpace(space.id);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Delete space"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create space button */}
      <button
        onClick={handleCreateSpace}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          color: isPremium ? 'var(--accent)' : 'var(--text-muted)',
          backgroundColor: 'transparent',
          cursor: isPremium ? 'pointer' : 'not-allowed',
          opacity: isPremium ? 1 : 0.5,
        }}
      >
        <span>+</span>
        <span>Create Space</span>
        {!isPremium && (
          <span
            className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ml-auto"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
            }}
          >
            PRO
          </span>
        )}
      </button>
    </div>
  );
}
