/*
  eslint-disable
  react/jsx-props-no-spreading,
  @typescript-eslint/require-await,
  no-await-in-loop,
  no-restricted-syntax,
*/

import '@testing-library/jest-dom';
import { AxiosError, MOCK_FILE } from '__mocks__/axios';
import { ErrorMessage, Label } from 'src/constants';
import { render, screen } from '@testing-library/react';
import FileCreationForm from 'components/FileCreationForm';
import { INVALID_FILE_NAME_MESSAGE } from 'modules/utils';
import userEvent from '@testing-library/user-event';

import {
  fillOutAndSubmitFileCreationForm,
  queueNetworkError,
} from './utils';

const TABLE_PLACEHOLDER_1 = '{table-placeholder-1}';
const TABLE_PLACEHOLDER_2 = '{table-placeholder-2}';

const PROPS = {
  templateFile: {
    metadata: {},
    placeholders: ['{field1}'],
    tables: [
      {
        rows: [
          {
            metadata: {},
            placeholders: [TABLE_PLACEHOLDER_1],
          },
          {
            metadata: {},
            placeholders: [TABLE_PLACEHOLDER_2],
          },
        ],
      },
      null,
    ],
  },
  getAuthStatus: jest.fn(async () => true),
  isAuthenticated: true,
  setIsAuthenticated: () => {},
};

const SAMPLE_INPUT = 'sample input';
const SAMPLE_ERROR = 'sample error';
const SAMPLE_CAUSE = 'sample cause';
const TABLE_LABELS = PROPS.templateFile.tables.flatMap(
  (table) => table?.rows?.flatMap(
    (row) => row?.placeholders,
  ) || [],
);
const FIELD_LABELS = [
  ...PROPS.templateFile.placeholders,
  ...TABLE_LABELS,
  Label.FileName,
  Label.FolderName,
];

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

    expect(screen.getByRole('link', { name: MOCK_FILE.metadata.webViewLink })).toBeEnabled();
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

describe('TableReplacementsFormFragment', () => {
  it('should display a field for each text replacement', async () => {
    render(<FileCreationForm {...PROPS} />);

    for (const label of TABLE_LABELS) {
      expect(await screen.findByLabelText(label)).toBeInTheDocument();
    }
  });

  it('should allow a table row to be copied', async () => {
    render(<FileCreationForm {...PROPS} />);

    await userEvent.click(screen.getAllByRole('button', { name: '+' })[0]);

    expect(await screen.findAllByLabelText(TABLE_PLACEHOLDER_1)).toHaveLength(2);
  });

  it('should allow a table row to be deleted', async () => {
    render(<FileCreationForm {...PROPS} />);

    await userEvent.click(screen.getAllByRole('button', { name: '-' })[0]);

    expect(screen.queryByLabelText(TABLE_PLACEHOLDER_1)).not.toBeInTheDocument();
  });

  it('should allow a table row to be moved upward', async () => {
    render(<FileCreationForm {...PROPS} />);

    await userEvent.click(screen.getByRole('button', { name: '↑' }));

    expect(
      screen
        .getByLabelText(TABLE_PLACEHOLDER_2)
        .compareDocumentPosition(screen.getByLabelText(TABLE_PLACEHOLDER_1)),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should allow a table row to be moved downward', async () => {
    render(<FileCreationForm {...PROPS} />);

    await userEvent.click(screen.getByRole('button', { name: '↓' }));

    expect(
      screen
        .getByLabelText(TABLE_PLACEHOLDER_2)
        .compareDocumentPosition(screen.getByLabelText(TABLE_PLACEHOLDER_1)),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
