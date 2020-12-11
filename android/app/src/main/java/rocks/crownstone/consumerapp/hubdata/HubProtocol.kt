/**
 * Author: Crownstone Team
 * Copyright: Crownstone (https://crownstone.rocks)
 * Date: Dec 11, 2020
 * License: LGPLv3+, Apache License 2.0, and/or MIT (triple-licensed)
 */

package rocks.crownstone.consumerapp.hubdata

import rocks.crownstone.bluenet.structs.Uint16

enum class DataType(val num: Uint16) {
	CLOUD_ID(0U),
	UNKNOWN(0xFFFFU);
	companion object {
		private val map = values().associateBy(DataType::num)
		fun fromNum(type: Uint16): DataType {
			return map[type] ?: return UNKNOWN
		}
	}
}
