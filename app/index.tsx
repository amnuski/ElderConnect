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
      <Button title="Go to DriverCall Dashboard" onPress={() => router.push("/DriverCall")} />
      <Button title="Go to FamilyCall Dashboard" onPress={() => router.push("/FamilyCall")} />
      <Button title="Go to CareTakerCall Dashboard" onPress={() => router.push("/CareTakerCall")} />

    </View>
  );
}