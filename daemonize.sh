#!/bin/sh

if [ -e /tmp/node.lock ]
then
	exit;
fi;
echo locked > /tmp/node.lock
cd /home/wschat
./node app.js

rm /tmp/node.lock
