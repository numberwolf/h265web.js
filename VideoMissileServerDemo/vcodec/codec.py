#!/usr/bin/env python
# -*- encoding: utf-8 -*-
import copy

SLICE_SPLIT_0 		= "000001"
SLICE_SPLIT_1 		= "00000001"

SLICE_AUDIO_0 		= ""
SLICE_AUDIO_0_TMP	= "fff1{}{}" # + layer

SLICE_SPLIT_BAKNAME = "_"

SLICE_TAG_AUDIO		= "08"
SLICE_TAG_VIDEO		= "09"

"""
@Brief Video
Split nalu data

@Param 
String streamByte : hex text 00000100024ffac1

@Return 
Tuple naluText, otherText, isOK
"""
def checkNalu(streamByte = ""):
	streamByteLen = len(streamByte);
	if streamByteLen < 4:
		return None, streamByte, False

	sByteSplit = streamByte.replace(SLICE_SPLIT_1, SLICE_SPLIT_BAKNAME).replace(SLICE_SPLIT_0, SLICE_SPLIT_BAKNAME)
	# print sByteSplit

	getFirstCode 	= -1
	getEndCode		= -1

	for i in range(0,len(sByteSplit)):
		# print sByteSplit[i],SLICE_SPLIT_BAKNAME
		if sByteSplit[i] == SLICE_SPLIT_BAKNAME:
			# print "search"

			if getFirstCode == -1:
				getFirstCode 	= i + 1
			else:
				getEndCode 		= i

				# add startCode
				return "{0}{1}".format(SLICE_SPLIT_1, sByteSplit[getFirstCode:getEndCode]), sByteSplit[getEndCode:], True

	return None, sByteSplit, False 

	# for i in range(2,streamByteLen):
	# 	# print "==========check:",streamByte,i,"/",streamByteLen-1
	# 	# print [streamByte[i],streamByte[i+1],streamByte[i+2],streamByte[i+3]]
	# 	if i+4 > streamByteLen:
	# 		return streamByte,None,False
	# 	else:
	# 		# print "4===>",[streamByte[i],streamByte[i+1],streamByte[i+2],streamByte[i+3]],"=?=",SLICE_SPLIT_1
	# 		if [streamByte[i],streamByte[i+1],streamByte[i+2],streamByte[i+3]] == SLICE_SPLIT_1:
	# 			return streamByte[0:i],copy.deepcopy(SLICE_SPLIT_1),True
	# 	# print [streamByte[i],streamByte[i+1],streamByte[i+2]]
	# 	if i+3 > streamByteLen:
	# 		return streamByte,None,False
	# 	else:
	# 		# print "3===>",[streamByte[i],streamByte[i+1],streamByte[i+2]],"=?=",SLICE_SPLIT_0
	# 		if [streamByte[i],streamByte[i+1],streamByte[i+2]] == SLICE_SPLIT_0:
	# 			return streamByte[0:i],copy.deepcopy(SLICE_SPLIT_0),True
	# return streamByte,None,False

"""
@Brief AAC
Split aac frame

@Param 
String streamByte : hex text 00000100024ffac1

@Return 
Tuple naluText, otherText, isOK
"""
def checkAACFrame(streamByte = "", isFirst = False):
	global SLICE_AUDIO_0
	global SLICE_AUDIO_0_TMP

	streamByteLen = len(streamByte);
	if streamByteLen < 4:
		return None, streamByte, False

	# fff150
	if (isFirst):
		SLICE_AUDIO_0 = SLICE_AUDIO_0_TMP.format(streamByte[4], streamByte[5])

	sByteSplit = streamByte.replace(SLICE_AUDIO_0, SLICE_SPLIT_BAKNAME)
	# print sByteSplit

	getFirstCode 	= -1
	getEndCode		= -1

	for i in range(0, len(sByteSplit)):
		# print sByteSplit[i],SLICE_SPLIT_BAKNAME
		if sByteSplit[i] == SLICE_SPLIT_BAKNAME:
			# print "search"

			if getFirstCode == -1:
				getFirstCode 	= i + 1
			else:
				getEndCode 		= i

				# add startCode
				return "{0}{1}".format(SLICE_AUDIO_0, sByteSplit[getFirstCode:getEndCode]), sByteSplit[getEndCode:], True

	return None, sByteSplit, False 


"""
@Brief Audio

@Param 
String hexText : hex text 00000100024ffac1

@Return 
List hexList
"""
def hexTextToHexList(hexText = ""):

	hexList = []

	for i in range(0, len(hexText), 2):
		item1 	= hexText[i]
		item2 	= hexText[i + 1]
		# hexStr to hexInt
		hexNum 	= int("0x{}{}".format(item1, item2), 16)
		# print '0x%02x' % hexNum

		hexList.append(hexNum)


	return hexList


"""
@Brief Audio Mp3
Parse Mp3 data

@Param 
List hexList : list with hex items (01,02,03,ff,fe,...)

@Return 
Tuple naluText, otherText, isOK
"""
def parseMp3(hexList = []):
	pass








