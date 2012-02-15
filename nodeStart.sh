#!/bin/sh

# name:		nodeStart.sh
# desc:		simple startup script for onside node frontend
# usage:	./start.sh
# author:	richard shaw

NODE_ENV=production nodemon --debug server.js >> /var/log/node/onside-frontend.log 2>&1
