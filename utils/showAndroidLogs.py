#!/usr/bin/env python

__author__ = 'Bart van Vliet'

import matplotlib.pyplot as plt
import matplotlib.dates as pltDates
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
		timestampFormat = "%Y-%m-%d %H:%M:%S.%f"
		patternTime = re.compile('\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d+')
		patternScanIntervalStart = re.compile('.* starting scan interval \.\.\.', re.IGNORECASE)
		patternScanIntervalStop = re.compile('.* pausing scan interval \.\.\.', re.IGNORECASE)
		patternScannedDevice = re.compile('.* scanned device: (\S+) \[(\S+)\] \((\d+)\) .*', re.IGNORECASE)
		patternRegionEnter = re.compile('.* onRegionEnter: uuid=(\S+), referenceId=(\S+) .*', re.IGNORECASE)
		patternRegionExit = re.compile('.* onRegionExit: uuid=(\S+), referenceId=(\S+) .*', re.IGNORECASE)

		scanIntervalStartList = []
		scanIntervalStopList = []

		connectStartTimeList = []
		connectHandleList = []
		connectResultList = [] # -1 for connect fail, 1 for connect success
		connectResultTimeList = []
		handles = {}

		scannedDeviceList = []
		scannedDeviceTimeList = []

		regionEnterList = []
		regionEnterTimeList = []
		regionExitList = []
		regionExitTimeList = []

		lastConnectHandle = None

		for line in f.xreadlines():
			match = patternTime.match(line)
			if (match):
				# In seconds, inverse of time.localtime(..)
				# timestamp = time.mktime(datetime.datetime.strptime(match.group(0), timestampFormat).timetuple())
				timestamp = datetime.datetime.strptime(match.group(0), timestampFormat)
				# print match.group(0), timestamp
			else:
				timestamp = -1

			match = patternScanIntervalStart.match(line)
			if (match):
				scanIntervalStartList.append(timestamp)

			match = patternScanIntervalStop.match(line)
			if (match):
				scanIntervalStopList.append(timestamp)

			match = patternScannedDevice.match(line)
			if (match):
				address = match.group(1)
				rssi = match.group(2)
				occurrences = match.group(3)
				scannedDeviceList.append(address)
				scannedDeviceTimeList.append(timestamp)

			match = patternRegionEnter.match(line)
			if (match):
				uuid = match.group(1)
				referenceId = match.group(2)
				regionEnterList.append(uuid)
				regionEnterTimeList.append(timestamp)

			match = patternRegionExit.match(line)
			if (match):
				uuid = match.group(1)
				referenceId = match.group(2)
				regionExitList.append(uuid)
				regionExitTimeList.append(timestamp)




		# Process
		scanIntervalStartList = np.array(scanIntervalStartList)
		scanIntervalStartDt = np.diff(scanIntervalStartList)

		scanIntervalStartDt = []
		for i in range(0, len(scanIntervalStartList)-1):
			scanIntervalStartDt.append((scanIntervalStartList[i+1] - scanIntervalStartList[i]).total_seconds())
		scanIntervalStartStop = [[], []]
		i=0
		j=0
		prevStartTime = datetime.datetime.fromtimestamp(0)
		prevStopTime = datetime.datetime.fromtimestamp(0)
		while True:
			if (i >= len(scanIntervalStartList) or j >= len(scanIntervalStopList)):
				break
			startTime = scanIntervalStartList[i]
			stopTime = scanIntervalStopList[j]
			# if (i>300):
			# 	print i,j,"startTime:", startTime, "stopTime:", stopTime
			if (startTime >= prevStopTime):
				if (stopTime >= startTime):
					scanIntervalStartStop[0].extend([startTime, startTime, stopTime, stopTime])
					scanIntervalStartStop[1].extend([0, 1, 1, 0])
				else:
					i-=1
					print "startTime:", startTime, "stopTime:", stopTime
			else:
				j-=1
				print "startTime:", startTime, "stopTime:", stopTime, "prevStartTime:", prevStartTime, "prevStopTime:", prevStopTime
			i += 1
			j += 1
			prevStartTime = startTime
			prevStopTime = stopTime

		scanIntervalStartStop[1] = np.array(scanIntervalStartStop[1])

		regionEnterExit = [[], []]
		i=0
		j=0
		prevEnterTime = datetime.datetime.fromtimestamp(0)
		prevExitTime = datetime.datetime.fromtimestamp(0)
		while True:
			if (i >= len(regionEnterTimeList) or j >= len(regionExitTimeList)):
				break
			enterTime = regionEnterTimeList[i]
			exitTime = regionExitTimeList[j]
			if (enterTime >= prevExitTime):
				if (exitTime >= enterTime):
					regionEnterExit[0].extend([enterTime, enterTime, exitTime, exitTime])
					regionEnterExit[1].extend([0, 1, 1, 0])
				else:
					i-=1
					print "enterTime:", enterTime, "exitTime:", exitTime
			else:
				i-=1
				print "enterTime:", enterTime, "exitTime:", exitTime, "prevEnterTime:", prevEnterTime, "prevExitTime:", prevExitTime
			i+=1
			j+=1
			prevEnterTime = enterTime
			prevExitTime = exitTime

		regionEnterExit[1] = np.array(regionEnterExit[1])


		# Format the timestamps
		# scanIntervalStartList = [datetime.datetime.fromtimestamp(ts) for ts in scanIntervalStartList]
		# scanIntervalStopList = [datetime.datetime.fromtimestamp(ts) for ts in scanIntervalStopList]
		# scannedDeviceTimeList = [datetime.datetime.fromtimestamp(ts) for ts in scannedDeviceTimeList]
		# regionEnterTimeList = [datetime.datetime.fromtimestamp(ts) for ts in regionEnterTimeList]
		# regionExitTimeList  = [datetime.datetime.fromtimestamp(ts) for ts in regionExitTimeList]
		#
		# scanIntervalStartStop[0] = [datetime.datetime.fromtimestamp(ts) for ts in scanIntervalStartStop[0]]
		# regionEnterExit[0] = [datetime.datetime.fromtimestamp(ts) for ts in regionEnterExit[0]]
		# tickFormat = pltDates.DateFormatter('%Y-%m-%d %H:%M:%S')
		tickRotation = 45

		# Sort scanned devices by address
		scannedDevices = list(set(scannedDeviceList))
		scannedDevicesDict = {}
		for address in scannedDevices:
			scannedDevicesDict[address] = []
		for i in range(0, len(scannedDeviceList)):
			address = scannedDeviceList[i]
			timestamp = scannedDeviceTimeList[i]
			scannedDevicesDict[address].append(timestamp)




		plt.figure()
		# fig, axes = plt.subplots(nrows=len(3), sharex=True)

		ax=plt.gca()
		# ax.xaxis.set_major_formatter(tickFormat)
		plt.subplots_adjust(bottom=0.15)
		plt.xticks( rotation=tickRotation )

		plt.hold(True)
		plt.plot(scanIntervalStartStop[0], 0+(scanIntervalStartStop[1]), "-", label="scanning")
		plt.plot(scanIntervalStartList, [0.9]*len(scanIntervalStartList), "o", label="start scan")
		plt.plot(scanIntervalStopList,  [0.1]*len(scanIntervalStopList),  "o", label="stop scan")
		# plt.plot(range(0,len(scanIntervalStartStop[0])), scanIntervalStartStop[0], "-o", label="scanning")
		plt.plot(regionEnterExit[0], 2+(regionEnterExit[1]), "-", label="in region")
		plt.plot(regionEnterTimeList, [2.9]*len(regionEnterList), "o", label="region enter")
		plt.plot(regionExitTimeList,  [2.1]*len(regionExitList),  "o", label="region exit")

		for i in range(0, len(scannedDevices)):
			address = scannedDevices[i]
			plt.plot(scannedDevicesDict[address], [i+4]*len(scannedDevicesDict[address]), "o", label="scanned " + address)


		plt.hold(False)
		# plt.ylim([-0.5, 1.5])
		plt.legend()

		plt.figure()
		plt.plot(scanIntervalStartList[0:-1], scanIntervalStartDt, "o", label="start interval dt")
		plt.hold(True)
		plt.hold(False)
		ax=plt.gca()
		# ax.xaxis.set_major_formatter(tickFormat)
		plt.subplots_adjust(bottom=0.2)
		plt.xticks( rotation=tickRotation )
		plt.legend()

		# plt.figure()
		# plt.plot(regionEnterExit[0], regionEnterExit[1], "-", label="in region")
		# plt.hold(True)
		# plt.hold(False)
		# plt.ylim([-0.5, 1.5])
		# ax=plt.gca()
		# # ax.xaxis.set_major_formatter(tickFormat)
		# plt.subplots_adjust(bottom=0.2)
		# plt.xticks( rotation=tickRotation )
		# plt.legend()

		# plt.figure()
		# plt.hold(True)
		# for i in range(0, len(scannedDevices)):
		# 	address = scannedDevices[i]
		# 	plt.plot(scannedDevicesDict[address], [i]*len(scannedDevicesDict[address]), "o", label=address)
		# plt.hold(False)
		# ax=plt.gca()
		# # ax.xaxis.set_major_formatter(tickFormat)
		# plt.subplots_adjust(bottom=0.2)
		# plt.xticks( rotation=tickRotation )


		plt.show()

