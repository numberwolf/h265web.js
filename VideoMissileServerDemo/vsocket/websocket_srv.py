#!/usr/bin/env python
# -*- encoding: utf-8 -*-
import threading
import traceback
import hashlib
import socket
import base64
import time
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
sys.path.append('../')

from vcodec     import codec
from vcodec     import video            as VideoSrv
from vcodec     import audio            as AudioSrv
from vsocket    import common           as WebsocketSrvCommon
 
# global clients
clients = {}
G_FRAME_LEN = 10;
 
# #通知客户端
# def notify(clients=[],client="",recv_message=""): # self.username + ": " + 
#     print "recv {}, {}".format(username,message
#         )
#     for connection in clients.values():
#         print connection,"===>"
#         connection.send('%c%c%s' % (0x81, len(message), message))
 
#客户端处理线程
class WebsocketThread(threading.Thread):
    def __init__(self, connection, username):
        super(WebsocketThread, self).__init__()
        self.connection = connection
        self.username   = username

    @WebsocketSrvCommon.async
    def call_notify(self, recv_message = ""): # self.username + ": " + 
        global clients
        global G_FRAME_LEN
        print self.connection,"===>",self.username,recv_message

        # CHECK CMD
        # print recv_message
        if recv_message == "1001":
            hevc_stream_vod = VideoSrv.Vod()
            aac_stream_aod  = AudioSrv.Aod()

            hevc_stream_vod.fileInputInit("../videosdemo/veilside.hevc")
            aac_stream_aod.fileInputInit("../videosdemo/veilside.aac")

            # hevc_stream_vod.fileInputInit("../videosdemo/jitui.hevc")
            # aac_stream_aod.fileInputInit("../videosdemo/jitui.aac")

            if hevc_stream_vod is not None:
                timeStartVideo = time.time()
                timeStartAudio = time.time()
                while True:
                    if self.username not in clients:
                        break

                    onceLoopStartTime = time.time()

                    videoFileReadUnitStartTime = time.time()
                    frame_msg, v_is_continue  = hevc_stream_vod.fileReadUnit()
                    # print "[SEND VIDEO]"
                    # print type(frame_msg), frame_msg, v_is_continue
                    print "videoFileReadUnitStartTime:",time.time() - videoFileReadUnitStartTime

                    audioFileReadUnitStartTime = time.time()
                    sample_msg = ''
                    for i in range(0, G_FRAME_LEN):
                        sample_item, a_is_continue = aac_stream_aod.fileReadUnit()
                        if a_is_continue == -2:
                            break

                        if a_is_continue == -1:
                            continue

                        sample_msg = "{}{}".format(sample_msg, sample_item)

                    sample_msg = "{}{}".format(codec.SLICE_TAG_AUDIO, sample_msg)
                    # print "[SEND AUDIO]"
                    # print type(sample_msg), sample_msg, a_is_continue

                    print "audioFileReadUnitStartTime:",time.time() - audioFileReadUnitStartTime

                    if v_is_continue == -2 and a_is_continue == -2:
                        print "[video time spend]", (time.time() - timeStartVideo)
                        break

                    try:
                        # 以视频为主
                        if v_is_continue != -1:
                            if v_is_continue != -2:
                                msg_v       = WebsocketSrvCommon.packSendMsg(frame_msg)
                                send_v_res  = self.connection.send(msg_v)
                            else:
                                print "[video time spend]", (time.time() - timeStartVideo)

                        if a_is_continue != -1:
                            if a_is_continue != -2:
                                msg_a       = WebsocketSrvCommon.packSendMsg(sample_msg)
                                send_a_res  = self.connection.send(msg_a)
                            else:
                                print "[audio time spend]", (time.time() - timeStartAudio)


                    except Exception, e:
                        print "error:", e
                        traceback.print_exc()
                        clients.pop(self.username)
                        self.connection.close()
                        break

                    # print send_v_res, send_a_res
                    # fps = 90
                    # time.sleep(round(1.0/fps, 3))

                    print "onceLoopStartTime:",time.time() - onceLoopStartTime

            # close
            hevc_stream_vod.exitRead();
            aac_stream_aod.exitRead();

        if recv_message == "1002":
            clients.pop(self.username)
            self.connection.close()

        return 0

    
    def run(self):
        print 'new websocket client joined!'
        data    = self.connection.recv(8096)
        headers = self.parse_headers(data)
        token   = self.generate_token(headers['Sec-WebSocket-Key'])

        self.connection.send('\
HTTP/1.1 101 WebSocket Protocol Hybi-10\r\n\
Upgrade: WebSocket\r\n\
Connection: Upgrade\r\n\
Sec-WebSocket-Accept: %s\r\n\r\n' % token)

        while True:
            if self.username not in clients:
                print "{} not in clients",format(self.username)
                break

            try:
                data = self.connection.recv(8096)
            except socket.error, e:
                # print "unexpected error: ", e
                traceback.print_exc()

                if self.username in clients:
                    clients.pop(self.username)
                    clients[self.username].close()
                break

            if data is None or len(data) < 1:
                break

            try:
                message = self.parse_data2(data)
            except Exception, e:
                traceback.print_exc()
                continue

            print "recvdata:[", message, "]" # self.username+" send to client:"+
            if len(message) == 0:
                continue

            self.call_notify(
                # clients,
                # self.username,
                message
            )
            
    # receive msy from client
    def parse_data2(self, info):

        payload_len = ord(info[1]) & 127
        if payload_len == 126:
            extend_payload_len = info[2:4]
            mask = info[4:8]
            decoded = info[8:]

        elif payload_len == 127:
            extend_payload_len = info[2:10]
            mask = info[10:14]
            decoded = info[14:]

        else:
            extend_payload_len = None
            mask = info[2:6]
            decoded = info[6:]

        bytes_list = bytearray()

        for i in range(len(decoded)):
            chunk = ord(decoded[i]) ^ ord(mask[i % 4])
            bytes_list.append(chunk)

        body = str(bytes_list)
        return body[0:payload_len]

    def parse_data(self, msg):
        v = ord(msg[1]) & 0x7f
        if v == 0x7e:
            p = 4
        elif v == 0x7f:
            p = 10
        else:
            p = 2
        mask = msg[p:p+4]
        data = msg[p+4:]
        return ''.join([chr(ord(v) ^ ord(mask[k%4])) for k, v in enumerate(data)])
        
    def parse_headers(self, msg):
        print "header:",msg
        headers = {}
        header, data = msg.split('\r\n\r\n', 1)
        for line in header.split('\r\n')[1:]:
            key, value = line.split(': ', 1)
            headers[key] = value
        headers['data'] = data
        return headers
 
    def generate_token(self, msg):
        key = msg + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
        ser_key = hashlib.sha1(key).digest()
        return base64.b64encode(ser_key)
 



#服务端
class WebsocketServer(threading.Thread):
    def __init__(self, ws_address, ws_port):
        super(WebsocketServer, self).__init__()
        self.ws_port        = ws_port
        self.ws_address     = ws_address
        # self.call_notify    = call_notify
 
    # Tread Run : object.start()
    def run(self):
        global clients
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((self.ws_address, self.ws_port))
        sock.listen(5)

        print 'websocket server started!'

        while True:
            connection, address = sock.accept()
            try:
                username            = "ID" + str(address[1])
                clients[username]   = connection
                # Single Check Thread by ConClient
                thread              = WebsocketThread(connection, username)
                thread.start()

            except socket.timeout:
                print 'websocket connection timeout!'
 
if __name__ == '__main__':
    server = WebsocketServer('127.0.0.1',10083)
    server.start()






