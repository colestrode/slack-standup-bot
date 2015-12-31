# Slack Stand-Up Bot

A bot that will run stand ups for you and post summaries in a channel!

## Summaries

After everyone has checked in, the stand up bot will post a summary message in a channel of your choice.

## Commands
Type `@bot help` to get a list of these commands.

_Running a stand up:_

`@bot start`: Start a stand up.

`@bot end`: End an stand up in progress. stand ups will end on their own once everyone has reported.

`@bot report in #channel`: Set a channel for post stand up reports. By default ' + botName will use the channel the stand up started in.

`skip`: Use this during a stand up to skip a user.

_Adding and removing members:_

`@bot members`: Lists the current members of the team.

`@bot join`: Adds the current user to the team.

`@bot leave`: Removes the current user from the team.

`@bot remove @user`: Removes a user from the team.

## Set Up

You'll need to set two environment variables:

`SLACK_API_TOKEN`: Your Slack API token

`REDIS_URL`: The url to the redis store that will be used to persist data across restarts.