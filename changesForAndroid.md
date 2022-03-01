add bridge method "getLaunchArguments" 

getLaunchArguments() :  Promise<string[]>

See bottom of this page on how to get them https://wix.github.io/Detox/docs/api/launch-args

These are cached once on boot and served when asked for it.

I'm getting this from ios:
["/Users/alex/Library/Developer/CoreSimulator/Devices/09DFB66B-EEE4-4449-B87B-B4D41CF4094B/data/Containers/Bundle/Application/2A28FBE6-9A52-49FB-98B2-C006BCC5B004/Crownstone.app/Crownstone", "--args", "-detoxServer", "ws://localhost:56869", "-detoxSessionId", "1ec83337-e290-e48b-39a6-53e0049c8931", "-localization", "en_us", "-detoxEnableSynchronization", "0", "-detoxDisableHierarchyDump", "YES"]

We'll have to see what it is that you get.