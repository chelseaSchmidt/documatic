import { AxiosError } from 'axios';
import { ErrorMessage } from 'src/constants';
import { useState } from 'react';

const useErrorState = (initial = ''): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  (callback: () => Promise<unknown>) => () => Promise<unknown>,
] => {
  const [errorMessage, setErrorMessage] = useState(initial);

  const guard = (callback: () => Promise<unknown>) => {
    return async () => {
      let result;
      try {
        result = await callback();
      } catch (error) {
        setErrorMessage(
          (typeof error === 'string' ? error : null)
          || ((error as AxiosError).response?.data as string)
          || (error as Error).message
          || ErrorMessage.Default,
        );
      }
      return result;
    };
  };

  return [errorMessage, setErrorMessage, guard];
};

export default useErrorState;
