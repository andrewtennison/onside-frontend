#!/bin/sh

# name:		nodeStart.sh
# desc:		simple startup script for onside node frontend
# usage:	./start.sh
# author:	richard shaw

NODE_ENV=production nodemon server.js >> /var/log/node/beta.onside.me.log 2>&1
