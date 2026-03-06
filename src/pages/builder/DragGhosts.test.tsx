import '@/pages/builder-page.integration-mocks';

import {TeamCardGhost, TeamPreviewGhost} from '@/pages/builder/DragGhosts';
import type {Team, TeamSlot} from '@/pages/builder/types';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

describe('TeamCardGhost', () => {
  const mockSlot: TeamSlot = {
    slotId: 'slot-1',
    awakenerName: 'goliath',
    level: 77,
    wheels: [null, null],
  };

  it('renders card name and level correctly', () => {
    render(<TeamCardGhost awakenerOwnedLevel={77} slot={mockSlot} />);

    const nameElement = screen.getByText(/goliath/i);
    expect(nameElement).toBeInTheDocument();

    const levelElement = screen.getByText(/77/i);
    expect(levelElement).toBeInTheDocument();
  });

  it('shows Unowned badge when level is null', () => {
    render(<TeamCardGhost awakenerOwnedLevel={null} slot={mockSlot} />);

    const badge = screen.getByText(/unowned/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('builder-unowned-badge');
  });
});

describe('TeamPreviewGhost', () => {
  const mockTeam: Team = {
    id: 'team-1',
    name: 'Team 1',
    slots: [
      {slotId: 'slot-1', awakenerName: 'goliath', wheels: [null, null]},
      {slotId: 'slot-2', awakenerName: 'valkyrie', wheels: [null, null]},
    ],
  };

  it('renders preview component', () => {
    const {container} = render(
      <TeamPreviewGhost mode='expanded' team={mockTeam} />,
    );

    // Проверяем, что компонент с нужным классом присутствует
    expect(
      container.querySelector('.builder-team-preview-ghost'),
    ).toBeInTheDocument();
  });
});
