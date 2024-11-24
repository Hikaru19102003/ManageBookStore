import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
} from "react-native";
import { getDoc, doc, addDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

export default function CheckoutScreen({ route }) {
  const { bookId, quantity } = route.params; // Nhận dữ liệu từ BookDetailsScreen
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Trạng thái Pull to Refresh
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const userId = auth.currentUser ? auth.currentUser.uid : null;
  const navigation = useNavigation();

  // Fetch Book Details
  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const bookDoc = await getDoc(doc(db, "books", bookId));
      if (bookDoc.exists()) {
        setBook(bookDoc.data());
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tìm thấy thông tin sách.",
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin sách:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải thông tin sách. Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false); // Tắt trạng thái pull to refresh
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookDetails();
  };

  // Handle payment confirmation
  const [paymentSuccessModalVisible, setPaymentSuccessModalVisible] =
    useState(false);

  const handleConfirmPayment = async () => {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      Toast.show({
        type: "error",
        text1: "Thông báo",
        text2: "Vui lòng điền đầy đủ các thông tin bắt buộc!",
      });
      return;
    }

    if (!/^\d{10,11}$/.test(phone)) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Số điện thoại không hợp lệ. Vui lòng nhập lại.",
      });
      return;
    }

    if (!userId) {
      Toast.show({
        type: "error",
        text1: "Thông báo",
        text2: "Vui lòng đăng nhập để thực hiện thanh toán!",
      });
      return;
    }

    if (!book) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Thông tin sách không hợp lệ. Vui lòng thử lại.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const totalPrice = book.price * quantity;

      const order = {
        userId,
        bookId,
        bookTitle: book.title,
        quantity,
        totalPrice,
        recipientName: name,
        recipientAddress: address,
        recipientPhone: phone,
        orderDate: new Date().toISOString(),
        bookImageUrl: book.coverImageUrl,
        status: 0, // Trạng thái đơn hàng mặc định là 0 (chưa xử lý)
      };

      await addDoc(collection(db, "orders"), order);

      // Hiển thị Modal thành công
      setPaymentSuccessModalVisible(true);
    } catch (error) {
      console.error("Lỗi khi xác nhận thanh toán:", error);
      let errorMessage = "Không thể xác nhận thanh toán. Vui lòng thử lại.";
      if (error.message.includes("network")) {
        errorMessage = "Kết nối mạng không ổn định. Vui lòng kiểm tra.";
      }
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {loading ? (
        <ActivityIndicator size="large" color="#e53935" />
      ) : (
        <>
          {/* Book Information Section */}
          {book && (
            <View style={styles.bookDetailsCard}>
              <Image
                source={{ uri: book.coverImageUrl }}
                style={styles.bookImage}
              />
              <View style={styles.bookDetails}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>Tác giả: {book.author}</Text>
                <View style={styles.separator} />
                <Text style={styles.highlightText}>Số lượng: {quantity}</Text>
                <Text style={styles.bookPrice}>
                  Giá sách: {book.price.toLocaleString()} VND
                </Text>
                <Text style={styles.totalPrice}>
                  Tổng tiền: {(book.price * quantity).toLocaleString()} VND
                </Text>
              </View>
            </View>
          )}

          {/* Form Section */}
          <View style={styles.form}>
            <Text style={styles.label}>Tên người nhận</Text>
            <TextInput
              style={styles.input}
              placeholder="Họ tên"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Địa chỉ giao hàng</Text>
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.label}>Điện thoại người nhận</Text>
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={phone}
              keyboardType="phone-pad"
              onChangeText={setPhone}
            />

            <TouchableOpacity
              style={[styles.button, submitting && styles.disabledButton]}
              onPress={handleConfirmPayment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Xác nhận đặt hàng</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal Thanh Toán Thành Công */}
      {paymentSuccessModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={paymentSuccessModalVisible}
          onRequestClose={() => setPaymentSuccessModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Xác nhận thành công!</Text>
              <Text style={styles.modalText}>
                Đơn hàng của bạn đã được xác nhận. Cảm ơn bạn đã mua hàng!
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setPaymentSuccessModalVisible(false);
                  navigation.navigate("BookDetailsScreen", { bookId });
                }}
              >
                <Text style={styles.modalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  bookDetailsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignItems: "center",
  },
  bookImage: {
    width: 100,
    height: 150,
    resizeMode: "cover",
    borderRadius: 5,
    marginRight: 15,
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  bookAuthor: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  highlightText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 5,
  },
  bookPrice: {
    fontSize: 15,
    color: "#333",
    marginBottom: 5,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e53935",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#6200ee",
    borderRadius: 5,
    paddingVertical: 15,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBackground: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0, 0, 0, 0.6)",
},
modalContent: {
  width: "80%",
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: 20,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 5,
  elevation: 5,
},
modalTitle: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#333",
  marginBottom: 10,
},
modalText: {
  fontSize: 16,
  textAlign: "center",
  color: "#555",
  marginBottom: 20,
},
modalButton: {
  backgroundColor: "#007BFF",
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 5,
},
modalButtonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
},
});
