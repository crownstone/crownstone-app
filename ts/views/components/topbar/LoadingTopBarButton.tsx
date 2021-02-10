import { ActivityIndicator, View } from "react-native";
import { colors } from "../../styles";
import * as React from "react";


export function LoadingTopBarButton() {
  return (
    <View style={{ flex:1, alignItems:'flex-end', justifyContent:'center', paddingTop: 0 }}>
      <ActivityIndicator animating={true} size='small' color={colors.iosBlue.hex} />
    </View>
  )
}