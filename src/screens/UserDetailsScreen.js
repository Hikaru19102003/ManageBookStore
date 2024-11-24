import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { TextInput, RadioButton } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function UserDetailsScreen({ route }) {
  const { user } = route.params;
  const [userData, setUserData] = useState(user);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [newInfo, setNewInfo] = useState("");

  // States for gender, birth date, and refreshing
  const [selectedGender, setSelectedGender] = useState(user.gender || "");
  const [birthDate, setBirthDate] = useState(
    user.birthDate ? user.birthDate.toDate() : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false); // State for image uploading

  // Open modal
  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
    setNewInfo(""); // Reset new input
  };

  // Save changes
  const saveChanges = async () => {
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    let updatedData = {};

    if (modalType === "name") {
      updatedData = { name: newInfo };
    } else if (modalType === "gender") {
      updatedData = { gender: selectedGender };
    } else if (modalType === "birthDate") {
      updatedData = { birthDate: Timestamp.fromDate(birthDate) };
    } else if (modalType === "phone") {
      if (!/^\d+$/.test(newInfo)) {
        Toast.show({
          type: "error",
          text1: "⚠️ Lỗi",
          text2: "Số điện thoại không hợp lệ. Vui lòng nhập lại.",
        });
        return;
      }
      updatedData = { phone: newInfo };
    }

    try {
      await updateDoc(userDocRef, updatedData);
      setUserData({ ...userData, ...updatedData });
      Toast.show({
        type: "success",
        text1: "🎉 Thành công",
        text2: "Thông tin đã được cập nhật.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "⚠️ Lỗi",
        text2: "Không thể cập nhật thông tin. Vui lòng thử lại.",
      });
    } finally {
      setModalVisible(false);
    }
  };

  // Upload image to Firebase
  const uploadImage = async (uri) => {
    try {
      setUploading(true); // Set loading state
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${auth.currentUser.uid}_avatar.jpg`;
      const storageRef = ref(storage, `avatars/${filename}`);

      // Upload the file
      await uploadBytes(storageRef, blob);

      // Get the URL of the uploaded file
      const downloadURL = await getDownloadURL(storageRef);

      // Update the user's avatar URL in Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { avatarUrl: downloadURL });

      setUserData({ ...userData, avatarUrl: downloadURL });
      Toast.show({
        type: "success",
        text1: "🎉 Thành công",
        text2: "Ảnh đại diện đã được cập nhật.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "⚠️ Lỗi",
        text2: "Không thể tải ảnh lên. Vui lòng thử lại.",
      });
    } finally {
      setUploading(false); // Reset loading state
    }
  };

  // Pick image from library
  const pickImage = async () => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      };

      const pickerResult = await ImagePicker.launchImageLibraryAsync(options);

      if (!pickerResult.canceled) {
        await uploadImage(pickerResult.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  // Fetch updated user data
  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Image */}
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{
                uri: userData.avatarUrl || "https://i.pinimg.com/1200x/f7/41/06/f74106a84701dd58d5c4ab913fb11d00.jpg",
              }}
              style={styles.avatar}
            />
            {uploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.infoContainer}>
          <TouchableOpacity onPress={() => openModal("name")}>
            <InfoItem label="Tên" value={userData.name} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openModal("gender")}>
            <InfoItem
              label="Giới tính"
              value={userData.gender || "Thiết lập ngay"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openModal("birthDate")}>
            <InfoItem
              label="Ngày sinh"
              value={
                userData.birthDate
                  ? userData.birthDate.toDate().toLocaleDateString()
                  : "Thiết lập ngay"
              }
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openModal("phone")}>
            <InfoItem
              label="Số điện thoại"
              value={userData.phone || "Thiết lập ngay"}
            />
          </TouchableOpacity>
          <InfoItem label="Email" value={userData.email} />
        </View>

        {/* Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {modalType === "name"
                  ? "✏️ Chỉnh sửa Tên"
                  : modalType === "gender"
                  ? "⚥ Chọn Giới tính"
                  : modalType === "birthDate"
                  ? "📅 Chọn Ngày sinh"
                  : "📞 Chỉnh sửa Số điện thoại"}
              </Text>
              <View style={styles.modalBody}>
                {(modalType === "name" || modalType === "phone") && (
                  <TextInput
                    mode="outlined"
                    placeholder={
                      modalType === "name"
                        ? "Nhập tên mới"
                        : "Nhập số điện thoại mới"
                    }
                    keyboardType={
                      modalType === "phone" ? "phone-pad" : "default"
                    }
                    value={newInfo}
                    onChangeText={setNewInfo}
                    style={styles.input}
                  />
                )}
                {modalType === "gender" && (
                  <RadioButton.Group
                    onValueChange={(value) => setSelectedGender(value)}
                    value={selectedGender}
                  >
                    <View style={styles.radioButtonGroup}>
                      <RadioButton.Item label="Nam" value="Nam" />
                      <RadioButton.Item label="Nữ" value="Nữ" />
                      <RadioButton.Item label="Khác" value="Khác" />
                    </View>
                  </RadioButton.Group>
                )}
                {modalType === "birthDate" && (
                  <>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>Chọn ngày</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowDatePicker(false);
                          if (date) setBirthDate(date);
                        }}
                      />
                    )}
                  </>
                )}
              </View>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveChanges}
                >
                  <Text style={styles.saveButtonText}>Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Toast />
    </>
  );
}

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, !value && { color: "gray" }]}>
      {value || "Thiết lập ngay"}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  profileContainer: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  changePhotoText: { color: "#6200ee", marginTop: 10, fontSize: 16 },
  infoContainer: { backgroundColor: "#f9f9f9", padding: 15, borderRadius: 10 },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  label: { fontSize: 16, color: "#333" },
  value: { fontSize: 16, color: "#333" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalBody: { marginVertical: 10 },
  input: { width: "100%", marginBottom: 20 },
  radioButtonGroup: { width: "100%", marginBottom: 20 },
  dateButton: {
    backgroundColor: "#6200ee",
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
  },
  dateButtonText: { color: "#fff", fontSize: 16 },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  saveButton: { backgroundColor: "#6200ee", padding: 10, borderRadius: 8 },
  saveButtonText: { color: "#fff" },
  cancelButton: { backgroundColor: "#ddd", padding: 10, borderRadius: 8 },
  cancelButtonText: { color: "#333" },
});
