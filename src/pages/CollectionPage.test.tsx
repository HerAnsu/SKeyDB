import {CollectionPage} from '@/pages/CollectionPage';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';

vi.mock('../domain/awakeners', () => ({
  getAwakeners: () => [
    {id: 1, name: 'ramona', faction: 'The Fools', realm: 'CHAOS'},
    {id: 2, name: 'ogier', faction: 'Outlanders', realm: 'CHAOS'},
  ],
}));

vi.mock('../domain/wheels', () => ({
  getWheels: () => [
    {
      id: 'C01',
      name: 'Birth of a Soul',
      rarity: 'SSR',
      realm: 'CHAOS',
      awakener: 'ramona',
      mainstatKey: 'CRIT_RATE',
    },
    {
      id: 'C02',
      name: 'Call of the Deep',
      rarity: 'SSR',
      realm: 'CHAOS',
      awakener: 'ogier',
      mainstatKey: 'ATK',
    },
  ],
  getWheelMainstatLabel: () => '',
  wheelMainstatFilterOptions: [
    {id: 'ALL', label: 'All'},
    {id: 'ATK', label: 'ATK'},
  ],
}));

describe('CollectionPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('navigates tabs and interacts with collection', async () => {
    render(<CollectionPage />);
    expect(screen.getByText('Ramona')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}));
    expect(screen.getByText('Birth of a Soul')).toBeInTheDocument();
  });

  it('captures global search', async () => {
    const user = userEvent.setup();
    render(<CollectionPage />);
    fireEvent.click(document.body);
    await user.keyboard('ramona');
    expect(screen.getByRole('searchbox')).toHaveValue('ramona');
  });

  it('handles file import errors', async () => {
    const {container} = render(<CollectionPage />);
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error('Input not found');
    }
    fireEvent.change(input, {target: {files: [new File(['bad'], 'b.json')]}});

    await waitFor(() => {
      expect(screen.getByText(/load failed/i)).toBeInTheDocument();
    });
  });

  it('toggles display unowned', () => {
    render(<CollectionPage />);
    fireEvent.click(
      screen.getByRole('button', {name: /toggle ownership for ramona/i}),
    );
    fireEvent.click(
      screen.getByRole('button', {name: /toggle display unowned/i}),
    );
    expect(screen.queryByText('Ramona')).not.toBeInTheDocument();
  });

  it('performs batch operations', () => {
    render(<CollectionPage />);
    fireEvent.click(screen.getByRole('button', {name: /^60$/i}));
    expect(screen.getByRole('button', {name: /set owned/i})).toBeEnabled();
  });

  it('manages level edits', () => {
    render(<CollectionPage />);
    fireEvent.click(
      screen.getByRole('button', {name: /edit awakener level for ramona/i}),
    );
    const input = screen.getByRole('textbox', {
      name: /awakener level for ramona/i,
    });
    fireEvent.change(input, {target: {value: '73'}});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(
      screen.getByRole('button', {name: /edit awakener level for ramona/i}),
    ).toHaveTextContent('Lv.73');
  });

  it('handles toast timeout', async () => {
    vi.useFakeTimers();
    render(<CollectionPage />);
    fireEvent.click(screen.getByRole('button', {name: /save to file/i}));
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText(/saved/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('sorts collection items', () => {
    render(<CollectionPage />);
    fireEvent.click(
      screen.getByRole('button', {name: /toggle ownership for ramona/i}),
    );
    fireEvent.click(screen.getByRole('button', {name: /apply changes/i}));
    const titles = Array.from(
      document.querySelectorAll('.collection-card-title'),
    ).map((el) => el.textContent.trim());
    expect(titles[0]).toBe('Ogier');
  });
});
