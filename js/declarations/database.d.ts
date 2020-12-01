
interface HubData {
  config: {
    cloudId:   string | null,
    ipAddress: string | null,
    linkedStoneId: string | null,
    updatedAt: number,
  },
  state: {
    uartAlive                          : boolean,
    uartAliveEncrypted                 : boolean,
    uartEncryptionRequiredByCrownstone : boolean,
    uartEncryptionRequiredByHub        : boolean,
    hubHasBeenSetup                    : boolean,
    hubHasInternet                     : boolean,
    hubHasError                        : boolean,
  },
  reachability: {
    reachable: boolean,
    lastSeen:  number | null,
  },
};