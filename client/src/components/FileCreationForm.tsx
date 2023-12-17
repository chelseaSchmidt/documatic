import {
  AsyncMethod,
  File,
  FileResponse,
  Nullable,
  StringDictionary,
} from 'src/types';
import { ErrorMessage, Label } from 'src/constants';
import { Form, Formik } from 'formik';
import axios from 'axios';
import FormField from 'components/FormField';
import LoadingSpinner from 'components/LoadingSpinner';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import routes from 'modules/routes';
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

const getContentUpdates = (updates: StringDictionary) => omit(updates, METADATA_FIELD_NAMES);
const getMetadataUpdates = (updates: StringDictionary) => pick(updates, METADATA_FIELD_NAMES);
const toInitialValues = (names: string[]) => names.reduce((values, name) => ({ ...values, [name]: '' }), {});

const FileCreationForm = (
  {
    templateFile,
    getAuthStatus,
    isAuthenticated,
    setIsAuthenticated,
  }: FileCreationFormProps,
) => {
  const [errorMessage, setErrorMessage, guard] = useErrorState();
  const [createdFile, setCreatedFile] = useState<Nullable<File>>(null);

  const { placeholders: contentFieldNames } = templateFile;

  const createFile = guard<StringDictionary, void>(
    async (values) => {
      if (await getAuthStatus()) {
        setErrorMessage('');
        setCreatedFile(null);
        const { data }: FileResponse = await axios.post(
          `${routes.FILE}`,
          {
            templateId: templateFile.metadata.id,
            metadataUpdates: getMetadataUpdates(values),
            contentUpdates: getContentUpdates(values),
          },
        );
        setCreatedFile(data);
      } else {
        setIsAuthenticated(false);
        setErrorMessage(ErrorMessage.AuthExpired);
      }
    },
  );

  const validateForm = (values: StringDictionary) => {
    const errors: StringDictionary = {};

    METADATA_FIELDS.forEach(({ name, error }) => {
      if (!values[name]) {
        errors[name] = error;
      }
    });

    contentFieldNames.forEach((name) => {
      if (!values[name]) {
        errors[name] = `Missing input for ${name}`;
      }
    });

    return errors;
  };

  return (
    <>
      <div style={{ margin: '20px 0' }}>
        <Formik
          initialValues={{
            ...toInitialValues(contentFieldNames),
            ...toInitialValues(METADATA_FIELD_NAMES),
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
            ({ isSubmitting }) => {
              return (
                <Form>
                  {
                    contentFieldNames.map((name) => (
                      <div key={name}>
                        <FormField
                          label={name}
                          name={name}
                          isLabelVisible
                        />
                      </div>
                    ))
                  }
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
        errorMessage && <div>{errorMessage}</div>
      }
      {
        createdFile && <div>{JSON.stringify(createdFile)}</div>
      }
    </>
  );
};

export default FileCreationForm;
