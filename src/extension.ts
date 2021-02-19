import * as vscode from 'vscode';
import {Configuration, UserStatusConfiguration} from './configuration';
import {COMMAND_UPDATE, STATUS_BAR_ITEM_DEFAULT_TEXT} from './constants';
import {GitHub} from './github';
import {createGithubClient} from './github-client';
import {Slack} from './slack';
import {updateStatusBarItem} from './utils/update-status-bar-item';

export type Status = typeof import('./i18n/en/status.json');
/**
 * Read status.json
 *
 * @param language - language The current language
 */
const importStatus = (language: 'en' | 'ja'): Promise<Status> => {
  if (language === 'ja') {
    return import('./i18n/ja/status.json');
  }

  return import('./i18n/en/status.json');
};

/**
 * Create the status bar item
 */
const createStatusBar = (): vscode.StatusBarItem => {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1,
  );
  statusBarItem.command = COMMAND_UPDATE;
  statusBarItem.text = STATUS_BAR_ITEM_DEFAULT_TEXT;

  return statusBarItem;
};

/**
 * Read Slack section of the settings
 * If required of the settings is not enough, this returns `undefined`
 */
const getSlackSettings = (
  configuration: Configuration,
): UserStatusConfiguration['slack'] | undefined => {
  let slack: ReturnType<typeof getSlackSettings>;

  if (configuration.isEnabledSlack()) {
    const invalidProps = configuration.verifySlackSettings();
    if (invalidProps.length > 0) {
      vscode.window.showWarningMessage(
        `\`userStatus.slack\` is required: ${invalidProps.join()}`,
      );
      return;
    }

    slack = configuration.slack as ReturnType<typeof getSlackSettings>;
  }

  return slack;
};

/**
 * Read GitHub section of the settings
 * If required of the settings is not enough, this returns `undefined`
 */
const getGithubSettings = (
  configuration: Configuration,
): UserStatusConfiguration['github'] | undefined => {
  let github: ReturnType<typeof getGithubSettings>;

  if (configuration.isEnabledGithub()) {
    const invalidProps = configuration.verifyGithubSettings();
    if (invalidProps.length > 0) {
      vscode.window.showWarningMessage(
        `\`userStatus.github\` is required: ${invalidProps.join()}`,
      );
      return;
    }

    github = configuration.github as
      | UserStatusConfiguration['github']
      | undefined;
  }

  return github;
};

/**
 * Activate
 */
export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const statusBarItem = createStatusBar();
  context.subscriptions.push(statusBarItem);

  const commandDisposable = vscode.commands.registerCommand(
    COMMAND_UPDATE,
    async () => {
      const configuration = new Configuration();

      /**
       * Show the status list from the current language of settings
       */
      const showQuickPick = (): Thenable<vscode.QuickPickItem | undefined> => {
        return vscode.window.showQuickPick<vscode.QuickPickItem>(
          importStatus(configuration.language).then(json => {
            const list = Object.entries({...json, ...configuration.status})
              .sort((lhs, rhs) => {
                return rhs[1].priority - lhs[1].priority;
              })
              .map(([emoji, {text}]) => ({
                label: `${emoji} ${text}`.trim(),
              }));

            if (statusBarItem.text !== STATUS_BAR_ITEM_DEFAULT_TEXT) {
              list.unshift({
                label: 'Clear status',
              });
            }

            return list;
          }),
        );
      };

      const quickPickItem = await showQuickPick();

      if (quickPickItem === undefined) {
        return;
      }

      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      const emoji = quickPickItem.label!.split(/\s/)[0];
      /* eslint-enable @typescript-eslint/no-non-null-assertion */

      let targetStatus: {
        slack: {
          emojiName: string;
        };
        github: {
          emojiName: string;
        };
        text: string;
      };

      if (quickPickItem.label === 'Clear status') {
        targetStatus = {
          slack: {
            emojiName: '',
          },
          github: {
            emojiName: '',
          },
          text: '',
        };
      } else {
        targetStatus = await importStatus(configuration.language).then(
          status =>
            ({...status, ...configuration.status}[
              emoji as keyof typeof status
            ]),
        );
      }

      /**
       * Update the user status of GitHub if enabled
       */
      if (configuration.isEnabledSlack()) {
        await (async (): Promise<void> => {
          const settings = await getSlackSettings(configuration);
          if (settings === undefined) {
            return;
          }

          await Promise.all(
            settings.workspaces.map(workspace => {
              const slack = new Slack(workspace.user, workspace.accessToken);

              return slack
                .setProfile(targetStatus.slack.emojiName, targetStatus.text)
                .catch(error => {
                  throw error;
                });
            }),
          ).catch(error => {
            throw error;
          });
        })();
      }

      /**
       * Update the user status of GitHub if enabled
       */
      if (configuration.isEnabledGithub()) {
        await (async (): Promise<void> => {
          const settings = await getGithubSettings(configuration);
          if (settings === undefined) {
            return;
          }

          const client = createGithubClient(settings.accessToken);
          const github = new GitHub(client, settings.username);

          await github
            .setProfile(targetStatus.github.emojiName, targetStatus.text)
            .then(error => {
              if (error !== undefined) {
                throw error;
              }
            });
        })();
      }

      if (quickPickItem.label === 'Clear status') {
        statusBarItem.text = STATUS_BAR_ITEM_DEFAULT_TEXT;
      } else {
        statusBarItem.text = `${emoji} ${targetStatus.text}`;
      }

      statusBarItem.show();
    },
  );

  /**
   * Get the settings of each section, and the status bar item initialize
   */
  const setup = async (): Promise<void> => {
    const configuration = new Configuration();
    const status = await importStatus(configuration.language);

    let slack: UserStatusConfiguration['slack'] | undefined;
    let github: UserStatusConfiguration['github'] | undefined;

    if (configuration.isEnabledSlack()) {
      slack = getSlackSettings(configuration);
    }

    if (configuration.isEnabledGithub()) {
      github = getGithubSettings(configuration);
    }

    await updateStatusBarItem(statusBarItem, status, {
      priority: configuration.priority,
      github,
      slack,
    });
  };

  await setup();

  /**
   * When a target window has changed, re-run setup
   */
  const eventDisposable = vscode.window.onDidChangeWindowState(windowState => {
    if (windowState.focused) {
      setup();
    }
  });

  context.subscriptions.push(commandDisposable);
  context.subscriptions.push(eventDisposable);
}

// This method is called when your extension is deactivated
// Export function deactivate() {}
