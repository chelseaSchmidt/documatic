/* eslint-disable prefer-arrow-callback */
import 'styles/main.css';
import { ErrorMessage, Label, SuccessMessage } from 'src/constants';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { drive_v3 } from 'googleapis';
import FormField from 'components/FormField';
import LoadingSpinner from 'components/LoadingSpinner';
import routes from 'modules/routes';
import useErrorState from 'hooks/useErrorState';
import useLoadingState from 'hooks/useLoadingState';

type File = drive_v3.Params$Resource$Files$Get | null;

interface FileResponse {
  data: File;
}

interface AuthStatusResponse {
  data: boolean;
}

interface FormErrors {
  templateFileName?: string;
}

const App = () => {
  const [loading, , withLoadingState] = useLoadingState();
  const [errorMessage, setErrorMessage, guard] = useErrorState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [templateFile, setTemplateFile] = useState<File>(null);

  const getAuthStatus = guard<void, boolean>(
    async (): Promise<boolean> => {
      const { data }: AuthStatusResponse = await axios.get(routes.AUTH_STATUS);
      return data;
    },
  );

  const getFile = guard<string, void>(
    async (fileName) => {
      if (await getAuthStatus()) {
        setErrorMessage('');
        setTemplateFile(null);
        const { data }: FileResponse = await axios.get(`${routes.FILE}/${encodeURIComponent(fileName)}`);
        setTemplateFile(data);
      } else {
        setIsAuthenticated(false);
        setErrorMessage(ErrorMessage.AuthExpired);
      }
    },
  );

  useEffect(() => {
    const setAuthStatus = withLoadingState(async () => {
      setIsAuthenticated(await getAuthStatus() ?? false);
    });

    setAuthStatus().catch((error: Error) => setErrorMessage(error.message));
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
          const errors: FormErrors = {};
          if (!values.templateFileName) {
            errors.templateFileName = ErrorMessage.EmptyFileInput;
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
                  label={Label.FileQueryInput}
                  name="templateFileName"
                  type="text"
                  isLabelVisible={false}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !isAuthenticated}
                >
                  {Label.FileQueryButton}
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
        templateFile && <div>{JSON.stringify(templateFile)}</div>
      }
      {
        errorMessage && <div>{errorMessage}</div>
      }
      {
        loading ? <LoadingSpinner /> : null
      }
    </>
  );
};

export default App;
