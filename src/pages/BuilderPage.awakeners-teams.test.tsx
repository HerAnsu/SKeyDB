import {COLLECTION_OWNERSHIP_KEY} from '@/domain/collection-ownership';
import {allAwakeners} from '@/pages/builder/constants';
import {BuilderPage} from '@/pages/BuilderPage';

import '@/pages/builder-page.integration-mocks';

import {fireEvent, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';

const ui = {
  clickBtn: (name: RegExp | string) =>
    fireEvent.click(screen.getByRole('button', {name})),
  clickTab: (name: RegExp | string) =>
    fireEvent.click(screen.getByRole('tab', {name})),
  getDialog: (name: RegExp | string) => screen.getByRole('dialog', {name}),

  getRow: (name: string) => {
    const row = document.querySelector(`[data-team-name="${name}"]`);
    if (!(row instanceof HTMLElement)) {
      throw new Error(`Team row "${name}" not found in DOM`);
    }
    return row;
  },

  clickRowBtn: (row: HTMLElement, name: RegExp | string) =>
    fireEvent.click(within(row).getByRole('button', {name})),
};

describe('BuilderPage awakeners and teams', () => {
  it('uses icon-only empty placeholders without helper text', () => {
    const {container} = render(<BuilderPage />);
    expect(screen.queryByText(/tap to deploy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^wheel$/i)).not.toBeInTheDocument();
    expect(
      container.querySelectorAll('.sigil-placeholder').length,
    ).toBeGreaterThan(0);
  });

  it('adds to the first empty slot when clicking a picker portrait', () => {
    render(<BuilderPage />);
    ui.clickBtn(/ramona: timeworn/i);
    expect(
      screen.getByRole('button', {name: /change ramona: timeworn/i}),
    ).toBeInTheDocument();
  });

  it('displays collection awakener level as read-only Lv text on builder cards', () => {
    // 1. Динамически находим настоящий ID Голиафа, чтобы мок 100% сработал
    const goliath = allAwakeners.find((a) =>
      a.name.toLowerCase().includes('goliath'),
    );
    const goliathId = goliath ? String(goliath.id) : '1';

    window.localStorage.setItem(
      COLLECTION_OWNERSHIP_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: '2026-01-01T00:00:00.000Z',
        payload: {
          ownedAwakeners: {[goliathId]: 0},
          awakenerLevels: {[goliathId]: 77},
          ownedWheels: {},
          ownedPosses: {},
          displayUnowned: true,
        },
      }),
    );

    render(<BuilderPage />);
    ui.clickBtn(/goliath/i);
    fireEvent.load(screen.getByAltText(/goliath card/i));

    expect(
      screen.getByText((_, element) => {
        if (!element) return false;
        return element.textContent.replace(/\s+/g, '') === 'Lv.77';
      }),
    ).toBeInTheDocument();
  });

  it('marks awakeners as in use after being assigned to the team', () => {
    render(<BuilderPage />);
    ui.clickBtn(/goliath/i);

    const pickerBtn = screen.getByRole('button', {name: /goliath portrait/i});
    expect(pickerBtn).toHaveAttribute('data-in-use', 'true');
    expect(pickerBtn).toHaveTextContent(/already used/i);
  });

  it('captures global typing into the active picker search', async () => {
    const user = userEvent.setup();
    render(<BuilderPage />);

    fireEvent.click(document.body);
    await user.keyboard('ramona');

    expect(screen.getByRole('searchbox')).toHaveValue('ramona');
  });

  it('marks alternate awakeners as used when one form is assigned', () => {
    render(<BuilderPage />);
    ui.clickBtn(/ramona portrait/i);

    const altPickerBtn = screen.getByRole('button', {
      name: /ramona: timeworn portrait/i,
    });
    expect(altPickerBtn).toHaveAttribute('data-in-use', 'true');
    expect(altPickerBtn).toHaveTextContent(/already used/i);
  });

  it('replaces the active card when clicking an awakener in picker', () => {
    render(<BuilderPage />);
    ui.clickBtn(/goliath/i);
    ui.clickBtn(/change goliath/i);
    ui.clickBtn(/ramona: timeworn/i);

    expect(
      screen.queryByRole('button', {name: /change goliath/i}),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /change ramona: timeworn/i}),
    ).toBeInTheDocument();
  });

  it('shows a compact add-team tab action and hides it at max teams', () => {
    render(<BuilderPage />);

    const addBtn = screen.getByRole('button', {name: /add team tab/i});
    fireEvent.click(addBtn);

    expect(screen.getByRole('tab', {name: /team 2/i})).toBeInTheDocument();

    for (let index = 3; index <= 10; index += 1) {
      fireEvent.click(addBtn);
    }

    expect(screen.getByRole('tab', {name: /team 10/i})).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {name: /add team tab/i}),
    ).not.toBeInTheDocument();
  });

  it('toggles off active card when clicking the same card again', () => {
    render(<BuilderPage />);
    ui.clickBtn(/goliath/i);
    ui.clickBtn(/change goliath/i);
    expect(
      screen.getByRole('button', {name: /remove active awakener/i}),
    ).toBeInTheDocument();

    ui.clickBtn(/change goliath/i);
    expect(
      screen.queryByRole('button', {name: /remove active awakener/i}),
    ).not.toBeInTheDocument();
  });

  it('switches active team when clicking the team row card', () => {
    render(<BuilderPage />);
    ui.clickBtn(/goliath/i);
    ui.clickBtn(/\+ add team/i);

    const team2Row = ui.getRow('Team 2');
    const grid = team2Row.querySelector('.grid');
    if (!(grid instanceof HTMLElement)) throw new Error('Grid not found');

    fireEvent.click(grid);

    expect(
      screen.queryByRole('button', {name: /change goliath/i}),
    ).not.toBeInTheDocument();
  });

  it('switches active team from the top team tabs', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);
    ui.clickBtn(/goliath/i);

    ui.clickTab(/team 2/i);
    expect(
      screen.queryByRole('button', {name: /change goliath/i}),
    ).not.toBeInTheDocument();
  });

  it('deletes an empty team directly from the top tab close action', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);

    ui.clickBtn(/close team 2/i);

    expect(
      screen.queryByRole('dialog', {name: /delete team 2/i}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', {name: /team 2/i}),
    ).not.toBeInTheDocument();
  });

  it('asks for confirmation before deleting a non-empty team from the top tab close action', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);

    ui.clickTab(/^team 2$/i);
    ui.clickBtn(/goliath/i);

    ui.clickBtn(/close team 2/i);
    expect(ui.getDialog(/delete team 2/i)).toBeInTheDocument();

    ui.clickBtn(/cancel/i);
    expect(screen.getByRole('tab', {name: /team 2/i})).toBeInTheDocument();
  });

  it('confirms moving a locked posse from another team and supports cancel', () => {
    render(<BuilderPage />);
    ui.clickTab(/posses/i);
    ui.clickBtn(/taverns opening/i);
    ui.clickBtn(/\+ add team/i);

    ui.clickTab(/^team 2$/i);
    ui.clickBtn(/taverns opening/i);

    expect(ui.getDialog(/move taverns opening/i)).toBeInTheDocument();

    ui.clickBtn(/cancel/i);
    expect(
      screen.queryByRole('dialog', {name: /move taverns opening/i}),
    ).not.toBeInTheDocument();
  });

  it('deletes empty team without showing confirmation dialog', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);

    const team2Row = ui.getRow('Team 2');
    ui.clickRowBtn(team2Row, /delete/i);

    expect(
      screen.queryByRole('dialog', {name: /delete team 2/i}),
    ).not.toBeInTheDocument();
  });

  it('resets empty team immediately without showing confirmation dialog', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);

    const team2Row = ui.getRow('Team 2');
    ui.clickRowBtn(team2Row, /reset/i);

    expect(
      screen.queryByRole('dialog', {name: /reset team 2/i}),
    ).not.toBeInTheDocument();
  });

  it('requires centered confirm/cancel before deleting a non-empty team', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);

    ui.clickTab(/^team 2$/i);
    ui.clickBtn(/goliath/i);

    const team2Row = ui.getRow('Team 2');
    ui.clickRowBtn(team2Row, /delete/i);

    expect(ui.getDialog(/delete team 2/i)).toBeInTheDocument();

    ui.clickBtn(/cancel/i);
    expect(
      screen.queryByRole('dialog', {name: /delete team 2/i}),
    ).not.toBeInTheDocument();
  });

  it('confirms before resetting a non-empty team', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);

    ui.clickTab(/^team 2$/i);
    ui.clickBtn(/goliath/i);

    const team2Row = ui.getRow('Team 2');
    ui.clickRowBtn(team2Row, /reset/i);

    expect(ui.getDialog(/reset team 2/i)).toBeInTheDocument();

    ui.clickBtn(/reset team/i);
    expect(
      screen.queryByRole('dialog', {name: /reset team 2/i}),
    ).not.toBeInTheDocument();
  });

  it('renames team inline and confirms with Enter', () => {
    render(<BuilderPage />);
    ui.clickBtn(/\+ add team/i);

    const team2Row = ui.getRow('Team 2');
    ui.clickRowBtn(team2Row, /rename team/i);

    const renameInput = screen.getByRole('textbox', {name: /team name/i});
    fireEvent.change(renameInput, {target: {value: 'Arena Team'}});
    fireEvent.keyDown(renameInput, {key: 'Enter', code: 'Enter'});

    expect(screen.getByRole('tab', {name: /arena team/i})).toBeInTheDocument();
  });

  it('confirms moving a locked awakener from another team to active team', () => {
    render(<BuilderPage />);
    ui.clickBtn(/goliath/i);
    ui.clickBtn(/\+ add team/i);

    ui.clickTab(/^team 2$/i);
    ui.clickBtn(/goliath/i);

    expect(ui.getDialog(/move goliath/i)).toBeInTheDocument();

    ui.clickBtn(/move instead/i);
    expect(
      screen.queryByRole('dialog', {name: /move goliath/i}),
    ).not.toBeInTheDocument();
  });

  it('starts quick team lineup and progresses picker tabs', () => {
    render(<BuilderPage />);
    ui.clickBtn(/quick team lineup/i);
    ui.clickBtn(/next/i);
    ui.clickBtn(/goliath/i);

    expect(screen.getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
