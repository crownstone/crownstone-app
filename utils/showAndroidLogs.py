#!/usr/bin/env python

__author__ = 'Bart van Vliet'

import matplotlib.pyplot as plt
import optparse
import sys
import numpy as np
import time, datetime
import re



if __name__ == '__main__':
	try:
		parser = optparse.OptionParser(usage="%prog [-v] [-f <input file>] \n\nExample:\n\t%prog -f file.txt",
									version="0.1")

		parser.add_option('-v', '--verbose',
				action="store_true",
				dest="verbose",
				help="Be verbose."
				)
		parser.add_option('-f', '--file',
				action='store',
				dest="data_file",
				type="string",
				default="data.txt",
				help='File to get the data from'
				)

		options, args = parser.parse_args()

	except Exception, e:
		print e
		print "For help use --help"
		sys.exit(2)


	with open(options.data_file, 'r') as f:
		# Patterns
		timestampFormat = "%Y-%m-%d %H:%M:%S"
		patternTime = re.compile('\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d')
		patternScanIntervalStart = re.compile('.* starting scan interval \.\.\.', re.IGNORECASE)
		patternScanIntervalStop = re.compile('.* pausing scan interval \.\.\.', re.IGNORECASE)

		scanIntervalStartList = []
		scanIntervalStopList = []

		connectStartTimeList = []
		connectHandleList = []
		connectResultList = [] # -1 for connect fail, 1 for connect success
		connectResultTimeList = []
		handles = {}

		lastConnectHandle = None

		for line in f.xreadlines():
			match = patternTime.match(line)
			if (match):
				# In seconds, inverse of time.localtime(..)
				timestamp = time.mktime(datetime.datetime.strptime(match.group(0), "%Y-%m-%d %H:%M:%S").timetuple())
			else:
				timestamp = -1

			match = patternScanIntervalStart.match(line)
			if (match):
				scanIntervalStartList.append(timestamp)

			match = patternScanIntervalStop.match(line)
			if (match):
				scanIntervalStopList.append(timestamp)




		# Process
		scanIntervalStartList = np.array(scanIntervalStartList)
		scanIntervalStartDt = np.diff(scanIntervalStartList)
		scanIntervalStartStop = [[], []]
		i=0
		j=0
		prevStartTime = 0
		prevStopTime = 0
		while True:
			startTime = scanIntervalStartList[i]
			stopTime = scanIntervalStopList[j]
			# if (i>300):
			# 	print i,j,"startTime:", startTime, "stopTime:", stopTime
			if (startTime > prevStopTime):
				if (stopTime > startTime):
					scanIntervalStartStop[0].extend([startTime, startTime, stopTime, stopTime])
					scanIntervalStartStop[1].extend([0, 1, 1, 0])
				else:
					print "startTime:", startTime, "stopTime:", stopTime
			i += 1
			j += 1
			prevStartTime = startTime
			prevStopTime = stopTime
			if (i >= len(scanIntervalStartList) or j >= len(scanIntervalStopList)):
				break


		plt.figure()
		plt.plot(scanIntervalStartStop[0], scanIntervalStartStop[1], "-", label="scanning")
		# plt.plot(range(0,len(scanIntervalStartStop[0])), scanIntervalStartStop[0], "-o", label="scanning")
		plt.hold(True)
		plt.hold(False)
		plt.ylim([-0.5, 1.5])
		plt.legend()

		plt.figure()
		plt.plot(scanIntervalStartList[0:-1], scanIntervalStartDt, "o", label="start interval dt")
		plt.hold(True)
		plt.hold(False)
		plt.legend()

		plt.show()

