import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from 'components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render', () => {
    render(<LoadingSpinner width="10px" height="10px" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
