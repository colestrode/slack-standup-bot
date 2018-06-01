#!/bin/bash
APP=slack-standup-bot

# pull the latest code
cd /opt/msys/slack-standup-bot
sudo git pull

# install dependencies
sudo /opt/msys/3rdParty/bin/npm install

# stop the service
if [[ -x /etc/init.d/$APP ]]
then
  sudo /etc/init.d/$APP stop
fi

# re-create the symlink
sudo rm /etc/init.d/msys-slack-standup-bot
sudo ln -s /opt/msys/slack-standup-bot/etc/msys-slack-standup-bot /etc/init.d/msys-slack-standup-bot

# start those service
if [[ -x /etc/init.d/$APP ]]
then
  sudo /etc/init.d/$APP start
fi
