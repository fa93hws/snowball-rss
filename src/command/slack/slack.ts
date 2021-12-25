import type { CommandModule } from 'yargs';
import { SlackService } from '@services/slack-service';

async function handler() {
  const service = new SlackService({
    botUserToken: process.env.SLACK_BOT_USER_TOKEN,
    userToken: process.env.SLACK_USER_TOKEN,
  });
  await service.postMessage({
    blocks: [],
    channel: 'C02S9US4XEV',
  });
}

export const commandModule: CommandModule<{}, {}> = {
  command: 'by-slack',
  describe: 'schedule fetching from snowball rss and notifiy subscribers',
  builder: (yargs) => yargs,
  handler,
};
