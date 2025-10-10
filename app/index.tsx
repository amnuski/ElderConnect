import { router } from "expo-router";
import { Button, Text, View } from "react-native";
export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button title=" DriverCall Dashboard" onPress={() => router.push("/DriverCall")} />
      <Button title=" FamilyCall Dashboard" onPress={() => router.push("/FamilyCall")} />
      <Button title=" CareTakerCall Dashboard" onPress={() => router.push("/CareTakerCall")} />
      <Button title=" DriverResponsePage Dashboard" onPress={() => router.push("/DriverResponsePage")} />
      <Button title=" callattended Dashboard" onPress={() => router.push("/callattend")} />



    </View>
  );
}