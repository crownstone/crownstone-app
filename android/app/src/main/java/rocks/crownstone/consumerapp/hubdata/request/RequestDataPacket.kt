/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Dec 11, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata.request

import rocks.crownstone.bluenet.packets.PacketInterface
import rocks.crownstone.bluenet.util.Log
import rocks.crownstone.bluenet.util.putUint16
import rocks.crownstone.consumerapp.hubdata.DataType
import java.nio.ByteBuffer
import java.nio.ByteOrder

class RequestDataPacket(dataType: DataType): PacketInterface {
	val TAG = this.javaClass.simpleName
	companion object {
		const val HEADER_SIZE = 2
	}

	val dataType = dataType

	override fun getPacketSize(): Int {
		return HEADER_SIZE
	}

	override fun toBuffer(bb: ByteBuffer): Boolean {
		if (bb.remaining() < getPacketSize()) {
			Log.w(TAG, "buffer too small: ${bb.remaining()} < ${getPacketSize()}")
			return false
		}
		bb.order(ByteOrder.LITTLE_ENDIAN)

		bb.putUint16(dataType.num)
		return true
	}

	override fun fromBuffer(bb: ByteBuffer): Boolean {
		return false
	}

	override fun toString(): String {
		return "RequestDataPacket(dataType=$dataType)"
	}
}
