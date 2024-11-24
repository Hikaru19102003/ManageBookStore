import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Card, Menu, Provider, Chip, Divider } from "react-native-paper";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialIcons"; // Import Icon for search and clear button

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [priceMenuVisible, setPriceMenuVisible] = useState(false);
  const [timeMenuVisible, setTimeMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterCriteria, setFilterCriteria] = useState("all"); // Add this line to declare the state

  // Fetch orders from Firebase
  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      if (!auth.currentUser) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Bạn cần đăng nhập để xem lịch sử đơn hàng.",
        });
        setOrders([]);
        setFilteredOrders([]);
        setRefreshing(false);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "orders"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const ordersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu đơn hàng:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.",
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle search query
  const handleSearch = (query) => {
    setSearchQuery(query);

    let filteredList = books;

    // Lọc theo từ khóa tìm kiếm
    if (query.trim() !== "") {
      filteredList = books.filter((book) =>
        book.title.toLowerCase().includes(query.toLowerCase().trim())
      );
    }

    // Áp dụng tiêu chí lọc
    if (filterCriteria === "priceLowToHigh") {
      filteredList = filteredList.sort((a, b) => a.price - b.price);
    } else if (filterCriteria === "priceHighToLow") {
      filteredList = filteredList.sort((a, b) => b.price - a.price);
    }

    setFilteredBooks(filteredList);
  };

  // Handle filter by price
  const handleFilter = (criteria) => {
    setPriceMenuVisible(false); // Close price menu when another menu is opened
    setStatusMenuVisible(false); // Close the status menu when price filter is clicked
    setFilterCriteria(criteria); // Update the filter criteria state
    let filteredList = orders;

    if (criteria === "priceLowToHigh") {
      filteredList = [...orders].sort((a, b) => a.totalPrice - b.totalPrice);
    } else if (criteria === "priceHighToLow") {
      filteredList = [...orders].sort((a, b) => b.totalPrice - a.totalPrice);
    }

    setFilteredOrders(filteredList);
  };

  // Handle filter by status
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    let filteredList = orders;
    if (status !== "all") {
      filteredList = filteredList.filter(
        (order) => order.status === parseInt(status)
      );
    }
    setFilteredOrders(filteredList);
    setStatusMenuVisible(false); // Close status menu when another menu is opened
  };

  // Handle filter by time (newest or oldest)
  const handleTimeFilter = (timePeriod) => {
    setTimeFilter(timePeriod);
    handleSearch(searchQuery); // Reapply filters with the new time filter
    setTimeMenuVisible(false); // Close time menu when another menu is opened
  };

  // Handle delete order
  const handleDeleteOrder = async (orderId) => {
    Alert.alert(
      "Xóa đơn hàng",
      "Bạn có chắc chắn muốn xóa đơn hàng này?",
      [
        {
          text: "Hủy",
          onPress: () => console.log("Hủy xóa"),
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "orders", orderId));
              setOrders(orders.filter((order) => order.id !== orderId));
              setFilteredOrders(
                filteredOrders.filter((order) => order.id !== orderId)
              );
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Đơn hàng đã được xóa.",
              });
            } catch (error) {
              console.error("Lỗi khi xóa đơn hàng:", error);
              Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: "Không thể xóa đơn hàng. Vui lòng thử lại sau.",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Refresh orders
  const onRefresh = async () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFilterCriteria("all");
    setTimeFilter("all");
    await fetchOrders();
  };

  // Render order item
  const renderOrder = ({ item }) => {
    let statusText = "";
    let statusStyle = {};
    switch (item.status) {
      case 0:
        statusText = "Chờ xác nhận";
        statusStyle = styles.pendingStatus;
        break;
      case 1:
        statusText = "Đã xác nhận";
        statusStyle = styles.confirmedStatus;
        break;
      case 2:
        statusText = "Đang giao hàng";
        statusStyle = styles.shippingStatus;
        break;
      case 3:
        statusText = "Đã giao hàng";
        statusStyle = styles.deliveredStatus;
        break;
      default:
        statusText = "Không xác định";
        statusStyle = styles.unknownStatus;
        break;
    }

    return (
      <Card
        style={styles.card}
        onPress={() =>
          navigation.navigate("OrderConfirmationScreen", {
            orderId: item.id,
          })
        }
      >
        <Card.Content style={styles.cardContent}>
          <Image
            source={
              item.bookImageUrl
                ? { uri: item.bookImageUrl }
                : require("../../assets/app.png")
            }
            style={styles.image}
          />
          <Text style={styles.title} numberOfLines={2}>
            {item.bookTitle}
          </Text>
          <Text style={styles.price}>{item.totalPrice.toLocaleString()} đ</Text>
          <Text style={styles.details}>
            Ngày đặt: {new Date(item.orderDate).toLocaleDateString()}
          </Text>
          <Text style={[styles.status, statusStyle]}>{statusText}</Text>

          {/* Display delete button only for "Đã giao hàng" orders */}
          {item.status === 3 && (
            <Icon
              name="delete"
              size={25}
              color="#e53935"
              style={styles.deleteIcon}
              onPress={() => handleDeleteOrder(item.id)}
            />
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <Provider>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon
            name="search"
            size={20}
            color="#ccc"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên sách..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Icon
              name="clear"
              size={20}
              color="#ccc"
              style={styles.clearIcon}
              onPress={clearSearch} // Clear search when icon is pressed
            />
          )}
        </View>

        {/* Filter Menus */}
        <View style={styles.filterContainer}>
          {/* Price Filter */}
          <Menu
            visible={priceMenuVisible}
            onDismiss={() => setPriceMenuVisible(false)}
            anchor={
              <Chip
                icon="filter-outline"
                onPress={() => {
                  setStatusMenuVisible(false); // Close the status menu when price filter is clicked
                  setPriceMenuVisible(true);
                }}
                style={styles.chip}
              >
                Lọc giá
              </Chip>
            }
          >
            <Menu.Item
              onPress={() => handleFilter("priceLowToHigh")}
              title="Giá từ thấp đến cao"
            />
            <Menu.Item
              onPress={() => handleFilter("priceHighToLow")}
              title="Giá từ cao đến thấp"
            />
          </Menu>

          {/* Status Filter */}
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Chip
                icon="check-circle-outline"
                onPress={() => {
                  setPriceMenuVisible(false); // Close the price menu when status filter is clicked
                  setStatusMenuVisible(true);
                }}
                style={styles.chip}
              >
                Trạng thái
              </Chip>
            }
          >
            <Menu.Item
              onPress={() => handleStatusFilter("all")}
              title="Tất cả"
            />
            <Menu.Item
              onPress={() => handleStatusFilter("0")}
              title="Chờ xác nhận"
            />
            <Menu.Item
              onPress={() => handleStatusFilter("1")}
              title="Đã xác nhận"
            />
            <Menu.Item
              onPress={() => handleStatusFilter("2")}
              title="Đang giao hàng"
            />
            <Menu.Item
              onPress={() => handleStatusFilter("3")}
              title="Đã giao hàng"
            />
          </Menu>

          {/* Time Filter */}
          <Menu
            visible={timeMenuVisible}
            onDismiss={() => setTimeMenuVisible(false)}
            anchor={
              <Chip
                icon="calendar"
                onPress={() => {
                  setPriceMenuVisible(false); // Close the price menu when time filter is clicked
                  setStatusMenuVisible(false); // Close status menu
                  setTimeMenuVisible(true);
                }}
                style={styles.chip}
              >
                Thời gian
              </Chip>
            }
          >
            <Menu.Item
              onPress={() => handleTimeFilter("newest")}
              title="Mới nhất"
            />
            <Menu.Item
              onPress={() => handleTimeFilter("oldest")}
              title="Cũ nhất"
            />
          </Menu>
        </View>

        <Divider />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007BFF"
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 10,
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "Không có đơn hàng nào khớp với tìm kiếm."
                    : "Bạn chưa có đơn hàng nào."}
                </Text>
              </View>
            )}
          />
        )}
      </View>
      <Toast />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#f0f2f5",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 40, // Increase left padding for space for the icon
    marginBottom: 10,
    fontSize: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: 10,
  },
  clearIcon: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  searchBar: {
    marginBottom: 10,
    borderRadius: 20, // Bo góc mềm mại
    elevation: 2, // Hiệu ứng nổi
    backgroundColor: "#ffffff", // Nền trắng
    borderWidth: 1, // Thêm viền
    borderColor: "#ddd", // Màu viền nhẹ
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  chip: {
    marginRight: 5,
    backgroundColor: "#ffffff",
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    maxWidth: "48%",
    height: 280,
    elevation: 5,
  },
  cardContent: {
    padding: 10,
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderRadius: 5,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  price: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "bold",
  },
  details: {
    fontSize: 12,
    color: "#555",
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlign: "center",
  },
  pendingStatus: {
    backgroundColor: "#ffeb3b",
    color: "#555",
  },
  confirmedStatus: {
    backgroundColor: "#4caf50",
    color: "#fff",
  },
  shippingStatus: {
    backgroundColor: "#2196f3",
    color: "#fff",
  },
  deliveredStatus: {
    backgroundColor: "#8bc34a",
    color: "#fff",
  },
  unknownStatus: {
    backgroundColor: "#9e9e9e",
    color: "#fff",
  },
  deleteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff", // Optional background to make the icon stand out
    borderRadius: 15,
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
  },
  loader: {
    marginTop: 50,
  },
});
