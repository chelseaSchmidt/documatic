/* eslint-disable prefer-arrow-callback */
import 'styles/main.css';
import { ErrorMessage, Label, SuccessMessage } from 'src/constants';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { drive_v3 } from 'googleapis';
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

const App = () => {
  const [loading, , withLoadingState] = useLoadingState();
  const [errorMessage, setErrorMessage, guard] = useErrorState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [templateFileQuery, setTemplateFileQuery] = useState('');
  const [templateFile, setTemplateFile] = useState<File>(null);

  const TEMPLATE_INPUT_ID = 'template-file-input';

  const getAuthStatus = guard(
    async (): Promise<boolean> => {
      const { data }: AuthStatusResponse = await axios.get(routes.AUTH_STATUS);
      return data;
    },
  );

  const getFile = guard(
    async () => {
      if (await getAuthStatus()) {
        setErrorMessage('');
        setTemplateFile(null);
        if (templateFileQuery) {
          const { data }: FileResponse = await axios.get(`${routes.FILE}/${encodeURIComponent(templateFileQuery)}`);
          setTemplateFile(data);
        } else {
          setErrorMessage(ErrorMessage.EmptyFileInput);
        }
      } else {
        setIsAuthenticated(false);
        setErrorMessage(ErrorMessage.AuthExpired);
      }
    },
  );

  useEffect(function setAuthStatus() {
    withLoadingState(async () => setIsAuthenticated(await getAuthStatus() as boolean))()
      .catch((error) => {
        setErrorMessage((error as Error).message);
      });
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

      {/* TODO: Formik */}

      <label
        htmlFor={TEMPLATE_INPUT_ID}
        hidden
      >
        {Label.FileQueryInput}
      </label>

      <input
        id={TEMPLATE_INPUT_ID}
        type="text"
        onChange={(e) => setTemplateFileQuery(e.target.value)}
      />

      <button
        type="button"
        onClick={withLoadingState(getFile)}
        disabled={!isAuthenticated}
      >
        {Label.FileQueryButton}
      </button>

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
