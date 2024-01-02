/* eslint-disable react/jsx-props-no-spreading, @typescript-eslint/require-await */

import '@testing-library/jest-dom';
import { AxiosError, MOCK_FILE } from '__mocks__/axios';
import { ErrorMessage, Label } from 'src/constants';
import { render, screen } from '@testing-library/react';
import FileCreationForm from 'components/FileCreationForm';
import { INVALID_FILE_NAME_MESSAGE } from 'modules/utils';

import {
  fillOutAndSubmitFileCreationForm,
  queueNetworkError,
} from './utils';

const PROPS = {
  templateFile: {
    metadata: {},
    placeholders: ['{field}'],
    tables: [{
      rows: [{
        metadata: {},
        placeholders: [],
      }],
    }],
  },
  getAuthStatus: jest.fn(async () => true),
  isAuthenticated: true,
  setIsAuthenticated: () => {},
};

const SAMPLE_INPUT = 'sample input';
const SAMPLE_ERROR = 'sample error';
const SAMPLE_CAUSE = 'sample cause';
const FIELD_LABELS = [...PROPS.templateFile.placeholders, Label.FileName, Label.FolderName];

const labelToLabeledInput = (label: string) => ({ label, text: SAMPLE_INPUT });
const labeledInputs = FIELD_LABELS.map(labelToLabeledInput);

describe('FileCreationForm', () => {
  it('should render', async () => {
    render(<FileCreationForm {...PROPS} />);
    expect(await screen.findByRole('button', { name: Label.FileCreationButton })).toBeInTheDocument();
  });

  it('should allow creation of a new file', async () => {
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm(labeledInputs);

    expect(screen.getByText(JSON.stringify(MOCK_FILE))).toBeInTheDocument();
  });

  it('should disallow creating a file when not authenticated', async () => {
    PROPS.getAuthStatus.mockImplementationOnce(async () => false);
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm(labeledInputs);

    expect(screen.getByText(ErrorMessage.AuthExpired)).toBeInTheDocument();
  });

  it('should disallow creating a file when no file name entered', async () => {
    const { placeholders } = PROPS.templateFile;
    const incompleteInputs = [...placeholders, Label.FolderName].map(labelToLabeledInput);
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm(incompleteInputs);

    expect(screen.getByText(ErrorMessage.EmptyFileInput)).toBeInTheDocument();
  });

  it('should disallow creating a file when no destination folder name entered', async () => {
    const { placeholders } = PROPS.templateFile;
    const incompleteInputs = [...placeholders, Label.FileName].map(labelToLabeledInput);
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm(incompleteInputs);

    expect(screen.getByText(ErrorMessage.EmptyFolderInput)).toBeInTheDocument();
  });

  it('should disallow entering an invalid file name', async () => {
    const { placeholders } = PROPS.templateFile;
    const inputs = [...placeholders, Label.FolderName].map(labelToLabeledInput);
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm([
      ...inputs,
      { label: Label.FileName, text: '\\' },
    ]);

    expect(screen.getByText(INVALID_FILE_NAME_MESSAGE)).toBeInTheDocument();
  });

  it('should disallow entering an invalid folder name', async () => {
    const { placeholders } = PROPS.templateFile;
    const inputs = [...placeholders, Label.FileName].map(labelToLabeledInput);
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm([
      ...inputs,
      { label: Label.FolderName, text: '\\' },
    ]);

    expect(screen.getByText(INVALID_FILE_NAME_MESSAGE)).toBeInTheDocument();
  });

  it('should display error message if error occurs when creating the file', async () => {
    queueNetworkError(new AxiosError({ message: SAMPLE_ERROR, cause: SAMPLE_CAUSE }), 'post');
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm(labeledInputs);

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });
});
