/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Dec 11, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata.reply

import rocks.crownstone.bluenet.packets.PacketInterface
import rocks.crownstone.bluenet.packets.StringPacket
import rocks.crownstone.bluenet.structs.Uint16
import rocks.crownstone.bluenet.util.getUint16
import java.nio.ByteBuffer
import java.nio.ByteOrder

class ErrorReplyPacket: PacketInterface {
	val TAG = this.javaClass.simpleName

	companion object {
		const val HEADER_SIZE = 2
	}

	var errorCode: ErrorCode = ErrorCode.UNKNOWN
		private set
	var payload = StringPacket()
		private set

	enum class ErrorCode(val num: Uint16) {
		NOT_IN_SETUP_MODE(0U),
		IN_SETUP_MODE(1U),
		INVALID_TOKEN(2U),
		SOMETHING_ELSE(60000U),
		UNKNOWN(0xFFFFU);
		companion object {
			private val map = values().associateBy(ErrorCode::num)
			fun fromNum(code: Uint16): ErrorCode {
				return map[code] ?: return UNKNOWN
			}
		}
	}

	override fun toBuffer(bb: ByteBuffer): Boolean {
		return false
	}

	override fun fromBuffer(bb: ByteBuffer): Boolean {
		try {
			bb.order(ByteOrder.LITTLE_ENDIAN)
			errorCode = ErrorCode.fromNum(bb.getUint16())
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
		return "ErrorReplyPacket(errorCode=$errorCode, payload=$payload)"
	}
}
