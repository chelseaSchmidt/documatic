/* eslint-disable prefer-arrow-callback */

import 'styles/main.css';
import { ErrorMessage, Label, SuccessMessage } from 'src/constants';
import {
  File,
  FileResponse,
  Nullable,
  StringDictionary,
} from 'src/types';
import { Form, Formik } from 'formik';
import { INVALID_FILE_NAME_MESSAGE, isFileNameValid } from 'modules/utils';
import { useEffect, useState } from 'react';
import axios from 'axios';
import FileCreationForm from 'src/components/FileCreationForm';
import FormField from 'components/FormField';
import LoadingSpinner from 'components/LoadingSpinner';
import routes from 'modules/routes';
import useErrorState from 'hooks/useErrorState';
import useLoadingState from 'hooks/useLoadingState';

interface AuthStatusResponse {
  data: boolean;
}

const App = () => {
  const [loading, , withLoadingState] = useLoadingState();
  const [errorData, setErrorData, guard] = useErrorState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [templateFile, setTemplateFile] = useState<Nullable<File>>(null);

  const getAuthStatus = guard<void, boolean>(
    async (): Promise<boolean> => {
      const { data }: AuthStatusResponse = await axios.get(routes.AUTH_STATUS);
      return data;
    },
  );

  const getFile = guard<string, void>(
    async (fileName) => {
      if (await getAuthStatus()) {
        setErrorData(null);
        setTemplateFile(null);
        const { data }: FileResponse = await axios.get(`${routes.FILE}/${encodeURIComponent(fileName)}`);
        setTemplateFile(data);
      } else {
        setIsAuthenticated(false);
        setErrorData({ message: ErrorMessage.AuthExpired });
      }
    },
  );

  useEffect(() => {
    const setAuthStatus = withLoadingState(async () => {
      setIsAuthenticated(await getAuthStatus() ?? false);
    });

    setAuthStatus().catch(({ message }: Error) => setErrorData({ message }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        role="heading"
        aria-level={1}
      >
        {Label.App}
      </div>

      <Formik
        initialValues={{ templateFileName: '' }}
        validate={(values) => {
          const errors: StringDictionary = {};
          if (!values.templateFileName) {
            errors.templateFileName = ErrorMessage.EmptyFileInput;
          } else if (!isFileNameValid(values.templateFileName)) {
            errors.templateFileName = INVALID_FILE_NAME_MESSAGE;
          }
          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          await withLoadingState(getFile)(values.templateFileName);
          setSubmitting(false);
        }}
      >
        {
          ({ isSubmitting }) => {
            return (
              <Form>
                <FormField
                  label={Label.FileSearchInput}
                  name="templateFileName"
                  type="text"
                  isLabelVisible={false}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !isAuthenticated}
                >
                  {Label.FileSearchButton}
                </button>
              </Form>
            );
          }
        }
      </Formik>

      {
        isAuthenticated && <span>{SuccessMessage.Auth}</span>
      }

      <a
        href={routes.AUTH}
        target="_blank"
        rel="noopener noreferrer"
      >
        {Label.AuthLink}
      </a>

      {
        errorData?.message && <div>{errorData.message}</div>
      }
      {
        errorData?.cause && <div>{errorData.cause}</div>
      }
      {
        loading ? <LoadingSpinner /> : null
      }
      {
        templateFile && (
          <FileCreationForm
            templateFile={templateFile}
            getAuthStatus={getAuthStatus}
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        )
      }
    </>
  );
};

export default App;
