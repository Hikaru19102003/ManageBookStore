import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";

export default function ChatScreen() {
  const messengerUrl = "https://m.me/526778930507726"; // ID trang Messenger của bạn

  const openMessenger = async () => {
    try {
      const canOpen = await Linking.canOpenURL(messengerUrl);
      if (canOpen) {
        await Linking.openURL(messengerUrl);
      } else {
        // Dự phòng: mở trong trình duyệt nếu không có ứng dụng Messenger
        await Linking.openURL(`https://www.messenger.com/t/526778930507726`);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi mở Messenger.");
      console.error("Lỗi khi mở Messenger: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        Nhấn vào nút bên dưới để nhắn tin với chủ shop qua Messenger.
      </Text>
      <TouchableOpacity style={styles.messengerButton} onPress={openMessenger}>
        <Text style={styles.messengerButtonText}>Mở Messenger</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  messengerButton: {
    backgroundColor: "#0084FF", // Màu xanh đặc trưng của Messenger
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  messengerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
