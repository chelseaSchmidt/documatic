export enum Label {
  App = 'App',
  AuthLink = 'Sign in',
  FileQueryButton = 'Get file',
  FileQueryInput = 'Template file input',
}

export enum SuccessMessage {
  Auth = 'Signed in',
}

export enum ErrorMessage {
  AuthExpired = 'Authentication expired, please sign in again',
  EmptyFileInput = 'Please enter a file name',
  Default = 'Something went wrong',
}
