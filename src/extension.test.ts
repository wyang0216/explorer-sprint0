import {commands, ExtensionContext} from 'vscode';
import {COMMAND_UPDATE} from './constants';
import {activate} from './extension';

jest.mock('vscode');

describe('activate', () => {
  let context: ExtensionContext;

  beforeEach(async () => {
    context = ({
      subscriptions: {push: jest.fn()},
    } as unknown) as ExtensionContext;

    await activate(context);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('context.subscriptions.push is called 3 times', async () => {
    expect(context.subscriptions.push).toHaveBeenCalledTimes(3);
  });

  it(`register the command ${COMMAND_UPDATE}`, async () => {
    expect(
      ((commands.registerCommand as unknown) as jest.Mock).mock.calls[0][0],
    ).toBe(COMMAND_UPDATE);
  });
});
