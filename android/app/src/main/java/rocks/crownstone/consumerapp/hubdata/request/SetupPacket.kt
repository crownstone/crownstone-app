/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Nov 26, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata.request

import rocks.crownstone.bluenet.packets.PacketInterface
import rocks.crownstone.bluenet.packets.StringPacket
import rocks.crownstone.bluenet.util.Log
import rocks.crownstone.bluenet.util.putUint16
import rocks.crownstone.bluenet.util.toUint16
import java.nio.ByteBuffer
import java.nio.ByteOrder

class SetupPacket(token: String, cloudId: String): PacketInterface {
	val TAG = this.javaClass.simpleName
	companion object {
		const val HEADER_SIZE = 2 + 2
	}

	val tokenPacket = StringPacket(token)
	val cloudIdPacket = StringPacket(cloudId)

	override fun getPacketSize(): Int {
		return HEADER_SIZE + tokenPacket.getPacketSize() + cloudIdPacket.getPacketSize()
	}

	override fun toBuffer(bb: ByteBuffer): Boolean {
		if (bb.remaining() < getPacketSize()) {
			Log.w(TAG, "buffer too small: ${bb.remaining()} < ${getPacketSize()}")
			return false
		}
		bb.order(ByteOrder.LITTLE_ENDIAN)

		bb.putUint16(tokenPacket.getPacketSize().toUint16())
		if (!tokenPacket.toBuffer(bb)) {
			return false
		}

		bb.putUint16(cloudIdPacket.getPacketSize().toUint16())
		return cloudIdPacket.toBuffer(bb)
	}

	override fun fromBuffer(bb: ByteBuffer): Boolean {
		return false
	}

	override fun toString(): String {
		return "TokenAndCloudIdPacket(tokenPacket=$tokenPacket, cloudIdPacket=$cloudIdPacket)"
	}

}
