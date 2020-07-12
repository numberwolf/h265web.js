#!/usr/bin/env python
# -*- encoding: utf-8 -*-
import binascii
import codec
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
sys.path.append('../')

class Aod:
	def __init__(self):
		print "Aod init"
		# self.readLen = 44100/2
		# self.readLen = 200

		self.fileObj 	= None
		# self.audioHexes	= []
		# self.readLen 	= 102

		self.audioLine 	= ""
		self.readFirst	= True

	def fileInputInit(self, path = None):
		try:
			self.fileObj = open(path, "rb")

		except Exception, e:
			print e
			return False

		return True

	# vod stream live 
	# @return -2 break, -1 stock, 0 got frame
	# def fileReadUnit(self):
	# 	if self.fileObj is None:
	# 		print "self.fileObj is None"
	# 		return None, -2 # exit


	# 	# while True:
	# 	chPro = self.fileObj.read(self.readLen)
	# 	if not chPro:
	# 		pass
	# 	else:
	# 		ch = binascii.b2a_hex(chPro)
	# 		print codec.hexTextToHexList(ch)

	# 		streamRet = "{}{}".format(codec.SLICE_TAG_AUDIO, ch)
	# 		return streamRet, 0

	# 	print "fileReadUnit is over"
	# 	return None, -2

	def fileReadUnit(self):
		if self.fileObj is None:
			print "self.fileObj is None"
			return None,-2 # exit


		# while True:
		chPro = self.fileObj.read(1024)
		if not chPro:
			# ch = codec.SLICE_AUDIO_0
			# if self.audioLine[len(self.audioLine)-1] != codec.SLICE_SPLIT_BAKNAME:
			# 	return self.audioLine,-2 # exit
			# print "fileReadUnit is over"
			pass
		else:
			ch = binascii.b2a_hex(chPro)
			self.audioLine = "{}{}".format(self.audioLine, ch)

		streamRet, audioLine, gotFrame = codec.checkAACFrame(self.audioLine, self.readFirst)
		# print streamRet,gotFrame

		if (self.readFirst):
			self.readFirst = False

		if gotFrame == True:
			self.audioLine = audioLine
			# print "Ret:",streamRet

			# streamRet = "{}{}".format(codec.SLICE_TAG_AUDIO, streamRet)
			return streamRet, 0
		else:
			if not chPro and self.audioLine[len(self.audioLine)-1] != codec.SLICE_SPLIT_BAKNAME:
				return self.audioLine, -2 # exit
			else:
				return None, -1

		# f.close()
		print "fileReadUnit is over"
		return None,-2

	def exitRead(self):
		if self.fileObj is not None:
			self.fileObj.close()


if __name__ == "__main__":
	aod = Aod()
	aod.fileInputInit("../../videosdemo/veilside.aac")
	while True:
		getRet, isContinue = aod.fileReadUnit()
		if isContinue != 0:
			break

		print getRet



