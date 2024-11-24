import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { theme } from "./src/core/theme";
import {
  StartScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  HomeScreen, // Ensure HomeScreen exists
  BookDetailsScreen,
  EditProfileScreen,
  OrderHistoryScreen,
  SettingsScreen,
  UserDetailsScreen,
  CheckoutScreen,
  OrderConfirmationScreen,
  ChatScreen,
  PaymentScreen,
} from "./src/screens";
import TabNavigator from "./src/navigation/TabNavigator";

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState("StartScreen");

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem("loggedIn");
        if (loggedIn === "true") {
          setInitialRoute("Main"); // Ensure this matches your main route, "Main" should refer to TabNavigator
        }
      } catch (error) {
        console.error("Error fetching login status: ", error);
      }
    };
    checkLoginStatus();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
    >
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.primary,
                shadowColor: "transparent",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 20,
              },
              headerTitleAlign: "center",
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="StartScreen"
              component={StartScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LoginScreen"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterScreen"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Main"
              component={TabNavigator}  // This should be TabNavigator, if it's the main screen after login
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPasswordScreen"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookDetailsScreen"
              component={BookDetailsScreen}
              options={{
                headerShown: true,
                title: "Thông Tin Sách",
                headerStyle: {
                  backgroundColor: theme.colors.accent,
                },
              }}
            />
            <Stack.Screen
              name="UserDetailsScreen"
              component={UserDetailsScreen}
              options={{
                headerShown: true,
                title: "Thông tin chi tiết",
              }}
            />
            <Stack.Screen
              name="EditProfileScreen"
              component={EditProfileScreen}
              options={{ title: "Chỉnh sửa hồ sơ" }}
            />
            <Stack.Screen
              name="OrderHistoryScreen"
              component={OrderHistoryScreen}
              options={{ title: "Lịch sử đơn hàng" }}
            />
            <Stack.Screen
              name="SettingsScreen"
              component={SettingsScreen}
              options={{ title: "Cài đặt" }}
            />
            <Stack.Screen
              name="CheckoutScreen"
              component={CheckoutScreen}
              options={{ title: "Thanh toán" }}
            />
            <Stack.Screen
              name="PaymentScreen"
              component={PaymentScreen}
              options={{ title: "Thanh toán" }}
            />
            <Stack.Screen
              name="OrderConfirmationScreen"
              component={OrderConfirmationScreen}
              options={{ title: "Xác nhận đơn hàng", headerShown: false }}
            />
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={{ title: "Chat" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </PaperProvider>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
