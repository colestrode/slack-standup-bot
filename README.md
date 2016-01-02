# Slack Stand-Up Bot

Hi! I'm a friendly Slack bot who will run stand ups for you! I'll even summarize everything and post summaries in the channel of your choosing!

## Summaries

After everyone has checked in, the stand up bot will post a summary message in a channel of your choice.

## Commands
Type `@bot help` to get a list of these commands.

_Running a stand up:_

`@bot start`: Start a stand up.

`@bot end`: End a stand up that's in progress. Stand ups will end on their own once everyone has reported, so this is only if you need to end early.

`@bot report in #channel`: Set a channel for post stand up reports. By default I'll use the channel the stand up started in.
I have a pretty good memory, so you only need to tell me once :)

`skip`: Use this during a stand up to skip a user.

_Adding and removing team members:_

I'll keep track of your team for you!

`@bot members`: Lists the current members of the team.

`@bot join`: Adds you to the team.

`@bot leave`: Removes you from the team.

`@bot remove @user`: Removes another user from the team.

## Set Up

Clone this repo and deploy it to your favorite server, I'm all set up for Heroku in case that's your thing.
Since I need to remember stuff, I'll need access to a Redis server too.

Go to this page set me up in Slack: https://my.slack.com/services/new/bot

Then you'll need to set two environment variables on your server:

`SLACK_API_TOKEN`: Your Slack API token. Read through this doc on how to set up bots with Slack: 

`REDIS_URL`: The URL to the Redis store that I'll use for my tremendous robot brain.
