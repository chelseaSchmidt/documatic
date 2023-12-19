import '@testing-library/jest-dom';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import axios from 'axios';
import { Label } from 'src/constants';
import routes from 'modules/routes';
import userEvent from '@testing-library/user-event';

type AxiosMethod = 'get' | 'post';

interface LabeledInput {
  label: string;
  text: string;
}

export const signOut = () => {
  jest.spyOn(axios, 'get').mockImplementation(async (route) => {
    let data: unknown = '';
    if (route === routes.AUTH_STATUS) data = false;
    return Promise.resolve({ data });
  });
};

export const queueNetworkError = (error: unknown, method?: AxiosMethod, errorRoute?: string) => {
  jest.spyOn(axios, method || 'get').mockImplementation(async (...args) => {
    const [route] = args;
    if (!errorRoute || route === errorRoute) throw error;
    return Promise.resolve();
  });
};

export const waitForLoadingSpinner = async () => {
  await waitForElementToBeRemoved(screen.queryByRole('progressbar'));
};

export const typeFileSearch = async (query: string = 'sample query') => {
  await userEvent.type(screen.getByLabelText(Label.FileSearchInput), query);
};

export const submitFileSearch = async () => {
  await userEvent.click(screen.getByRole('button', { name: Label.FileSearchButton }));
};

export const typeIntoFieldByLabel = async ({ label, text }: LabeledInput) => {
  await userEvent.type(screen.getByLabelText(label), text);
};

export const typeIntoFields = async (labeledInputs: LabeledInput[]) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const labeledInput of labeledInputs) {
    // eslint-disable-next-line no-await-in-loop
    await typeIntoFieldByLabel(labeledInput);
  }
};

export const fillOutAndSubmitFileCreationForm = async (labeledInputs: LabeledInput[]) => {
  await typeIntoFields(labeledInputs);
  await userEvent.click(screen.getByRole('button', { name: Label.FileCreationButton }));
};
