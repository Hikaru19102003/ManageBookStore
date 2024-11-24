import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Button, Card, Avatar, Divider } from "react-native-paper";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const MAX_ORDERS_DISPLAY = 2;

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUser(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const ordersRef = query(
        collection(db, "orders"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(ordersRef);
      setOrders(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchOrders();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    await fetchOrders();
    setRefreshing(false);
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigation.replace("LoginScreen"));
  };

  const renderOrderItem = ({ item }) => (
    <Card style={styles.orderCard}>
      <Card.Content style={styles.orderContent}>
        <Image source={{ uri: item.bookImageUrl }} style={styles.orderImage} />
        <View style={styles.orderDetails}>
          <Text style={styles.orderTitle}>{item.bookTitle}</Text>
          <Text style={styles.orderQuantity}>Số lượng: {item.quantity}</Text>
          <Text style={styles.orderTotal}>
            Tổng tiền: {item.totalPrice.toLocaleString()} đ
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            <Card style={styles.profileCard}>
              <Card.Content style={styles.profileContent}>
                <Avatar.Image
                  source={{
                    uri:
                      user?.avatarUrl ||
                      "https://i.pinimg.com/1200x/f7/41/06/f74106a84701dd58d5c4ab913fb11d00.jpg",
                  }}
                  size={100}
                  style={styles.avatar}
                />
                <Text style={styles.userName}>
                  {user?.name || "Tên người dùng"}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() =>
                    navigation.navigate("UserDetailsScreen", { user })
                  }
                  style={styles.detailButton}
                >
                  Thông tin chi tiết
                </Button>
              </Card.Content>
            </Card>
            <Divider style={{ marginVertical: 10 }} />
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đơn hàng của tôi</Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate("OrderHistoryScreen")}
                  style={styles.viewMoreButton}
                >
                  Xem thêm
                </Button>
              </View>
            </View>
          </>
        }
        data={orders.slice(0, MAX_ORDERS_DISPLAY)}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có đơn hàng nào.</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
      <Divider style={{ marginVertical: 10 }} />
      <View style={styles.settingsSection}>
        <Button
          icon="cog"
          mode="outlined"
          onPress={() => navigation.navigate("SettingsScreen")}
          style={styles.settingsButton}
        >
          Cài đặt
        </Button>
        <Button
          icon="logout"
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Đăng xuất
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  profileCard: {
    margin: 10,
    borderRadius: 10,
  },
  profileContent: {
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 8,
  },
  detailButton: {
    marginTop: 10,
    borderColor: "#6200ee",
  },
  section: {
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  sectionHeader: {
    flexDirection: "row", // Hiển thị tiêu đề và nút "Xem thêm" theo hàng ngang
    justifyContent: "space-between", // Đẩy hai phần về hai phía
    alignItems: "center", // Căn giữa theo chiều dọc
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  orderCard: {
    margin: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 3,
  },
  orderContent: {
    flexDirection: "row",
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  orderDetails: {
    marginLeft: 10,
    justifyContent: "center",
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  orderQuantity: {
    fontSize: 14,
    color: "#555",
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200ee",
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
  viewMoreButton: {
    alignSelf: "flex-end",
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  settingsButton: {
    marginBottom: 10,
    borderColor: "#6200ee",
  },
  logoutButton: {
    backgroundColor: "#d32f2f",
  },
});
