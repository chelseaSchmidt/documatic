import { AsyncMethod, Decorator, Nullable } from 'src/types';
import { AxiosError } from 'axios';
import { ErrorMessage } from 'src/constants';
import { useState } from 'react';

interface ErrorData {
  message: string;
  cause?: string;
}

interface AxiosServerError {
  response: {
    data: string | ErrorData;
  };
}

const axiosErrorToErrorData = (error: AxiosServerError) => {
  const { response: { data } } = error;

  return typeof data === 'string'
    ? { message: data }
    : data;
};

const useErrorState = (initial: Nullable<ErrorData>): [
  Nullable<ErrorData>,
  React.Dispatch<React.SetStateAction<Nullable<ErrorData>>>,
  Decorator,
] => {
  const [errorData, setErrorData] = useState(initial);

  const guard = <I, R>(originalMethod: AsyncMethod<I, R>) => {
    return async (...args: I[]) => {
      let result = null;

      try {
        result = await originalMethod(...args);
      } catch (error) {
        let data: ErrorData = { message: ErrorMessage.Default };

        if (typeof error === 'string') {
          data.message = error;
        }

        if (error instanceof Error) {
          data = { message: error.message, cause: error.stack };
        }

        if (error instanceof AxiosError) {
          if (error.request) data.message = ErrorMessage.NoServerResponse;
          if (error.response) data = axiosErrorToErrorData(<AxiosServerError>error);
        }

        setErrorData(data);
      }

      return result;
    };
  };

  return [errorData, setErrorData, guard];
};

export default useErrorState;
