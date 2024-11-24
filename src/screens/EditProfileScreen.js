// src/screens/EditProfileScreen.js
import React, { useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Button, Text } from "react-native-paper";
import { TextInput } from "../components";
import { auth, db } from "../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState(null);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.cancelled) {
      setAvatar(result.uri);
    }
  };

  const handleSave = async () => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { name, phone, avatarUrl: avatar });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleImagePick}>
        <Image
          source={{ uri: avatar || "https://via.placeholder.com/150" }}
          style={styles.avatar}
        />
        <Text style={styles.editText}>Chỉnh sửa ảnh đại diện</Text>
      </TouchableOpacity>
      <TextInput
        label="Tên"
        value={name}
        onChangeText={setName}
        placeholder="Nhập tên của bạn"
      />
      <TextInput
        label="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        placeholder="Nhập số điện thoại"
        keyboardType="phone-pad"
      />
      <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
        Lưu thay đổi
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
  },
  editText: {
    textAlign: "center",
    color: "#6200ee",
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 20,
  },
});
