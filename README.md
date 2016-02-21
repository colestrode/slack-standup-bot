# Slack Stand-Up Bot
[![Build Status](https://travis-ci.org/colestrode/slack-standup-bot.svg?branch=master)](https://travis-ci.org/colestrode/slack-standup-bot)
[![Coverage Status](https://coveralls.io/repos/github/colestrode/slack-standup-bot/badge.svg?branch=master)](https://coveralls.io/github/colestrode/slack-standup-bot?branch=master)
[![Dependcies](https://david-dm.org/colestrode/slack-standup-bot.svg)](https://david-dm.org/colestrode/slack-standup-bot)

Hi! I'm a friendly Slack bot who will run stand ups for you! I'll even summarize everything and post summaries in the channel of your choosing!

## Summaries

After everyone has checked in, I'll post a summary message in a channel of your choice. You can tell me which channel by 
using the `report in` command (details down there in the Commands section). 
Just make sure to invite me to the reporting channel first, I may be a robot but I still have feelings.  

If the summary is too long, I'll split it across a few posts. These are true Slack Posts, so searchable and support markdown.

## Commands
Type `@bot help` to get a list of these commands.

_Running a stand up:_

`@bot start`: Start a stand up.

`@bot end`: End a stand up that's in progress. Stand ups will end on their own once everyone has reported, so this is only if you need to end early.

`@bot report in #channel`: Set a channel for post stand up reports. By default I'll use the channel the stand up started in.
I have a pretty good memory, so you only need to tell me once :)

`@bot where do you report?`: I'll tell you the which channel I'll post summary reports to..

`skip`: Use this during a stand up to skip a user.

_Adding and removing team members:_

I'll keep track of your team for you across standups!

`@bot members`: Lists the current members of the team.

`@bot join`: Adds you to the team.

`@bot leave`: Removes you from the team.

`@bot remove @user`: Removes another user from the team.

## Set Up

Clone this repo and deploy it to your favorite server. I'm all set up for Heroku in case that's your thing.
Since I need to remember stuff, I'll need access to a Redis server too.

Go to this page set me up in Slack: https://my.slack.com/services/new/bot

Then you'll need to set two environment variables on your server:

`SLACK_API_TOKEN`: Your Slack API token that you got from the Slack bot page.

`REDIS_URL`: The URL to the Redis server that I'll use for my tremendous robot brain (don't worry, I don't put much there).
