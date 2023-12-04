import '@testing-library/jest-dom';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import axios from 'axios';
import { Label } from 'src/constants';
import routes from 'modules/routes';
import userEvent from '@testing-library/user-event';

export const signOut = () => {
  jest.spyOn(axios, 'get').mockImplementation(async (route) => {
    let data: unknown = '';
    if (route === routes.AUTH_STATUS) data = false;
    return Promise.resolve({ data });
  });
};

export const queueNetworkError = (error: unknown, errorRoute?: string) => {
  jest.spyOn(axios, 'get').mockImplementation(async (route) => {
    if (!errorRoute || route === errorRoute) throw error;
    return Promise.resolve();
  });
};

export const waitForLoadingSpinner = async () => {
  await waitForElementToBeRemoved(screen.queryByRole('progressbar'));
};

export const typeFileSearch = async () => {
  const SAMPLE_QUERY = 'sample query';
  await userEvent.type(screen.getByLabelText(Label.FileQueryInput), SAMPLE_QUERY);
};

export const submitFileSearch = async () => {
  await userEvent.click(screen.getByRole('button', { name: Label.FileQueryButton }));
};
