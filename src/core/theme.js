// src/core/theme.js
import { DefaultTheme } from "react-native-paper";

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6200ee",
    accent: "#03dac4",
    background: "#ffffff",
    surface: "#ffffff",
    text: "#000000",
    error: "#B00020",
  },
};
