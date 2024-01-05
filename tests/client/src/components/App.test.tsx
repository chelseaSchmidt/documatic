import '@testing-library/jest-dom';
import * as useErrorState from 'hooks/useErrorState';
import { AxiosError, MOCK_FILE } from '__mocks__/axios';
import { ErrorMessage, Label, SuccessMessage } from 'src/constants';
import { render, screen } from '@testing-library/react';
import App from 'components/App';
import { INVALID_FILE_NAME_MESSAGE } from 'modules/utils';
import routes from 'modules/routes';

import {
  queueNetworkError,
  signOut,
  submitFileSearch,
  typeFileSearch,
  waitForLoadingSpinner,
} from './utils';

const SAMPLE_ERROR = 'sample error';
const SAMPLE_CAUSE = 'sample cause';

describe('App', () => {
  it('should render', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: Label.AppHeader })).toBeInTheDocument();
  });

  it('should load authenticated status on mount', async () => {
    render(<App />);
    await waitForLoadingSpinner();
    expect(screen.getByText(SuccessMessage.Auth)).toBeInTheDocument();
  });

  it('should display error if problem retrieving authentication status', async () => {
    queueNetworkError(new Error(SAMPLE_ERROR), 'get', routes.AUTH_STATUS);
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

    MOCK_FILE.placeholders.forEach((placeholder) => {
      expect(screen.getByLabelText(placeholder)).toBeInTheDocument();
    });
  });

  it('should disable querying for a template file when not authenticated', async () => {
    signOut();
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByRole('button', { name: Label.FileSearchButton })).toBeDisabled();
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

  it('should disallow searching for an invalid file name', async () => {
    render(<App />);

    await waitForLoadingSpinner();
    await typeFileSearch('\\');
    await submitFileSearch();

    expect(screen.getByText(INVALID_FILE_NAME_MESSAGE)).toBeInTheDocument();
  });

  it('should display file creation form after template file found', async () => {
    render(<App />);

    await waitForLoadingSpinner();
    await typeFileSearch();
    await submitFileSearch();

    expect(screen.getByRole('button', { name: Label.FileCreationButton })).toBeInTheDocument();
  });

  it('should display error message if unexpected string type network error occurs', async () => {
    queueNetworkError(new AxiosError(SAMPLE_ERROR));
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });

  it('should display error message if unexpected object type network error occurs', async () => {
    queueNetworkError(new AxiosError({ message: SAMPLE_ERROR, cause: SAMPLE_CAUSE }));
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });

  it('should display error message if server is unresponsive', async () => {
    queueNetworkError(new AxiosError({ message: SAMPLE_ERROR }, true));
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(ErrorMessage.NoServerResponse)).toBeInTheDocument();
  });

  it('should display error message if unexpected string literal thrown', async () => {
    queueNetworkError(SAMPLE_ERROR);
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });

  it('should display default error message if error of an unexpected type occurs', async () => {
    queueNetworkError(1);
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(ErrorMessage.Default)).toBeInTheDocument();
  });

  it('should display default error message if empty error object thrown', async () => {
    queueNetworkError({});
    render(<App />);

    await waitForLoadingSpinner();

    expect(screen.getByText(ErrorMessage.Default)).toBeInTheDocument();
  });

  it('should not crash if error handling hook fails', async () => {
    queueNetworkError(new Error(SAMPLE_ERROR), 'get', routes.AUTH_STATUS);
    jest.spyOn(useErrorState, 'default').mockImplementation(() => ([
      null,
      () => {},
      () => () => { throw new Error(SAMPLE_ERROR); },
    ]));
    render(<App />);

    await waitForLoadingSpinner();
  });
});
