module.exports.use = function(controller) {
  controller.hears('help', 'direct_mention', function(bot, message) {
    var botName = '@' + bot.identity.name;

    var helpMessage = '' +
      'Once a standup has started ' + botName + ' will ask each member of the team three questions. ' +
      'Once all members have checked in, the stand up will end and a summary will be posted to the summary channel\n\n' +

      '_Running a standup:_\n' +
      '`' + botName + ' start`: Start a standup\n' +
      '`' + botName + ' end`: End an standup in progress. Standups will end on their own once everyone has reported.\n' +
      '`' + botName + ' report in #channel`: Set a channel for post standup reports. By default ' + botName + ' will use the channel the standup started in.\n' +
      '`skip`: Use this during a standup to skip a user.\n' +
      '\n' +
      '_Adding and removing members:_\n' +
      '`' + botName + ' join`: Adds the current user to the team.\n' +
      '`' + botName + ' leave`: Removes the current user from the team.\n' +
      '`' + botName + ' remove @user`: Removes a user from the team.\n' +
      '`' + botName + ' members`: Lists the current members of the team.\n' +
      '';

    bot.reply(message, helpMessage);
  });
};