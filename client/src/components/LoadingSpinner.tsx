import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const Spinner = styled.div`
  border: 5px solid lightgrey;
  border-top: 5px solid grey;
  border-radius: 50%;
  animation: spin 2s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const DEFAULT_SIZE = '25px';

interface LoadingSpinnerProps {
  width?: string;
  height?: string;
}

const LoadingSpinner = (
  {
    width = DEFAULT_SIZE,
    height = DEFAULT_SIZE,
  }: LoadingSpinnerProps,
) => (
  <Container
    role="progressbar"
    aria-busy="true"
    aria-live="polite"
    aria-valuetext="Loading..."
  >
    <Spinner style={{ width, height }} />
  </Container>
);

export default LoadingSpinner;
