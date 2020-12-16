package rocks.crownstone.consumerapp

import nl.komponents.kovenant.Promise
import nl.komponents.kovenant.deferred
import nl.komponents.kovenant.then
import rocks.crownstone.bluenet.Bluenet
import rocks.crownstone.bluenet.packets.ByteArrayPacket
import rocks.crownstone.bluenet.packets.EmptyPacket
import rocks.crownstone.bluenet.packets.HubDataPacket
import rocks.crownstone.bluenet.structs.Errors
import rocks.crownstone.bluenet.structs.Uint32
import rocks.crownstone.bluenet.util.Conversion
import rocks.crownstone.bluenet.util.toUint32
import rocks.crownstone.consumerapp.hubdata.DataType
import rocks.crownstone.consumerapp.hubdata.HubDataReplyPacket
import rocks.crownstone.consumerapp.hubdata.HubDataRequestPacket
import rocks.crownstone.consumerapp.hubdata.request.RequestDataPacket
import rocks.crownstone.consumerapp.hubdata.request.SetupPacket

class HubData(bluenet: Bluenet) {
	private val bluenet = bluenet

	fun setup(hubToken: String, cloudId: String): Promise<HubDataReplyPacket, Exception> {
		val reqPacket = HubDataRequestPacket(HubDataRequestPacket.HubDataRequestType.SETUP, SetupPacket(hubToken, cloudId))
		return sendHubDataCommand(reqPacket)
	}

	fun requestData(type: DataType): Promise<HubDataReplyPacket, Exception> {
		val reqPacket = HubDataRequestPacket(HubDataRequestPacket.HubDataRequestType.REQUEST_DATA, RequestDataPacket(type))
		return sendHubDataCommand(reqPacket)
	}

	/**
	 * Factory reset both: hub and its crownstone dongle.
	 */
	fun factoryReset(): Promise<HubDataReplyPacket, Exception> {
		val value: Uint32 = 0xDEADBEEFU
		val packet = ByteArrayPacket(Conversion.toByteArray(value))
		val reqPacket = HubDataRequestPacket(HubDataRequestPacket.HubDataRequestType.FACTORY_RESET, packet)
		return sendHubDataCommand(reqPacket)
	}

	/**
	 * Factory reset hub only.
	 */
	fun factoryResetHubOnly(): Promise<HubDataReplyPacket, Exception> {
		val value: Uint32 = 0xDEADBEA7U
		val packet = ByteArrayPacket(Conversion.toByteArray(value))
		val reqPacket = HubDataRequestPacket(HubDataRequestPacket.HubDataRequestType.FACTORY_RESET, packet)
		return sendHubDataCommand(reqPacket)
	}

	internal fun sendHubDataCommand(reqPacket: HubDataRequestPacket): Promise<HubDataReplyPacket, Exception> {
		val deferred = deferred<HubDataReplyPacket, Exception>()
		bluenet.control.hubData(HubDataPacket(HubDataPacket.EncryptType.NOT_ENCRYPTED, reqPacket))
				.success {
					// TODO: maybe control.hubData() should return HubDataReplyPacket ?
					val replyPacket = HubDataReplyPacket()
					val array = it.getArray()
					if (array == null) {
						deferred.reject(Errors.SizeWrong())
						return@success
					}
					if (!replyPacket.fromArray(array)) {
						deferred.reject(Errors.Parse("Can't make a hub data reply packet from ${Conversion.bytesToString(array)}"))
						return@success
					}
					deferred.resolve(replyPacket)
				}
				.fail {
					deferred.reject(it)
				}
		return deferred.promise
	}
}