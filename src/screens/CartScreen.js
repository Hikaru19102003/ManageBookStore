import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, Button, Alert, RefreshControl } from "react-native";
import { db, auth } from "../firebase/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function CartScreen() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  const navigation = useNavigation();

  // Lấy giỏ hàng của người dùng từ Firebase Firestore
  const fetchCartItems = async () => {
    if (!userId) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để xem giỏ hàng.");
      setLoading(false);
      return;
    }

    try {
      const cartSnapshot = await getDocs(collection(db, "carts"));
      const userCart = cartSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find((cart) => cart.userId === userId);

      if (userCart) {
        setCartItems(userCart.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu giỏ hàng từ Firestore: ", error);
      Alert.alert("Lỗi", "Không thể tải giỏ hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
      setRefreshing(false); // Dừng làm mới sau khi hoàn tất
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCartItems();
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const newCartItems = cartItems.filter((item) => item.bookId !== itemId);
      const cartRef = doc(db, "carts", userId);
      await updateDoc(cartRef, { items: newCartItems });
      setCartItems(newCartItems);
      Alert.alert("Thành công", "Đã xóa mục khỏi giỏ hàng.");
    } catch (error) {
      console.error("Lỗi khi xóa mục khỏi giỏ hàng: ", error);
      Alert.alert("Lỗi", "Không thể xóa mục. Vui lòng thử lại.");
    }
  };

  // Hàm thay đổi số lượng sản phẩm
  const updateQuantity = async (itemId, action) => {
    const updatedItems = cartItems.map((item) => {
      if (item.bookId === itemId) {
        const newQuantity = action === "increase" ? item.quantity + 1 : item.quantity - 1;
        return { ...item, quantity: Math.max(newQuantity, 1) }; // Đảm bảo số lượng không bé hơn 1
      }
      return item;
    });

    // Cập nhật giỏ hàng trong Firestore
    try {
      const cartRef = doc(db, "carts", userId);
      await updateDoc(cartRef, { items: updatedItems });
      setCartItems(updatedItems);
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng giỏ hàng: ", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng sản phẩm.");
    }
  };

  // Xử lý khi nhấn nút "Thanh toán"
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Giỏ hàng trống",
        "Bạn không thể thanh toán khi giỏ hàng của bạn trống."
      );
      return;
    }

    // Chuyển hướng đến PaymentScreen và truyền bookId, quantity vào
    const checkoutItems = cartItems.map(item => ({
      bookId: item.bookId,
      quantity: item.quantity,
      priceAtAdded: item.priceAtAdded, // Lưu giá trị khi thêm vào giỏ hàng
      bookTitle: item.bookTitle, // Lưu tên sách
      coverImageUrl: item.coverImageUrl, // Lưu ảnh sách
    }));

    navigation.navigate("PaymentScreen", { checkoutItems}); // Truyền dữ liệu qua
  };

  // Tính tổng tiền trong giỏ hàng
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.priceAtAdded * item.quantity,
    0
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.bookId}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image
              source={{
                uri: item.coverImageUrl || "https://via.placeholder.com/100x150",
              }}
              style={styles.image}
            />
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{item.bookTitle}</Text>
              <Text style={styles.priceText}>Giá: {item.priceAtAdded.toLocaleString()} đ</Text>
              <View style={styles.quantityContainer}>
                <Button
                  title="-"
                  onPress={() => updateQuantity(item.bookId, "decrease")}
                  color="#FF6347"
                />
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Button
                  title="+"
                  onPress={() => updateQuantity(item.bookId, "increase")}
                  color="#FF6347"
                />
              </View>
              <Button
                title="Xóa"
                onPress={() => handleRemoveItem(item.bookId)}
                color="#DC143C"
              />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyCartText}>Giỏ hàng của bạn trống.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
      <View style={styles.totalPriceContainer}>
        <Text style={styles.totalPriceText}>
          Tổng tiền: {totalPrice.toLocaleString()} đ
        </Text>
      </View>
      <Button title="Đặt hàng" onPress={handleCheckout} color="#28A745" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
    color: "#333",
  },
  emptyCartText: {
    fontSize: 16,
    textAlign: "center",
    color: "#888",
  },
  totalPriceContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 7,
    alignItems: "center",
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e91e63",
  },
});
