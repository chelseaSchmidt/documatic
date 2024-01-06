import {
  AsyncMethod,
  File,
  FileCreationFormValues,
  FileResponse,
  Nullable,
  StringDictionary,
} from 'src/types';
import { ErrorMessage, Label } from 'src/constants';
import { Form, Formik } from 'formik';
import { INVALID_FILE_NAME_MESSAGE, isFileNameValid } from 'modules/utils';
import axios from 'axios';
import FormField from 'components/FormField';
import LoadingSpinner from 'components/LoadingSpinner';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import routes from 'modules/routes';
import TableReplacementsFormFragment from 'components/TableReplacementsFormFragment';
import useErrorState from 'hooks/useErrorState';
import { useState } from 'react';

interface FileCreationFormProps {
  templateFile: File;
  getAuthStatus: AsyncMethod<void, boolean>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const METADATA_FIELDS = [
  { name: 'fileName', label: Label.FileName, error: ErrorMessage.EmptyFileInput },
  { name: 'folderName', label: Label.FolderName, error: ErrorMessage.EmptyFolderInput },
];

const METADATA_FIELD_NAMES = METADATA_FIELDS.map((field) => field.name);

const getTextReplacements = (formValues: FileCreationFormValues) => omit(
  formValues,
  [...METADATA_FIELD_NAMES, 'tableReplacements'],
);

const getMetadataUpdates = (formValues: FileCreationFormValues) => pick(
  formValues,
  METADATA_FIELD_NAMES,
);

const toInitialValues = (names: string[]) => names.reduce((values, name) => ({ ...values, [name]: '' }), {});

const FileCreationForm = (
  {
    templateFile,
    getAuthStatus,
    isAuthenticated,
    setIsAuthenticated,
  }: FileCreationFormProps,
) => {
  const [errorData, setErrorData, guard] = useErrorState(null);
  const [createdFile, setCreatedFile] = useState<Nullable<File>>(null);

  const {
    placeholders: textReplacementFieldNames,
    tables,
  } = templateFile;

  const createFile = guard<FileCreationFormValues, void>(
    async (values) => {
      if (await getAuthStatus()) {
        setErrorData(null);
        setCreatedFile(null);
        const { data }: FileResponse = await axios.post(
          `${routes.FILE}`,
          {
            templateId: templateFile.metadata.id,
            metadataUpdates: getMetadataUpdates(values),
            textReplacements: getTextReplacements(values),
            tableReplacements: values.tableReplacements,
          },
        );
        setCreatedFile(data);
      } else {
        setIsAuthenticated(false);
        setErrorData({ message: ErrorMessage.AuthExpired });
      }
    },
  );

  const validateForm = (values: FileCreationFormValues) => {
    const errors: StringDictionary = {};

    METADATA_FIELDS.forEach(({ name, error }) => {
      if (!values[name]) {
        errors[name] = error;
      } else if (!isFileNameValid(values[name])) {
        errors[name] = INVALID_FILE_NAME_MESSAGE;
      }
    });

    // TODO: textReplacements and tableReplacements validation

    return errors;
  };

  return (
    <>
      <div style={{ margin: '20px 0' }}>
        <Formik
          initialValues={{
            ...toInitialValues(textReplacementFieldNames),
            ...toInitialValues(METADATA_FIELD_NAMES),
            tableReplacements: tables.map((table) => (table ? {
              rows: table.rows.map((row) => ({
                metadata: row.metadata,
                textReplacements: toInitialValues(row.placeholders),
              })),
            } : null)),
          }}
          validate={validateForm}
          onSubmit={
            async (values, { setSubmitting }) => {
              await createFile(values);
              setSubmitting(false);
            }
          }
        >
          {
            ({ values, isSubmitting }) => {
              return (
                <Form>
                  {
                    textReplacementFieldNames.map((name) => (
                      <div key={name}>
                        <FormField
                          label={name}
                          name={name}
                          isLabelVisible
                        />
                      </div>
                    ))
                  }
                  <TableReplacementsFormFragment
                    tableReplacements={values.tableReplacements}
                  />
                  {
                    METADATA_FIELDS.map(({ name, label }) => (
                      <div key={name} style={{ margin: '10px 0' }}>
                        <FormField
                          label={label}
                          name={name}
                          isLabelVisible
                        />
                      </div>
                    ))
                  }
                  <button
                    type="submit"
                    disabled={isSubmitting || !isAuthenticated}
                  >
                    {isSubmitting ? <LoadingSpinner /> : Label.FileCreationButton}
                  </button>
                </Form>
              );
            }
          }
        </Formik>
      </div>
      {
        errorData?.message && <div>{errorData.message}</div>
      }
      {
        errorData?.cause && <div>{errorData.cause}</div>
      }
      {
        createdFile && <div>{JSON.stringify(createdFile)}</div>
      }
      {
        createdFile?.metadata.webViewLink && (
          <a href={createdFile.metadata.webViewLink} target="_blank" rel="noreferrer">
            {createdFile.metadata.webViewLink}
          </a>
        )
      }
    </>
  );
};

export default FileCreationForm;
