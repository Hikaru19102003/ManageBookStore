import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from "react-native";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function OrderConfirmationScreen({ route }) {
  const navigation = useNavigation();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // State để theo dõi trạng thái refreshing

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          setOrder(orderSnap.data());
        } else {
          console.log("No such order!");
        }
      } catch (error) {
        console.error("Error getting order: ", error);
      } finally {
        setLoading(false);
        setRefreshing(false); // Tắt trạng thái refreshing khi lấy dữ liệu xong
      }
    };

    fetchOrderDetails();
  }, [orderId, refreshing]); // Cập nhật khi refreshing thay đổi

  // Hàm để làm mới dữ liệu
  const onRefresh = () => {
    setRefreshing(true); // Khi kéo xuống, bắt đầu làm mới
    setLoading(true);
  };

  const saveInvoice = async () => {
    if (order) {
      const htmlContent = `
        <html>
          <head><title>Hóa Đơn</title></head>
          <body>
            <h1>Hóa Đơn</h1>
            <p><strong>Tên sách:</strong> ${order.bookTitle}</p>
            <p><strong>Số lượng:</strong> ${order.quantity}</p>
            <p><strong>Tổng tiền:</strong> ${order.totalPrice.toLocaleString()} đ</p>
            <p><strong>Ngày đặt:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            <p><strong>Người nhận:</strong> ${order.recipientName}</p>
            <p><strong>Địa chỉ giao hàng:</strong> ${order.recipientAddress}</p>
            <p><strong>Số điện thoại:</strong> ${order.recipientPhone}</p>
          </body>
        </html>
      `;

      // Tạo file PDF từ HTML
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Lưu hóa đơn vào bộ nhớ thiết bị
      const destinationUri = FileSystem.documentDirectory + 'invoice.pdf';

      try {
        // Sao chép tệp vào thư mục xác định
        await FileSystem.copyAsync({
          from: uri,
          to: destinationUri,
        });

        console.log('Hóa đơn đã được lưu tại:', destinationUri);

        // Sau khi lưu thành công, mở giao diện chia sẻ
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(destinationUri);  // Chia sẻ tệp và để người dùng chọn nơi lưu
        }
      } catch (error) {
        console.error("Lỗi khi lưu tệp hóa đơn: ", error);
      }
    }
  };

  if (loading) {
    return <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>;
  }

  if (!order) {
    return <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>;
  }

  const orderDate = new Date(order.orderDate);
  const formattedDate = orderDate.toLocaleString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let statusText = "";
  switch (order.status) {
    case 0:
      statusText = "Chờ xác nhận";
      break;
    case 1:
      statusText = "Đã xác nhận";
      break;
    case 2:
      statusText = "Đang giao hàng";
      break;
    case 3:
      statusText = "Đã giao hàng";
      break;
    default:
      statusText = "Không xác định";
      break;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Thanh toán thành công!</Text>
        <Text style={styles.subtitle}>Chi tiết đơn hàng của bạn:</Text>
      </View>

      {/* Book Information */}
      <View style={styles.card}>
        <Image source={{ uri: order.bookImageUrl }} style={styles.bookImage} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Tên sách:</Text>
            <Text style={styles.detailText}>{order.bookTitle}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Số lượng:</Text>
            <Text style={styles.detailText}>{order.quantity}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Tổng tiền:</Text>
            <Text style={styles.totalPrice}>{order.totalPrice.toLocaleString()} đ</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Ngày đặt:</Text>
            <Text style={styles.detailText}>{formattedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Người nhận:</Text>
            <Text style={styles.detailText}>{order.recipientName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Địa chỉ giao hàng:</Text>
            <Text style={styles.detailText}>{order.recipientAddress}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Số điện thoại:</Text>
            <Text style={styles.detailText}>{order.recipientPhone}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextBold}>Trạng thái:</Text>
            <Text style={[styles.detailText, styles.statusText]}>{statusText}</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>

        {/* Button to save invoice */}
        <TouchableOpacity style={styles.button} onPress={saveInvoice}>
          <Text style={styles.buttonText}>Xuất hóa đơn</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 18,
    color: "#007BFF",
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    color: "#e53935",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    width: "100%",
    marginBottom: 0,
    marginTop: 5,
  },
  bookImage: {
    width: "100%",
    height: 150,
    resizeMode: "contain",
    borderRadius: 10,
    marginBottom: 10,
  },
  detailsContainer: {
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    flex: 1,
    textAlign: "right",
  },
  detailTextBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "left",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e53935",
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50", // Highlight the status text with green color
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#6200ee",
    paddingVertical: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

