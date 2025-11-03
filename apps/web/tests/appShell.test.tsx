import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../app/providers/AuthProvider', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: {
      id: 1,
      lineUserId: 'U123',
      displayName: '小夜',
      rewardPoints: 150,
      avatar: null,
    },
    error: undefined,
    token: 'token',
    refresh: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
  }),
}));

import { AppShell } from '../app/components/AppShell';

describe('AppShell', () => {
  it('renders navigation links', () => {
    render(
      <AppShell>
        <div>content</div>
      </AppShell>
    );

    expect(screen.getByText('小夜 OMO')).toBeInTheDocument();
    expect(screen.getAllByText('甜心列表')).toHaveLength(2);
  });
});
