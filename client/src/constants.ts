export enum Label {
  App = 'App',
  AuthLink = 'Sign in',
  FileSearchButton = 'Get file',
  FileSearchInput = 'Template file input',
  FileCreationButton = 'Create document',
  FileName = 'File name',
  FolderName = 'Save to folder',
}

export enum SuccessMessage {
  Auth = 'Signed in',
}

export enum ErrorMessage {
  AuthExpired = 'Authentication expired, please sign in again',
  NoServerResponse = 'Server not responding',
  EmptyFileInput = 'Please enter a file name',
  EmptyFolderInput = 'Please enter a folder name',
  Default = 'Something went wrong',
}
