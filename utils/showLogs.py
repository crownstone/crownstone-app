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
		patternTime = re.compile('\d+ ')
		patternKeepaliveStart = re.compile('.* KeepAliveHandler: \((\S+)\) Performing keep Alive to stone handle (\S+)', re.IGNORECASE)
		patternKeepaliveFail = re.compile('.* KeepAliveHandler: \((\S+)\) ATTEMPT \d+, COULD NOT PERFORM KEEPALIVE AS \S+ TO .* (\S+) DUE TO (.*)', re.IGNORECASE)
		patternKeepaliveSuccess = re.compile('.* KeepAliveHandler: \((\S+)\) \S+ Successful to .* (\S+)', re.IGNORECASE)
		patternConnectStart = re.compile('.* called bluenetPromise connect  with param (\S+)', re.IGNORECASE)
		patternConnectFail = re.compile('.* PROMISE REJECTED WHEN CALLING  connect WITH PARAM: (\S+) error: (.*)', re.IGNORECASE)
		patternConnectSuccess = re.compile('.* BLEProxy: connected, performing.*', re.IGNORECASE)

		connectStartTimeList = []
		connectHandleList = []
		connectResultList = [] # -1 for connect fail, 1 for connect success
		connectResultTimeList = []
		handles = {}

		lastConnectHandle = None

		for line in f.xreadlines():
			match = patternTime.match(line)
			if (match):
				# In ms
				timestamp = match.group(0)
			else:
				timestamp = -1

			match = patternKeepaliveStart.match(line)
			if (match):
				id = match.group(1)
				handle = match.group(2)
				# print "keepalive start   time:", timestamp, "id:", id, "handle:", handle

			match = patternKeepaliveFail.match(line)
			if (match):
				id = match.group(1)
				handle = match.group(2)
				reason = match.group(3)
				# print "keepalive fail    time:", timestamp, "id:", id, "handle:", handle, "reason:", reason

			match = patternKeepaliveSuccess.match(line)
			if (match):
				id = match.group(1)
				handle = match.group(2)
				# print "keepalive success time:", timestamp, "id:", id, "handle:", handle

			match = patternConnectStart.match(line)
			if (match):
				handle = match.group(1)
				# print "connect start   time:", timestamp, "handle:", handle
				if (lastConnectHandle != None):
					print "ERROR: double connect?"
				connectStartTimeList.append(timestamp)
				handles[handle] = 1
				lastConnectHandle = handle
				connectHandleList.append(handle)

			match = patternConnectFail.match(line)
			if (match):
				handle = match.group(1)
				reason = match.group(2)
				# print "connect fail    time:", timestamp, "handle:", handle, "reason:", reason
				if (handle != lastConnectHandle):
					print "ERROR: connect handle doesn't match connect fail handle"
				connectResultList.append(-1)
				connectResultTimeList.append(timestamp)
				lastConnectHandle = None

			match = patternConnectSuccess.match(line)
			if (match):
				# print "connect success time:", timestamp
				connectResultList.append(1)
				connectResultTimeList.append(timestamp)
				lastConnectHandle = None
		handles = handles.keys()
		if (len(connectStartTimeList) > len(connectResultTimeList)):
			connectStartTimeList = connectStartTimeList[0:-1]
			connectHandleList = connectHandleList[0:-1]



		# Process
		lastScore = 0
		connectScore = []
		connectSuccessList = []
		connectFailList = []

		connectSuccessPerHandle = {}
		connectFailPerHandle = {}
		lastResultPerHandle = {}
		connectScorePerHandle = {}
		connectResultTimePerHandle = {}
		for h in handles:
			connectSuccessPerHandle[h] = []
			connectFailPerHandle[h] = []
			lastResultPerHandle[h] = 0
			connectScorePerHandle[h] = []
			connectResultTimePerHandle[h] = []

		for i in range(0, len(connectStartTimeList)):
			startTime = connectStartTimeList[i]
			handle = connectHandleList[i]
			result = connectResultList[i]
			resultTime = connectResultTimeList[i]
			connectResultTimePerHandle[handle].append(resultTime)
			if (result > 0):
				connectSuccessList.append(resultTime)
				connectSuccessPerHandle[handle].append(resultTime)
				if (lastScore < 0):
					lastScore = 1
				else:
					lastScore += 1

				if (lastResultPerHandle[handle] < 0):
					lastResultPerHandle[handle] = 1
				else:
					lastResultPerHandle[handle] += 1
			else:
				connectFailList.append(resultTime)
				connectFailPerHandle[handle].append(resultTime)
				if (lastScore > 0):
					lastScore = -1
				else:
					lastScore -= 1

				if (lastResultPerHandle[handle] > 0):
					lastResultPerHandle[handle] = -1
				else:
					lastResultPerHandle[handle] -= 1

			connectScorePerHandle[handle].append(lastResultPerHandle[handle])
			connectScore.append(lastScore)



		connectScore = np.array(connectScore)

		plt.figure()
		plt.plot(connectStartTimeList,   [0]*len(connectStartTimeList), "o", label="start")
		plt.hold(True)
		plt.plot(connectSuccessList, [20]*len(connectSuccessList), "o", label="success")
		plt.plot(connectFailList,    [-20]*len(connectFailList), "o", label="failure")
		plt.plot(connectStartTimeList, connectScore, "-", label="consecutive score")
		plt.hold(False)
		#plt.ylim([-0.5, 2.5])


		print "num handles:", len(handles)
		fig, axes = plt.subplots(nrows=len(handles), sharex=True)
		for i in range(0, len(handles)):
			handle = handles[i]
			# print connectResultTimePerHandle[handle]
			# print connectScorePerHandle[handle]
			axes[i].plot([connectStartTimeList[0], connectStartTimeList[-1]], [0, 0], "-")
			axes[i].hold(True)
			axes[i].plot(connectSuccessPerHandle[handle], [20]*len(connectSuccessPerHandle[handle]), "o", label="success")
			axes[i].plot(connectFailPerHandle[handle], [-20]*len(connectFailPerHandle[handle]), "o", label="failure")
			axes[i].plot(connectResultTimePerHandle[handle], connectScorePerHandle[handle], "-")
			axes[i].hold(False)
			axes[i].set_title(handle)

		plt.show()

