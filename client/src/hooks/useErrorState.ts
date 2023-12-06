import { AsyncMethod, Decorator } from 'src/types';
import { AxiosError } from 'axios';
import { ErrorMessage } from 'src/constants';
import { useState } from 'react';

const useErrorState = (initial = ''): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  Decorator,
] => {
  const [errorMessage, setErrorMessage] = useState(initial);

  const guard = <I, R>(originalMethod: AsyncMethod<I, R>) => {
    return async (...args: I[]) => {
      let result = null;
      try {
        result = await originalMethod(...args);
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
