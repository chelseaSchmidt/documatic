import { useState } from 'react';

const useLoadingState = (initial = false): [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
  (callback: () => Promise<unknown>) => () => Promise<unknown>,
] => {
  const [loading, setLoading] = useState(initial);

  const withLoadingState = (callback: () => Promise<unknown>) => {
    return async () => {
      setLoading(true);
      let result;
      try {
        result = await callback();
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
