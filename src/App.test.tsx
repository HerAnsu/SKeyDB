import App from '@/App';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

describe('App shell', () => {
  it('renders app navigation and title', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {level: 1, name: /skeydb/i}),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /characters/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /builder/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /collection/i})).toBeInTheDocument();
  });
});
