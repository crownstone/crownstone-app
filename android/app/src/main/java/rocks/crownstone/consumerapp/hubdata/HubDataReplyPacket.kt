/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Nov 26, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata

import rocks.crownstone.bluenet.packets.PacketInterface
import rocks.crownstone.bluenet.structs.Uint16
import rocks.crownstone.bluenet.structs.Uint8
import rocks.crownstone.bluenet.util.*
import rocks.crownstone.consumerapp.hubdata.reply.DataReplyPacket
import rocks.crownstone.consumerapp.hubdata.reply.ErrorReplyPacket
import rocks.crownstone.consumerapp.hubdata.reply.SuccessReplyPacket
import java.nio.ByteBuffer
import java.nio.ByteOrder

class HubDataReplyPacket: PacketInterface {
	val TAG = this.javaClass.simpleName

	var protocol: Uint8 = 0U
		private set
	var type: HubDataReplyType = HubDataReplyType.UNKNOWN
		private set
	var payload: PacketInterface? = null
		private set

	companion object {
		const val HEADER_SIZE = 1 + 2
	}

	enum class HubDataReplyType(val num: Uint16) {
		SUCCESS(0U),
		DATA_REPLY(10U),
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
			val newPayload: PacketInterface = when (type) {
				HubDataReplyType.SUCCESS -> SuccessReplyPacket()
				HubDataReplyType.DATA_REPLY -> DataReplyPacket()
				HubDataReplyType.ERROR -> ErrorReplyPacket()
				else -> return false
			}
			val result = newPayload.fromBuffer(bb)
			payload = newPayload
			return result
		}
		catch (e: Exception) {
			return false
		}
	}

	override fun getPacketSize(): Int {
		val payload = this.payload
		if (payload == null) {
			return HEADER_SIZE
		}
		return HEADER_SIZE + payload.getPacketSize()
	}

	override fun toString(): String {
		return "HubDataReplyPacket(protocol=$protocol, type=$type, payload=$payload)"
	}
}
