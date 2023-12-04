import '@testing-library/jest-dom';
import * as useErrorState from 'hooks/useErrorState';
import { ErrorMessage, Label, SuccessMessage } from 'src/constants';
import { render, screen } from '@testing-library/react';
import App from 'components/App';
import { AxiosError } from 'axios';
import { MOCK_FILE } from '__mocks__/axios';
import routes from 'modules/routes';

import {
  queueNetworkError,
  signOut,
  submitFileSearch,
  typeFileSearch,
  waitForLoadingSpinner,
} from './utils';

const SAMPLE_ERROR = 'some error';

describe('App', () => {
  it('should render', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: Label.App })).toBeInTheDocument();
  });

  it('should load authenticated status on mount', async () => {
    render(<App />);
    await waitForLoadingSpinner();
    expect(screen.getByText(SuccessMessage.Auth)).toBeInTheDocument();
  });

  it('should display error if problem retrieving authentication status', async () => {
    queueNetworkError(new Error(SAMPLE_ERROR), routes.AUTH_STATUS);
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });

  it('should allow authentication', async () => {
    render(<App />);
    const authLink = await screen.findByRole('link', { name: Label.AuthLink });
    expect(authLink).toHaveAttribute('href', routes.AUTH);
  });

  it('should allow querying for a template file', async () => {
    render(<App />);

    await waitForLoadingSpinner();
    await typeFileSearch();
    await submitFileSearch();

    expect(screen.getByText(JSON.stringify(MOCK_FILE))).toBeInTheDocument();
  });

  it('should disable querying for a template file when not authenticated', async () => {
    signOut();
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByRole('button', { name: Label.FileQueryButton })).toBeDisabled();
  });

  it('should disallow file query after authentication has expired', async () => {
    render(<App />);

    await waitForLoadingSpinner();
    await screen.findByText(SuccessMessage.Auth);
    signOut();
    await typeFileSearch();
    await submitFileSearch();

    expect(screen.getByText(ErrorMessage.AuthExpired)).toBeInTheDocument();
  });

  it('should disallow a blank file query', async () => {
    render(<App />);

    await waitForLoadingSpinner();
    await submitFileSearch();

    expect(screen.getByText(ErrorMessage.EmptyFileInput)).toBeInTheDocument();
  });

  it('should display error message if unexpected network error occurs', async () => {
    queueNetworkError(new AxiosError(SAMPLE_ERROR));
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });

  it('should display error message if unexpected string literal thrown', async () => {
    queueNetworkError(SAMPLE_ERROR);
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });

  it('should display error message if error of an unexpected type occurs', async () => {
    queueNetworkError(1);
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(ErrorMessage.Default)).toBeInTheDocument();
  });

  it('should not crash if error handling hook fails', async () => {
    queueNetworkError(new Error(SAMPLE_ERROR), routes.AUTH_STATUS);
    jest.spyOn(useErrorState, 'default').mockImplementation(() => ([
      '',
      () => {},
      () => () => { throw new Error(SAMPLE_ERROR); },
    ]));
    render(<App />);

    await waitForLoadingSpinner();
  });
});
