/* eslint-disable react/jsx-props-no-spreading, @typescript-eslint/require-await */

import '@testing-library/jest-dom';
import { ErrorMessage, Label } from 'src/constants';
import { render, screen } from '@testing-library/react';
import FileCreationForm from 'components/FileCreationForm';
import { MOCK_FILE } from '__mocks__/axios';

import {
  fillOutAndSubmitFileCreationForm,
  queueNetworkError,
} from './utils';

const PROPS = {
  templateFile: { metadata: {}, placeholders: ['{field}'] },
  getAuthStatus: jest.fn(async () => true),
  isAuthenticated: true,
  setIsAuthenticated: () => {},
};

const SAMPLE_INPUT = 'sample input';
const SAMPLE_ERROR = 'sample error';
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

  it('should disallow creating a file when a placeholder field has no replacement input entered', async () => {
    const { placeholders } = PROPS.templateFile;
    const incompleteInputs = [Label.FileName, Label.FolderName].map(labelToLabeledInput);
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm(incompleteInputs);

    expect(screen.getByText(`Missing input for ${placeholders[0]}`)).toBeInTheDocument();
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

  it('should display error message if error occurs when creating the file', async () => {
    queueNetworkError(new Error(SAMPLE_ERROR), 'post');
    render(<FileCreationForm {...PROPS} />);

    await fillOutAndSubmitFileCreationForm(labeledInputs);

    expect(screen.getByText(SAMPLE_ERROR)).toBeInTheDocument();
  });
});
