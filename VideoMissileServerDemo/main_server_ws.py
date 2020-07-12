#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import time
from vsocket 	import websocket_srv 	as WebsocketSrv
# from vsocket	import common			as WebsocketSrvCommon
# from vcodec 	import video 			as VideoSrv


# _stream_vod = None

# def notify(clients=[],recv_client="",recv_message=""): # self.username + ": " + 
#     print "recv {}, {}".format(recv_client,recv_message)

#     for conn_client,connection in clients.items():
#     	if conn_client == recv_client:
# 	        print connection,"===>",recv_client

# 	        # CHECK CMD
# 	        # print recv_message
# 	        if recv_message == "PLAY":
# 	        	hevc_stream_vod = VideoSrv.Vod()
#     			hevc_stream_vod.fileInputInit("../videosdemo/veilside1.hevc")
# 		        if hevc_stream_vod is not None:
# 		        	fps = 30

# 		        	while True:
# 			        	frame_msg,is_continue = hevc_stream_vod.fileReadUnit()
# 			        	# print frame_msg,is_continue

# 			        	if is_continue != 0:
# 							break

# 			        	msg = WebsocketSrvCommon.packSendMsg(frame_msg)

# 			        	# print len(frame_msg)
# 			        	# send_data = '%c%c%s' % (0x81, len(frame_msg), frame_msg)
# 			        	# print send_data
# 			        	try:
# 			        		send_res = connection.send(msg)
# 			        	except Exception,e:
# 			        		print e
# 			        		clients.pop(conn_client)
# 			        		connection.close()
# 			        		break

# 			        	print send_res
# 			        	time.sleep(round(1.0/30,3))

# 			break

if __name__ == '__main__':
    server = WebsocketSrv.WebsocketServer("127.0.0.1",10084)
    server.start() #async

    # _stream_vod = VideoSrv.Vod()
    # _stream_vod.fileInputInit("../videosdemo/veilside1.hevc")


