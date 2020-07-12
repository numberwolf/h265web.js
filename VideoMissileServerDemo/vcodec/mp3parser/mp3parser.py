#!/usr/bin/env python
# -*- encoding: utf-8 -*-
import binascii
import sys
reload(sys)
sys.setdefaultencoding('utf-8')
# sys.path.append('../')

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


def parseMp3(hexList = []):
	pass


if __name__ == "__main__":
	path 		= sys.argv[1]
	fileObj 	= open(path, "rb")
	fileBinText = fileObj.read()
	fileObj.close()

	hexText = binascii.b2a_hex(fileBinText)
	hexList = hexTextToHexList(hexText)
	print hexList

	# parseMp3()









