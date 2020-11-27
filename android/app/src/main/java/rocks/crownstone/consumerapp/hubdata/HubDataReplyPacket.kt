/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Nov 26, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata

import rocks.crownstone.bluenet.packets.ByteArrayPacket
import rocks.crownstone.bluenet.packets.PacketInterface
import rocks.crownstone.bluenet.packets.StringPacket
import rocks.crownstone.bluenet.structs.Uint16
import rocks.crownstone.bluenet.structs.Uint8
import rocks.crownstone.bluenet.util.*
import java.nio.ByteBuffer
import java.nio.ByteOrder

class HubDataReplyPacket: PacketInterface {
	val TAG = this.javaClass.simpleName

	var protocol: Uint8 = 0U
		private set
	var type: HubDataReplyType = HubDataReplyType.UNKNOWN
		private set
	var errorCode: Uint16? = null
		private set
//	var payload = ByteArrayPacket()
//		private set
	var payload = StringPacket()
		private set

	enum class HubDataReplyType(val num: Uint16) {
		SUCCESS(0U),
		ERROR(4000U),
		UNKNOWN(0xFFFFU);
		companion object {
			private val map = values().associateBy(HubDataReplyType::num)
			fun fromNum(type: Uint16): HubDataReplyType {
				return map[type] ?: return UNKNOWN
			}
		}
	}

	override fun toBuffer(bb: ByteBuffer): Boolean {
		return false
	}

	override fun fromBuffer(bb: ByteBuffer): Boolean {
		try {
			bb.order(ByteOrder.LITTLE_ENDIAN)
			protocol = bb.getUint8()
			type = HubDataReplyType.fromNum(bb.getUint16())
			if (type == HubDataReplyType.ERROR) {
				errorCode = bb.getUint16()
			}
			return payload.fromBuffer(bb)
		}
		catch (e: Exception) {
			return false
		}
	}

	override fun getPacketSize(): Int {
		var size = 1 + 2
		if (errorCode != null) {
			size += 2
		}
		return size + payload.getPacketSize()
	}

	override fun toString(): String {
		return "HubDataReplyPacket(protocol=$protocol, type=$type, errorCode=$errorCode, payload=$payload)"
	}
}
