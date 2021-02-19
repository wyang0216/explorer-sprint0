import {workspace} from 'vscode';
import {Configuration} from './configuration';
import {EXTENSION_CONFIGRATION_SCOPE} from './constants';

jest.mock('vscode');

describe('Configuration', () => {
  it(`call getConfiguration with ${EXTENSION_CONFIGRATION_SCOPE}`, () => {
    // eslint-disable-next-line no-new
    new Configuration();

    expect(workspace.getConfiguration).toHaveBeenCalledWith(
      EXTENSION_CONFIGRATION_SCOPE,
    );
  });

  describe.each([['slack'], ['github']])('%s section', () => {
    describe('enabled', () => {
      test.each<[object | undefined, boolean]>([
        [undefined, false],
        [{}, false],
        [
          {
            enable: true,
          },
          true,
        ],
      ])('When WorkspaceConfiguration#get returns %p', (settings, expected) => {
        const configuration = new Configuration();
        jest
          .spyOn(workspace.getConfiguration(), 'get')
          .mockReturnValueOnce(settings);

        expect(configuration.isEnabledSlack()).toBe(expected);
      });
    });

    describe('Configuration#verifySlackSettings', () => {
      test.each<[object, string[]]>([
        [{}, ['slack.workspaces']],
        [{workspaces: [{user: '...'}]}, ['slack.workspaces[0].accessToken']],
        [{workspaces: [{accessToken: '...'}]}, ['slack.workspaces[0].user']],
        [
          {
            workspaces: [
              {user: '...', accessToken: '...'},
              {accessToken: '...'},
            ],
          },
          ['slack.workspaces[1].user'],
        ],
        [
          {
            workspaces: [
              {user: '...', accessToken: '...'},
              {accessToken: '...'},
            ],
          },
          ['slack.workspaces[1].user'],
        ],
        [
          {
            workspaces: [
              {user: '...', accessToken: '...'},
              {user: '...', accessToken: '...'},
            ],
          },
          [],
        ],
      ])('When %p, it returns %p', (settings, expected) => {
        const configuration = new Configuration();
        jest
          .spyOn(workspace.getConfiguration(), 'get')
          .mockReturnValueOnce(settings);

        expect(configuration.verifySlackSettings()).toEqual(
          expect.arrayContaining(expected),
        );
      });
    });

    describe('Configuration#verifyGithubSettings', () => {
      test.each<[object, string[]]>([
        [{username: '...'}, ['github.accessToken']],
        [{accessToken: '...'}, ['github.username']],
        [{username: '...', accessToken: '...'}, []],
      ])('When %p, it returns %p', (settings, expected) => {
        const configuration = new Configuration();
        jest
          .spyOn(workspace.getConfiguration(), 'get')
          .mockReturnValueOnce(settings);

        expect(configuration.verifyGithubSettings()).toEqual(
          expect.arrayContaining(expected),
        );
      });
    });
  });
});
