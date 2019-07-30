- create an android version of BleTroubleshooter.tsx

- add Bridge method initBroadcasting which will ask permissions for broadcasting (if relevant)

- add Bridge method checkBroadcastAuthorization which will trigger the bleBroadcastStatus event and returns a string value of the status

- implement bridge event bleBroadcastStatus which has the status of the broadcasting permissions.

bleBroadcastStatus and checkBroadcastAuthorization values: "notDetermined" | "restricted" | "denied" | "authorized"