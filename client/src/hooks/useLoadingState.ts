import { AsyncMethod, Decorator } from 'src/types';
import { useState } from 'react';

const useLoadingState = (initial = false): [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
  Decorator,
] => {
  const [loading, setLoading] = useState(initial);

  const withLoadingState = <I, R>(originalMethod: AsyncMethod<I, R>) => {
    return async (...args: I[]) => {
      setLoading(true);
      let result = null;
      try {
        result = await originalMethod(...args);
      } catch (error) {
        setLoading(false);
        throw error;
      }
      setLoading(false);
      return result;
    };
  };

  return [loading, setLoading, withLoadingState];
};

export default useLoadingState;
