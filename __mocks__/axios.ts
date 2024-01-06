/* eslint-disable @typescript-eslint/lines-between-class-members */

import routes from 'modules/routes';

export class AxiosError {
  response;
  request;

  constructor(data: unknown, isRequest = false) {
    if (isRequest) this.request = { data };
    else this.response = { data };
  }
}

export const MOCK_FILE = {
  metadata: { id: '123', webViewLink: 'link' },
  placeholders: ['{abc}'],
  tables: [],
};

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
  post: () => Promise.resolve({ data: MOCK_FILE }),
};
