import {
  decodeImportCode,
  encodeMultiTeamCode,
  encodeSingleTeamCode,
} from '@/domain/import-export';
import {BuilderPage} from '@/pages/BuilderPage';

import '@/pages/builder-page.integration-mocks';

import {saveBuilderDraft} from '@/pages/builder/builder-persistence';
import type {Team} from '@/pages/builder/types';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';

function makeImportTeam(
  name: string,
  awakenerName: string,
  posseId?: string,
): Team {
  return {
    id: `${name}-id`,
    name,
    posseId,
    slots: [
      {
        slotId: 'slot-1',
        awakenerName,
        realm: 'AEQUOR',
        level: 60,
        wheels: [null, null],
      },
      {slotId: 'slot-2', wheels: [null, null]},
      {slotId: 'slot-3', wheels: [null, null]},
      {slotId: 'slot-4', wheels: [null, null]},
    ],
  };
}

function getRequiredElement(
  element: Element | null,
  message: string,
): HTMLElement {
  if (!(element instanceof HTMLElement)) {
    throw new Error(message);
  }
  return element;
}

function getRequiredTextArea(element: Element | null): HTMLTextAreaElement {
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error('Expected textarea export field');
  }
  return element;
}

const ui = {
  clickBtn: (name: RegExp | string) =>
    fireEvent.click(screen.getByRole('button', {name})),
  getDialog: (name: RegExp | string) => screen.getByRole('dialog', {name}),
  clickDialogBtn: (dialog: HTMLElement, name: RegExp | string) =>
    fireEvent.click(within(dialog).getByRole('button', {name})),

  importCode: (code: string, submitKey?: string) => {
    ui.clickBtn(/import/i);
    const dialog = ui.getDialog(/import teams/i);
    const input = within(dialog).getByRole('textbox', {name: /import code/i});

    fireEvent.change(input, {target: {value: code}});

    if (submitKey) {
      fireEvent.keyDown(input, {key: submitKey, code: submitKey});
    } else {
      ui.clickDialogBtn(dialog, /^import$/i);
    }

    return dialog;
  },
};

describe('BuilderPage import-export', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('exports and imports a single team using t1 code', () => {
    render(<BuilderPage />);
    const t1Code = encodeSingleTeamCode(
      makeImportTeam('Imported Team', 'goliath'),
    );

    ui.clickBtn(/import/i);
    const importDialog = ui.getDialog(/import teams/i);

    expect(
      within(importDialog).getByText(
        /in-game `@@\.\.\.@@` import is work in progress/i,
      ),
    ).toBeInTheDocument();

    const input = within(importDialog).getByRole('textbox', {
      name: /import code/i,
    });
    fireEvent.change(input, {target: {value: t1Code}});
    ui.clickDialogBtn(importDialog, /^import$/i);

    expect(
      screen.getByRole('button', {name: /change goliath/i}),
    ).toBeInTheDocument();
    expect(screen.getByText(/team imported/i)).toBeInTheDocument();
  });

  it('submits import dialog on Enter key', () => {
    render(<BuilderPage />);
    const t1Code = encodeSingleTeamCode(
      makeImportTeam('Imported Team', 'goliath'),
    );

    ui.importCode(t1Code, 'Enter');

    expect(
      screen.getByRole('button', {name: /change goliath/i}),
    ).toBeInTheDocument();
    expect(screen.getByText(/team imported/i)).toBeInTheDocument();
  });

  it('imports mt1 code after replace confirmation', () => {
    const teamA = makeImportTeam('Alpha', 'goliath');
    const teamB = makeImportTeam('Beta', 'ramona');
    const mtCode = encodeMultiTeamCode([teamA, teamB], teamB.id);
    const {container} = render(<BuilderPage />);

    ui.importCode(mtCode);

    expect(ui.getDialog(/replace current teams/i)).toBeInTheDocument();
    ui.clickBtn(/^replace$/i);

    expect(
      container.querySelector('[data-team-name="Team 1"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-team-name="Team 2"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /change ramona/i}),
    ).toBeInTheDocument();
  });

  it('imports t1 into active team when active team is empty', () => {
    const t1Code = encodeSingleTeamCode(
      makeImportTeam('Imported Team', 'goliath'),
    );
    const {container} = render(<BuilderPage />);

    ui.clickBtn(/\+ add team/i);

    const team2Row = getRequiredElement(
      container.querySelector('[data-team-name="Team 2"]'),
      'Expected Team 2 row',
    );
    fireEvent.click(within(team2Row).getByText('Team 2'));

    ui.importCode(t1Code);

    expect(
      container.querySelector('[data-team-name="Team 3"]'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /change goliath/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /rename team 2/i}),
    ).toBeInTheDocument();
  });

  it('exports active team in in-game @@ format', () => {
    render(<BuilderPage />);
    const goliathCode = encodeSingleTeamCode(
      makeImportTeam('Imported Team', 'goliath'),
    );

    ui.importCode(goliathCode);
    ui.clickBtn(/export in-game/i);

    const exportDialog = ui.getDialog(/export in-game/i);
    expect(
      within(exportDialog).getByText(/in-game export is work in progress/i),
    ).toBeInTheDocument();

    const codeArea = getRequiredTextArea(
      within(exportDialog).getByRole('textbox', {name: /export code/i}),
    );
    expect(codeArea.value).toMatch(/^@@.*@@$/);
  });

  it('shows unsupported token warning toast for in-game awakener/wheel imports', () => {
    render(<BuilderPage />);
    ui.importCode('@@#aaaaaaaaaaaa@@');

    expect(
      screen.getByText(/unsupported awakener\/wheel tokens imported as empty/i),
    ).toBeInTheDocument();
  });

  it('can escalate skipped duplicate-conflict imports into the duplicate-override flow', () => {
    const incomingTeam = encodeSingleTeamCode(
      makeImportTeam('Imported Team', 'goliath', 'taverns-opening'),
    );
    saveBuilderDraft(window.localStorage, {
      teams: [
        makeImportTeam('Alpha', 'goliath', 'manor-echoes'),
        makeImportTeam('Beta', 'ramona', 'manor-echoes'),
      ],
      activeTeamId: 'Alpha-id',
    });

    const {container} = render(<BuilderPage />);

    ui.importCode(incomingTeam);

    const strategyDialog = ui.getDialog(/resolve import conflicts/i);
    ui.clickDialogBtn(strategyDialog, /skip duplicates/i);

    expect(ui.getDialog(/import uses duplicates/i)).toBeInTheDocument();
    ui.clickBtn(/enable and import/i);

    expect(container.querySelectorAll('[data-team-name]')).toHaveLength(3);
    expect(screen.getByText(/team imported/i)).toBeInTheDocument();
  });

  it('requires confirmation before importing duplicate-illegal teams and enables allow dupes on confirm', () => {
    const teamA = makeImportTeam('Alpha', 'goliath');
    const teamB = makeImportTeam('Beta', 'goliath');
    const mtCode = encodeMultiTeamCode([teamA, teamB], teamA.id);

    render(<BuilderPage />);

    ui.importCode(mtCode);

    const conflictDialog = ui.getDialog(/import uses duplicates/i);
    ui.clickDialogBtn(conflictDialog, /enable and import/i);

    const replaceDialog = ui.getDialog(/replace current teams/i);
    ui.clickDialogBtn(replaceDialog, /^replace$/i);

    expect(window.localStorage.getItem('skeydb.builder.allowDupes.v1')).toBe(
      '1',
    );

    ui.importCode(mtCode);

    expect(window.localStorage.getItem('skeydb.builder.allowDupes.v1')).toBe(
      '1',
    );
  });

  it('shows duplicate warning on export all when teams are only legal with allow dupes', () => {
    const teamA = makeImportTeam('Alpha', 'goliath');
    const teamB = makeImportTeam('Beta', 'goliath');
    const mtCode = encodeMultiTeamCode([teamA, teamB], teamA.id);

    render(<BuilderPage />);

    ui.importCode(mtCode);
    ui.clickBtn(/enable and import/i);
    ui.clickBtn(/^replace$/i);

    ui.clickBtn(/export all/i);
    const exportDialog = ui.getDialog(/export all teams/i);

    expect(
      within(exportDialog).getByText(/reuse units, wheels, or posses/i),
    ).toBeInTheDocument();
  });

  it('preserves support awakeners in standard multi-team export', () => {
    saveBuilderDraft(window.localStorage, {
      teams: [
        makeImportTeam('Alpha', 'goliath'),
        {
          ...makeImportTeam('Beta', 'goliath'),
          slots: [
            {
              slotId: 'slot-1',
              awakenerName: 'goliath',
              realm: 'AEQUOR',
              level: 90,
              isSupport: true,
              wheels: [null, null],
            },
            {slotId: 'slot-2', wheels: [null, null]},
            {slotId: 'slot-3', wheels: [null, null]},
            {slotId: 'slot-4', wheels: [null, null]},
          ],
        },
      ],
      activeTeamId: 'Alpha-id',
    });

    render(<BuilderPage />);

    ui.clickBtn(/export all/i);
    const exportDialog = ui.getDialog(/export all teams/i);

    const exportCode = getRequiredTextArea(
      within(exportDialog).getByRole('textbox', {name: /export code/i}),
    );

    const parsed = decodeImportCode(exportCode.value);

    expect(parsed.kind).toBe('multi');
    if (parsed.kind !== 'multi') return;

    expect(parsed.teams[1].slots[0].isSupport).toBe(true);
    expect(parsed.teams[1].slots[0].level).toBe(90);
  });
});
