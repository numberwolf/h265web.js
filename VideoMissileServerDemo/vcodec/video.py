#!/usr/bin/env python
# -*- encoding: utf-8 -*-
import binascii
# import urllib2
# import urllib
# import time
# import base64, zlib
# import json
# import re
# from pprint import pprint
# from pyquery import PyQuery as pq
# import cookielib
# import memcache
import codec
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
sys.path.append('../')

class Vod:
	def __init__(self):
		self.fileObj	= None
		self.videoLine 	= ""
		print "Vod init"

	def fileInputInit(self, path=None):
		try:
			self.fileObj = open(path,"rb")

		except Exception,e:
			print e
			return False

		return True

	# vod stream live 
	# @return -2 break, -1 stock, 0 got frame
	def fileReadUnit(self):
		if self.fileObj is None:
			print "self.fileObj is None"
			return None,-2 # exit


		# while True:
		chPro = self.fileObj.read(1024)
		if not chPro:
			# ch = codec.SLICE_SPLIT_1
			# if self.videoLine[len(self.videoLine)-1] != codec.SLICE_SPLIT_BAKNAME:
			# 	return self.videoLine,-2 # exit
			# print "fileReadUnit is over"
			# return None,-2
			pass
		else:
			ch = binascii.b2a_hex(chPro)
			self.videoLine = "{}{}".format(self.videoLine, ch)

		streamRet, videoLine, gotFrame = codec.checkNalu(self.videoLine)
		# print streamRet,gotFrame

		if gotFrame == True:
			self.videoLine = videoLine
			# print "Ret:",streamRet

			streamRet = "{}{}".format(codec.SLICE_TAG_VIDEO, streamRet)
			return streamRet, 0
		else:
			if not chPro and self.videoLine[len(self.videoLine)-1] != codec.SLICE_SPLIT_BAKNAME:
				return self.videoLine, -2 # exit
			else:
				return None, -1

		# f.close()
		print "fileReadUnit is over"
		return None,-2

	def exitRead(self):
		if self.fileObj is not None:
			self.fileObj.close()

	

class Live:
	def __init__(self):
		self.streamObj 	= None
		self.videoLine 	= ""

	# rtmp/rtsp/etc... trans to hevc stream
	def streamReadUnit(adress):
		pass


if __name__ == '__main__':
	vod = Vod()
	vod.fileInputInit("../../videosdemo/veilside1.hevc")
	while True:
		getRet,isContinue = vod.fileReadUnit()
		if isContinue != 0:
			break






