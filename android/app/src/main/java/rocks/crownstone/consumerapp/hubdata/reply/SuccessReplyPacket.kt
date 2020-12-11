/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Dec 11, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata.reply

import rocks.crownstone.bluenet.packets.PacketInterface
import rocks.crownstone.bluenet.packets.StringPacket
import java.nio.ByteBuffer
import java.nio.ByteOrder

class SuccessReplyPacket: PacketInterface {
	val TAG = this.javaClass.simpleName

	companion object {
		const val HEADER_SIZE = 0
	}

	var payload = StringPacket()
		private set

	override fun toBuffer(bb: ByteBuffer): Boolean {
		return false
	}

	override fun fromBuffer(bb: ByteBuffer): Boolean {
		try {
			bb.order(ByteOrder.LITTLE_ENDIAN)
			return payload.fromBuffer(bb)
		}
		catch (e: Exception) {
			return false
		}
	}

	override fun getPacketSize(): Int {
		return HEADER_SIZE + payload.getPacketSize()
	}

	override fun toString(): String {
		return "SuccessReplyPacket(payload=$payload)"
	}
}
