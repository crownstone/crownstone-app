//
//  types.swift
//  BluenetLibIOS
//
//  Created by Alex de Mulder on 09/06/16.
//  Copyright © 2016 Alex de Mulder. All rights reserved.
//

import Foundation

public enum ControlType : UInt8 {
    case `switch`               = 0
    case pwm                    = 1
    case set_TIME               = 2
    case goto_DFU               = 3
    case reset                  = 4
    case factory_RESET          = 5
    case keep_ALIVE_STATE       = 6
    case keepAliveRepeat        = 7
    case enable_MESH            = 8
    case enable_ENCRYPTION      = 9
    case enable_IBEACON         = 10
    case enable_CONTINUOUS_POWER_MANAGEMENT = 11
    case enable_SCANNER         = 12
    case scan_FOR_DEVICES       = 13
    case user_FEEDBACK          = 14
    case schedule_ENTRY         = 15
    case relay                  = 16
    case validate_SETUP         = 17
    case request_SERVICE_DATA   = 18
    case disconnect             = 19
    case set_LED                = 20
    case no_OPERATION           = 21
    case increase_TX            = 22
    case reset_ERRORS           = 23
    case mesh_keepAliveRepeat   = 24
    case mesh_multiSwitch       = 25
    case schedule_REMOVE        = 26
    case mesh_keepAliveState    = 27
    case mesh_command           = 28
    case allow_dimming          = 29
    case lock_switch            = 30
    case setup                  = 31
    case enable_switchcraft     = 32
}

public enum ConfigurationType : UInt8 {
    case device_NAME = 0
    case device_TYPE = 1
    case room = 2
    case floor = 3
    case nearby_TIMEOUT = 4
    case pwm_PERIOD = 5
    case ibeacon_MAJOR = 6
    case ibeacon_MINOR = 7
    case ibeacon_UUID = 8
    case ibeacon_TX_POWER = 9
    case wifi_SETTINGS = 10
    case tx_POWER = 11
    case advertisement_INTERVAL = 12
    case passkey = 13
    case min_ENV_TEMP = 14
    case max_ENV_TEMP = 15
    case scan_DURATION = 16
    case scan_SEND_DELAY = 17
    case scan_BREAK_DURATION = 18
    case boot_DELAY = 19
    case max_CHIP_TEMP = 20
    case scan_FILTER = 21
    case scan_FILTER_FRACTION = 22
    case current_LIMIT = 23
    case mesh_ENABLED = 24
    case encryption_ENABLED = 25
    case ibeacon_ENABLED = 26
    case scanner_ENABLED = 27
    case continuous_POWER_MEASUREMENT_ENABLED = 28
    case tracker_ENABLED = 29
    case adc_SAMPLE_RATE = 30
    case power_SAMPLE_BURST_INTERVAL = 31
    case power_SAMPLE_CONTINUOUS_INTERVAL = 32
    case power_SAMPLE_CONTINUOUS_NUMBER_SAMPLES = 33
    case crownstone_IDENTIFIER = 34
    case admin_ENCRYPTION_KEY = 35
    case member_ENCRYPTION_KEY = 36
    case guest_ENCRYPTION_KEY = 37
    case default_ON = 38
    case scan_INTERVAL = 39
    case scan_WINDOW = 40
    case relay_HIGH_DURATION = 41
    case low_TX_POWER = 42
    case voltage_MULTIPLIER = 43
    case current_MULITPLIER = 44
    case voltage_ZERO = 45
    case current_ZERO = 46
    case power_ZERO = 47
    case power_AVERAGE_WINDOW = 48
    case mesh_ACCESS_ADDRESS = 49
    case CURRENT_CONSUMPTION_THRESHOLD = 50
    case CURRENT_CONSUMPTION_THRESHOLD_DIMMER = 51
    case DIMMER_TEMP_UP_VOLTAGE = 52
    case DIMEMR_TEMP_DOWN_VOLTAGE = 53
    case PWM_ALLOWED = 54
    case SWITCH_LOCKED = 55
    case SWITCHCRAFT_ENABLED = 56
    case SWITCHCRAFT_THRESHOLD = 57
    case MESH_CHANNEL = 58
    case UART_ENABLED = 59
}

public enum MeshHandle : UInt8 {
    case hub = 1
    case data
}

public enum StateType : UInt8 {
    case reset_COUNTER = 128
    case switch_STATE = 129
    case accumulated_ENERGY = 130
    case power_USAGE = 131
    case tracked_DEVICES = 132
    case schedule = 133
    case operation_MODE = 134
    case temperature = 135
    case time = 136
    case error_BITMASK = 139
}

public enum OpCode : UInt8 {
    case read = 0
    case write
}

//*********** Mesh ***********//

public enum MeshCommandType : UInt8 {
    case control = 0
    case beacon
    case config
    case state
}

public enum IntentType : UInt8 {
    case regionEnter = 0
    case regionExit
    case enter
    case exit
    case manual
}

public enum MeshKeepAliveTypes : UInt8 {
    case sharedTimeout = 1
}

public enum MeshMultiSwitchType : UInt8 {
    case simpleList = 0
}

//****************** DEVICE TYPES IN ADVERTISEMENTS *************//

public enum DeviceType : UInt8 {
    case undefined = 0
    case plug = 1
    case guidestone = 2
    case builtin = 3
    case crownstoneUSB = 4
    case builtinOne = 5
}


//****************** RESULT VALUES *************//

public enum ResultValue: UInt16 {
    case SUCCESS                = 0      // Completed successfully.
    case WAIT_FOR_SUCCESS       = 1      // Command is successful so far, but you need to wait for SUCCESS.
    case BUFFER_UNASSIGNED      = 16     // No buffer was assigned for the command.
    case BUFFER_LOCKED          = 17     // Buffer is locked, failed queue command.
    case WRONG_PAYLOAD_LENGTH   = 32     // Wrong payload lenght provided.
    case WRONG_PARAMETER        = 33     // Wrong parameter provided.
    case INVALID_MESSAGE        = 34     // invalid message provided.
    case UNKNOWN_OP_CODE        = 35     // Unknown operation code provided.
    case UNKNOWN_TYPE           = 36     // Unknown type provided.
    case NOT_FOUND              = 37     // The thing you were looking for was not found.
    case NO_ACCESS              = 48     // Invalid access for this command.
    case NOT_AVAILABLE          = 64     // Command currently not available.
    case NOT_IMPLEMENTED        = 65     // Command not implemented (not yet or not anymore).
    case WRITE_DISABLED         = 80     // Write is disabled for given type.
    case ERR_WRITE_NOT_ALLOWED  = 81     // Direct write is not allowed for this type, use command instead.
    case ADC_INVALID_CHANNEL    = 96     // Invalid adc input channel selected.
}

//****************** PROCESS TYPES *************//

public enum ProcessType: UInt16 {
    case CONTINUE = 0
    case FINISHED = 1
    case ABORT_ERROR = 2
}



