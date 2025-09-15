import { Text, View ,Button} from "react-native";
import { router } from "expo-router";
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
      <Button title="Go to Dashboard" onPress={() => router.push("/dash")} />
    </View>
  );
}

