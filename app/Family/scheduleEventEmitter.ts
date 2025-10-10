// app/Family/scheduleEventEmitter.ts
import { NativeEventEmitter, NativeModules } from "react-native";

// Create a safe dummy module to use with NativeEventEmitter
const scheduleEventEmitter = new NativeEventEmitter(NativeModules.ToastExample || {});

export default scheduleEventEmitter;
