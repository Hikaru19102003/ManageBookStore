// src/screens/SettingsScreen.js
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Switch } from "react-native-paper";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";

export default function SettingsScreen({ navigation }) {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  const toggleNotifications = () => {
    setIsNotificationsEnabled(!isNotificationsEnabled);
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigation.replace("LoginScreen");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>

      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Thông báo</Text>
        <Switch value={isNotificationsEnabled} onValueChange={toggleNotifications} />
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate("LanguageScreen")}>
        <Text style={styles.settingText}>Ngôn ngữ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
        <Text style={[styles.settingText, styles.logoutText]}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingText: {
    fontSize: 16,
    color: "#333",
  },
  logoutText: {
    color: "#e53935",
  },
});
