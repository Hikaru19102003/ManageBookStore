import React, { useState } from "react";
import { View, Text, StyleSheet, Button, TextInput, Image, ScrollView, RefreshControl } from "react-native";
import { db, auth } from "../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import Toast from 'react-native-toast-message'; // Import Toast

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { checkoutItems } = route.params;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tính tổng tiền
  const totalPrice = checkoutItems.reduce(
    (total, item) => total + item.priceAtAdded * item.quantity,
    0
  );

  // Thông tin người nhận
  const [recipientInfo, setRecipientInfo] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // Hàm xử lý thanh toán
  const handlePayment = async () => {
    setLoading(true);

    // Kiểm tra thông tin người nhận
    if (!recipientInfo.name || !recipientInfo.address || !recipientInfo.phone) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Thông báo',
        text2: 'Vui lòng nhập đầy đủ thông tin người nhận.',
        visibilityTime: 4000,
        autoHide: true,
      });
      setLoading(false);
      return;
    }

    try {
      // Giả sử gọi API thanh toán hoặc thực hiện thanh toán logic
      const paymentSuccess = await processPayment(checkoutItems, totalPrice);

      if (paymentSuccess) {
        // Tạo đơn hàng trong Firestore sau khi thanh toán thành công
        await createOrder(checkoutItems, totalPrice, recipientInfo);

        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Thành công',
          text2: 'Thanh toán thành công!',
          visibilityTime: 4000,
          autoHide: true,
        });

        navigation.navigate("Trang chủ"); // Quay lại trang chủ hoặc chuyển đến trang đơn hàng
      } else {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Lỗi',
          text2: 'Thanh toán không thành công, vui lòng thử lại.',
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Lỗi khi thanh toán: ", error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Lỗi',
        text2: 'Đã có lỗi xảy ra, vui lòng thử lại.',
        visibilityTime: 4000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Giả lập quá trình thanh toán
  const processPayment = async (items, total) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (total > 0) {
          resolve(true); // Thành công
        } else {
          reject("Thanh toán thất bại");
        }
      }, 2000);
    });
  };

  // Tạo đơn hàng trong Firestore
  const createOrder = async (items, total, recipient) => {
    try {
      const userId = auth.currentUser.uid; // Lấy userId từ Firebase Authentication
      // Lặp qua tất cả các item trong giỏ hàng và tạo đơn hàng cho mỗi món
      for (let item of items) {
        const orderData = {
          bookId: item.bookId, // Mã sách
          bookImageUrl: item.coverImageUrl,
          bookTitle: item.bookTitle,
          orderDate: new Date().toISOString(),
          quantity: item.quantity, // Số lượng sách
          recipientAddress: recipient.address,
          recipientName: recipient.name,
          recipientPhone: recipient.phone,
          status: 0, // Trạng thái đơn hàng (chưa giao)
          totalPrice: item.priceAtAdded * item.quantity, // Tổng tiền cho từng sách
          userId: userId, // ID người dùng
        };

        // Lưu mỗi đơn hàng vào Firestore
        const orderRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Đơn hàng đã được tạo: ", orderRef.id);
      }
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng: ", error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Lỗi',
        text2: 'Không thể tạo đơn hàng. Vui lòng thử lại.',
        visibilityTime: 4000,
        autoHide: true,
      });
    }
  };

  // Hàm Refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Thực hiện hành động cần thiết khi kéo lại
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thông tin đặt hàng</Text>

      <ScrollView
        style={styles.itemsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {checkoutItems.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <Image source={{ uri: item.coverImageUrl }} style={styles.bookImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.bookTitle}>{item.bookTitle}</Text>
              <Text style={styles.itemText}>Số lượng: {item.quantity}</Text>
              <Text style={styles.itemText}>Giá mỗi sách: {item.priceAtAdded.toLocaleString()} đ</Text>
              <Text style={styles.itemText}>Tổng tiền: {(item.priceAtAdded * item.quantity).toLocaleString()} đ</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Họ tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Tên người nhận"
          value={recipientInfo.name}
          onChangeText={(text) => setRecipientInfo({ ...recipientInfo, name: text })}
        />
        <Text style={styles.label}>Địa chỉ giao hàng</Text>
        <TextInput
          style={styles.input}
          placeholder="Địa chỉ người nhận"
          value={recipientInfo.address}
          onChangeText={(text) => setRecipientInfo({ ...recipientInfo, address: text })}
        />
        <Text style={styles.label}>Điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại người nhận"
          keyboardType="phone-pad"
          value={recipientInfo.phone}
          onChangeText={(text) => setRecipientInfo({ ...recipientInfo, phone: text })}
        />
      </View>

      <View style={styles.totalPriceContainer}>
        <Text style={styles.totalPriceText}>Tổng tiền: {totalPrice.toLocaleString()} đ</Text>
      </View>

      <Button
        title={loading ? "Đang đặt hàng..." : "Xác nhận đặt hàng"}
        onPress={handlePayment}
        disabled={loading}
        color="#4CAF50"
      />
      {/* Toast component should be added here */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  header: {
    fontSize: 22,  // Giảm kích cỡ font
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  itemsList: {
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: "row",
    padding: 10, // Giảm khoảng cách padding
    backgroundColor: "#fff",
    marginBottom: 10, // Giảm khoảng cách giữa các item
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  bookImage: {
    width: 70,  // Giảm kích thước ảnh
    height: 100, // Giảm kích thước ảnh
    marginRight: 10,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,  // Giảm kích thước font
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  itemText: {
    fontSize: 12,  // Giảm kích thước font
    color: "#555",
    marginBottom: 4,
  },
  inputContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,  // Giảm kích thước font
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    height: 40, // Giảm chiều cao input
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    paddingLeft: 10,
    backgroundColor: "#fff",
    fontSize: 14,  // Giảm kích thước font
  },
  totalPriceContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  totalPriceText: {
    fontSize: 16,  // Giảm kích thước font
    fontWeight: "bold",
    textAlign: "center",
    color: "#e91e63",
  },
}); 
