#!/bin/bash
ps aux | grep main_server_ws.py | grep -v grep | awk '{print $2}' | xargs kill -9
