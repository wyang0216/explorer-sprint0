import {workspace, WorkspaceConfiguration} from 'vscode';
import {EXTENSION_CONFIGRATION_SCOPE} from './constants';

export interface UserStatusFlattenSlackConfiguration {
  enable: boolean;
  user: string;
  accessToken: string;
  workspaces?: never;
}

export interface UserStatusSlackConfiguration {
  enable: boolean;
  workspaces: {
    user: string;
    accessToken: string;
  }[];
  user?: never;
  accessToken?: never;
}

export interface UserStatusConfiguration {
  language: 'en' | 'ja';
  priority: 'github' | 'slack';
  status: Record<
    string,
    {
      github: {
        emojiName: string;
      };
      slack: {
        emojiName: string;
      };
      text: string;
      priority: number;
    }
  >;
  slack: UserStatusSlackConfiguration;
  github: {
    enable: boolean;
    username: string;
    accessToken: string;
  };
}

// Export type UserStatusSlackConfiguration =
//   | UserStatusConfiguration['slack']
//   | UserStatusFlattenSlackConfiguration;

export class Configuration {
  private readonly configuration: WorkspaceConfiguration;

  constructor() {
    this.configuration = workspace.getConfiguration(
      EXTENSION_CONFIGRATION_SCOPE,
    );
  }

  get language(): UserStatusConfiguration['language'] {
    return this.configuration.get('language') ?? 'en';
  }

  get priority(): UserStatusConfiguration['priority'] {
    return this.configuration.get('priority') ?? 'github';
  }

  get status(): UserStatusConfiguration['status'] {
    return this.configuration.get('status') ?? {};
  }

  get slack(): Partial<UserStatusConfiguration['slack']> | undefined {
    const normalize = (
      slackConfiguratioon:
        | UserStatusFlattenSlackConfiguration
        | UserStatusSlackConfiguration
        | undefined,
    ): Partial<UserStatusConfiguration['slack']> | undefined => {
      if (slackConfiguratioon === undefined) {
        return;
      }

      if (slackConfiguratioon.user !== undefined) {
        const {enable, ...workspace} = slackConfiguratioon;
        return {
          enable,
          workspaces: [workspace],
        };
      }

      return slackConfiguratioon;
    };

    return normalize(
      this.configuration.get<
        | UserStatusFlattenSlackConfiguration
        | UserStatusSlackConfiguration
        | undefined
      >('slack'),
    );
  }

  get github(): Partial<UserStatusConfiguration['github']> | undefined {
    return this.configuration.get('github');
  }

  /**
   * Whether the Slack of the settings is enabled
   */
  isEnabledSlack(): boolean {
    return Boolean(this.slack?.enable);
  }

  /**
   * Whether the slack settings is valid
   *
   * @returns Invalid props names
   */
  verifySlackSettings(): string[] {
    const slack = this.slack;
    const invalidProps: string[] = [];

    if (slack === undefined) {
      throw new TypeError('Expect slack is object, but got undefined');
    }

    if (slack.workspaces === undefined) {
      invalidProps.push('slack.workspaces');

      return invalidProps;
    }

    slack.workspaces.forEach((workspace, i) => {
      if (typeof workspace.user !== 'string') {
        invalidProps.push(`slack.workspaces[${i}].user`);
      }

      if (typeof workspace.accessToken !== 'string') {
        invalidProps.push(`slack.workspaces[${i}].accessToken`);
      }
    });

    return invalidProps;
  }

  /**
   * Whether the GitHub of the settings is enabled
   */
  isEnabledGithub(): boolean {
    return Boolean(this.github?.enable);
  }

  /**
   * Whether the slack settings is valid
   *
   * @returns Invalid props names
   */
  verifyGithubSettings(): string[] {
    const github = this.github;
    const invalidProps: string[] = [];

    if (typeof github?.username !== 'string') {
      invalidProps.push('github.username');
    }

    if (typeof github?.accessToken !== 'string') {
      invalidProps.push('github.accessToken');
    }

    return invalidProps;
  }
}
