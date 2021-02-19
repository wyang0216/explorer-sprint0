export enum StatusBarAlignment {
  Left,
  Right,
}

export const commands = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerCommand: jest.fn().mockReturnValue(() => {}),
};

export const window = {
  createStatusBarItem: jest.fn().mockReturnValue({
    show: jest.fn(),
    command: '',
    text: '',
  }),
  onDidChangeWindowState: jest.fn().mockReturnValue(undefined),
};

export const workspace = {
  getConfiguration: jest.fn().mockReturnValue({
    get: jest.fn(),
  }),
};
