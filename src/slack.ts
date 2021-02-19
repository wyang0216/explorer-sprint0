import fetch from 'node-fetch';
import {UserStatusSlackConfiguration} from './configuration';

export const SLACK_API = Object.freeze({
  usersProfileSet: 'https://slack.com/api/users.profile.set',
  usersProfileGet: 'https://slack.com/api/users.profile.get',
});

export interface SlackUsersProfileSetOkResponse {
  ok: true;
  profile: {
    /**
     * When not set, this is ''
     */
    status_text: string;
    /**
     * String that like `:books:`
     * When not set, this is ''
     */
    status_emoji: string;
  };
}

export interface SlackUsersProfileSetErrorResponse {
  ok: false;
  error: string;
}

export type SlackUsersProfileSetResponse =
  | SlackUsersProfileSetOkResponse
  | SlackUsersProfileSetErrorResponse;

export class SlackUsersProfileSet {
  constructor(public readonly headers: Record<string, string>) {}

  createBody(
    emojiName: string,
    text: string,
  ): Record<string, Record<string, string | number>> {
    /* eslint-disable @typescript-eslint/camelcase */
    return {
      profile: {
        status_emoji: emojiName === '' ? emojiName : `:${emojiName}:`,
        status_text: text,
        status_expiration: 0,
      },
    };
    /* eslint-enable @typescript-eslint/camelcase */
  }

  async run(emojiName: string, text: string): Promise<void> {
    await fetch(SLACK_API.usersProfileSet, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(this.createBody(emojiName, text)),
    })
      .then<SlackUsersProfileSetResponse>(res => res.json())
      .then(data => {
        if (!data.ok) {
          throw new Error(data.error);
        }
      })
      .catch(error => {
        throw error;
      });
  }
}

export class SlackUsersProfileGet {
  constructor(public readonly headers: Record<string, string>) {}

  async run(): Promise<{text: string; emojiName: string}> {
    return fetch(SLACK_API.usersProfileGet, {
      method: 'GET',
      headers: this.headers,
    })
      .then<SlackUsersProfileSetResponse>(res => res.json())
      .then(data => {
        if (!data.ok) {
          throw new Error(data.error);
        }

        if (data.profile.status_emoji !== '') {
          return {
            text: data.profile.status_text,
            emojiName: data.profile.status_emoji.split(':')[1],
          };
        }

        return {
          text: data.profile.status_text,
          emojiName: data.profile.status_emoji,
        };
      })
      .catch(error => {
        throw error;
      });
  }
}

export class Slack {
  constructor(
    public readonly user: UserStatusSlackConfiguration['workspaces'][0]['user'],
    public readonly accessToken: UserStatusSlackConfiguration['workspaces'][0]['accessToken'],
  ) {}

  get headers(): Record<string, string> {
    return {
      'content-type': 'application/json;charset=utf-8',
      authorization: `Bearer ${this.accessToken}`,
    };
  }

  async setProfile(emojiName: string, text: string): Promise<void> {
    const slackUsersProfileSet = new SlackUsersProfileSet(this.headers);

    await slackUsersProfileSet.run(emojiName, text).catch(error => {
      throw error;
    });
  }

  async getProfile(): Promise<{text: string; emojiName: string}> {
    const slackUsersProfileGet = new SlackUsersProfileGet(this.headers);

    return slackUsersProfileGet.run().catch(error => {
      throw error;
    });
  }
}
