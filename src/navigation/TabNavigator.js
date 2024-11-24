// src/navigation/TabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen, CartScreen, ProfileScreen } from "../screens";
import { Ionicons } from "@expo/vector-icons"; // Hoặc "@react-native-vector-icons/Ionicons" nếu bạn sử dụng react-native-vector-icons

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Trang chủ"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Trang chủ") {
            iconName = "home-outline";
          } else if (route.name === "Cart") {
            iconName = "cart-outline";
          } else if (route.name === "Profile") {
            iconName = "person-outline";
          }

          // Trả về icon dựa trên tên route
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6200ee", // Màu icon khi được chọn
        tabBarInactiveTintColor: "gray",   // Màu icon khi không được chọn
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { paddingBottom: 5, height: 60 },
      })}
    >
      <Tab.Screen
        name="Trang chủ"
        component={HomeScreen}
        options={{ tabBarLabel: "Trang chủ" }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarLabel: "Giỏ hàng" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Cá nhân" }}
      />
    </Tab.Navigator>
  );
}
