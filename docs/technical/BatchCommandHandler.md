# Batch Command Handler

The process of the BCH is as follows:

- Anyone can load a command into the BHC. A load returns a Promise for the loaded command.
    - Loaded commands provide a sphere, stone, command and a number of attempts.
    - If there is already a command of type X in the queue, the old command of type X is removed and it's promise is rejected.
- Anyone can call execute on the BHC.

On execute, the user can choose whether this is a priority execute or a normal one. A priority execute will put the execute command
on the top of the Promise Manager stack. A normal one will add it to the stack.

When executing it does the following:

1. Make a list of all devices and mesh networks it can connect to to fulfill it's loaded commands.
2. Listens to events from all of these devices and mesh networks. If an event came in with at least -80db, it will connect to this device.
    - The searching process will time out after 5 seconds.
    - After this timeout, the phone will look for another 5 seconds, disregarding the -80db threshold.
    - If no device has been found in the 10 second window, the exec will reject but the commands will remain in the batch list. A new call to exec will retry these items as well.
3. On connect, the BCH will re-evaluate all commands it has to deliver to the connected Crownstone.
4. It sends the command to the Crownstone.
    - on success the promise from the LOAD command will be resolved.
    - on fail, the number of attempts is reduced by 1. If the amount of attempts is 0, the entry will be removed from the list and the LOAD promise will be rejected.
5. When the command was sent, it will check the list again and repeat until all commands for this Crownstone have been handled.
6. The BCH will check if it should do a KeepAlive while it is still connected based on when the keepalive was last sent. If it is more than 25% of the interval, we do it now. If so, we repeat the command sending.
7. BCH disconnects from the stone.
8. The BCH will repeat this process from step 1 until all commands have been resolved.
9. When the queue is empty, the promise resolves. Only HERE will the PM be released.