import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from 'components/App';

describe('App', () => {
  it('should render', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'App' })).toBeInTheDocument();
  });
});
