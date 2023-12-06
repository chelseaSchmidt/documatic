import routes from 'modules/routes';

export class AxiosError extends Error {
  response = { data: '' };

  constructor(message: string) {
    super();
    this.response.data = message;
  }
}

export const MOCK_FILE = { id: '123' };

export default {
  get: (route: string) => {
    let data: unknown = '';

    switch (true) {
      case route === routes.AUTH_STATUS:
        data = true;
        break;
      case new RegExp(routes.FILE).test(route):
        data = MOCK_FILE;
        break;
      default:
        break;
    }

    return Promise.resolve({ data });
  },
};