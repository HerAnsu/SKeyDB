import {BuilderPage} from '@/pages/BuilderPage';

import '@/pages/builder-page.integration-mocks';

import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

describe('BuilderPage wheels and covenants', () => {
  it('shows covenant picker tab and covenant search placeholder', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('tab', {name: /covenants/i}));

    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Search covenants (name, id)',
    );
  });

  it('uses a shared constrained scroll container for every picker tab', () => {
    render(<BuilderPage />);

    const pickerPanel = document.querySelector('[data-picker-zone="true"]');
    expect(pickerPanel).toBeInTheDocument();
    const pickerPanelClasses = Array.from(pickerPanel?.classList ?? []);
    expect(
      pickerPanelClasses.some((className) =>
        className.startsWith('max-h-[calc(100dvh-'),
      ),
    ).toBe(true);

    const tabNames = [
      /^awakeners$/i,
      /^wheels$/i,
      /^covenants$/i,
      /^posses$/i,
    ] as const;
    for (const tabName of tabNames) {
      fireEvent.click(screen.getByRole('tab', {name: tabName}));
      const scrollContainer = document.querySelector(
        '.builder-picker-scrollbar',
      );

      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer).toHaveClass('flex-1', 'min-h-0');
    }
  });

  it('sets covenant on active slot and allows clearing it from picker', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));
    fireEvent.click(screen.getByRole('button', {name: /set covenant/i}));
    fireEvent.click(
      screen.getByRole('button', {name: /deus ex machina covenant/i}),
    );

    expect(
      screen.getByRole('button', {name: /edit covenant/i}),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /not set covenant/i}));
    expect(
      screen.getAllByRole('button', {name: /set covenant/i}).length,
    ).toBeGreaterThan(0);
  });

  it('assigns covenant when awakener card is active and covenant is clicked in picker', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}));
    fireEvent.click(screen.getByRole('tab', {name: /covenants/i}));
    fireEvent.click(
      screen.getByRole('button', {name: /deus ex machina covenant/i}),
    );

    expect(
      screen.getByRole('button', {name: /edit covenant/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /remove active awakener/i}),
    ).toBeInTheDocument();
  });

  it('treats both active slot sockets as wheel slots', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0]);
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}));
    expect(
      screen.getAllByRole('button', {name: /edit wheel/i})[0],
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0]);
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Search wheels (name, rarity, realm, awakener, main stat)',
    );
  });

  it('labels wheels already used in the active team inside picker', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0]);
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}));

    const wheelTile = screen.getByRole('button', {
      name: /merciful nurturing wheel/i,
    });
    expect(wheelTile).toHaveTextContent(/already used/i);
  });

  it('keeps dedicated image scale classes for picker and card wheel tiles', async () => {
    render(<BuilderPage />);

    const wheelsTab = await screen.findByRole('tab', {name: /wheels/i});
    fireEvent.click(wheelsTab);

    const pickerWheel = await screen.findByRole('button', {
      name: /merciful nurturing/i,
    });

    const pickerImage = pickerWheel.querySelector('img');
    expect(pickerImage).toBeInTheDocument();
    expect(pickerImage).toHaveClass('builder-picker-wheel-image');

    fireEvent.click(screen.getAllByRole('tab', {name: /^awakeners$/i})[0]);
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));

    const goliathCard = await screen.findByAltText(/goliath card/i);
    fireEvent.load(goliathCard);

    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0]);
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}));

    const editWheelButton = await screen.findByRole('button', {
      name: /edit wheel/i,
    });
    const cardWheelTile = editWheelButton.closest('.wheel-tile');
    const cardImage = cardWheelTile?.querySelector('img');

    expect(cardImage).toBeInTheDocument();
    expect(cardImage).toHaveClass('builder-card-wheel-image');
  }, 10000);

  it('renders independent wheel rarity and mainstat filter controls', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}));

    const raritySsr = screen.getByRole('button', {name: 'SSR'});
    const mainstatCritRate = screen.getByRole('button', {
      name: /filter wheels by crit rate/i,
    });

    fireEvent.click(raritySsr);
    expect(raritySsr).toHaveAttribute('aria-pressed', 'true');
    expect(mainstatCritRate).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(mainstatCritRate);
    expect(raritySsr).toHaveAttribute('aria-pressed', 'true');
    expect(mainstatCritRate).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses standard plus sigil for unset wheel slots on cards', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));

    const setWheelButtons = screen.getAllByRole('button', {name: /set wheel/i});
    const firstUnsetWheel = setWheelButtons[0].closest('.wheel-tile');

    expect(firstUnsetWheel).toBeInTheDocument();
    expect(
      firstUnsetWheel?.querySelector('.sigil-placeholder-wheel'),
    ).toBeInTheDocument();
  });

  it('renders the unset covenant slot with the svg placeholder frame', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));

    const setCovenantButton = screen.getByRole('button', {
      name: /set covenant/i,
    });
    const covenantTile = setCovenantButton.closest('.covenant-tile');

    expect(covenantTile).toBeInTheDocument();
    expect(
      covenantTile?.querySelector('.builder-covenant-placeholder-svg'),
    ).toBeInTheDocument();
  });

  it('renders wheel remove action inside the active wheel tile', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));
    fireEvent.click(screen.getAllByRole('button', {name: /set wheel/i})[0]);
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}));

    const removeButton = screen.getByRole('button', {
      name: /remove active wheel/i,
    });
    expect(removeButton.closest('.wheel-tile')).toBeInTheDocument();
  });

  it('assigns wheel to first empty slot when awakener card is active', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}));
    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}));
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}));

    expect(screen.getAllByRole('button', {name: /edit wheel/i})).toHaveLength(
      1,
    );
    expect(screen.getAllByRole('button', {name: /set wheel/i})).toHaveLength(1);
  });

  it('keeps awakener active while quick-clicking two wheels from picker', () => {
    render(<BuilderPage />);

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}));
    fireEvent.load(screen.getByAltText(/goliath card/i));
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}));
    fireEvent.click(screen.getByRole('tab', {name: /wheels/i}));
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}));
    fireEvent.click(
      screen.getByRole('button', {name: /tablet of scriptures/i}),
    );

    expect(
      screen.getByRole('button', {name: /remove active awakener/i}),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', {name: /edit wheel/i})).toHaveLength(
      2,
    );
  });
});
