/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Nov 26, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata

import rocks.crownstone.bluenet.packets.PacketInterface
import rocks.crownstone.bluenet.packets.wrappers.PayloadWrapperPacket
import rocks.crownstone.bluenet.structs.Uint16
import rocks.crownstone.bluenet.structs.Uint8
import rocks.crownstone.bluenet.util.putUint16
import rocks.crownstone.bluenet.util.putUint8
import java.nio.ByteBuffer
import java.nio.ByteOrder

class HubDataRequestPacket(type: HubDataRequestType, payload: PacketInterface?): PayloadWrapperPacket(payload) {
	override val TAG = this.javaClass.simpleName
	companion object {
		const val HEADER_SIZE = 1 + 2
	}

	val protocol: Uint8 = 0U
	val type = type

	enum class HubDataRequestType(val num: Uint16) {
		SETUP(0U),
		COMMAND(1U),
		FACTORY_RESET(2U),
		FACTORY_RESET_HUB_ONLY(3U),
		REQUEST_DATA(10U),
		UNKNOWN(0xFFFFU);
		companion object {
			private val map = values().associateBy(HubDataRequestType::num)
			fun fromNum(type: Uint16): HubDataRequestType {
				return map[type] ?: return UNKNOWN
			}
		}
	}

	override fun getHeaderSize(): Int {
		return HEADER_SIZE
	}

	override fun getPayloadSize(): Int? {
		return null
	}

	override fun headerToBuffer(bb: ByteBuffer): Boolean {
		bb.order(ByteOrder.LITTLE_ENDIAN)
		bb.putUint8(protocol)
		bb.putUint16(type.num)
		return true
	}

	override fun headerFromBuffer(bb: ByteBuffer): Boolean {
		return false
	}

	override fun toString(): String {
		return "HubDataRequestPacket(protocol=$protocol, type=$type, payload=$payload)"
	}
}
