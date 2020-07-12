#!/usr/bin/env python
# -*- encoding: utf-8 -*-
import struct
import threading

def async(f):
    def wrapper(*args, **kwargs):
        thr = threading.Thread(target=f, args=args, kwargs=kwargs)
        thr.start()
    return wrapper

def packSendMsg(msg = ""):

    sendMsg = struct.pack('!B', 0x81)
    length  = len(msg)

    if length <= 125:
        sendMsg += struct.pack('!B', length)

    elif length <= 65536:
        sendMsg += struct.pack('!B', 126)
        sendMsg += struct.pack('!H', length)

    elif length == 127:
        sendMsg += struct.pack('!B', 127)
        sendMsg += struct.pack('!Q', length)

    sendMsg += struct.pack('!%ds' % (length), msg.encode())
    return sendMsg