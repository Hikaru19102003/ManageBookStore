import React, { useState, useEffect, useCallback } from "react";
import {
  getDocs,
  collection,
  query,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from "react-native";
import {
  Card,
  Searchbar,
  Divider,
  Chip,
  Menu,
  Provider,
} from "react-native-paper";
import Toast from "react-native-toast-message";

export default function HomeScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCriteria, setFilterCriteria] = useState("all");
  const [menuVisible, setMenuVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Tải danh sách sách lần đầu khi màn hình hiển thị
  useEffect(() => {
    const loadInitialBooks = async () => {
      try {
        const booksRef = collection(db, "books");
        const bookQuery = query(booksRef, limit(6));
        const querySnapshot = await getDocs(bookQuery);

        if (!querySnapshot.empty) {
          const initialBooks = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setBooks(initialBooks);
          setFilteredBooks(initialBooks);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        } else {
          setBooks([]);
          setFilteredBooks([]);
          Toast.show({
            type: "info",
            text1: "Thông báo",
            text2: "Không có sách để hiển thị.",
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải sách lần đầu:", error);
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải sách. Vui lòng thử lại sau.",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialBooks();
  }, []);

  // Làm mới danh sách sách
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const booksRef = collection(db, "books");
      const bookQuery = query(booksRef, limit(6));
      const querySnapshot = await getDocs(bookQuery);

      if (!querySnapshot.empty) {
        const newBooks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBooks(newBooks);
        setFilteredBooks(newBooks);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setBooks([]);
        setFilteredBooks([]);
        Toast.show({
          type: "info",
          text1: "Thông báo",
          text2: "Không có sách để hiển thị.",
        });
      }
    } catch (error) {
      console.error("Lỗi khi làm mới sách:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể làm mới sách. Vui lòng thử lại sau.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Tải thêm sách khi cuộn đến cuối danh sách
  const fetchBooks = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) setLoadingMore(true);
        else setRefreshing(true);

        const booksRef = collection(db, "books");
        let bookQuery = query(booksRef, limit(6));

        if (isLoadMore && lastVisible) {
          bookQuery = query(booksRef, startAfter(lastVisible), limit(6));
        }

        const querySnapshot = await getDocs(bookQuery);

        if (!querySnapshot.empty) {
          const newBooks = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (isLoadMore) {
            setBooks((prevBooks) => [...prevBooks, ...newBooks]);
            setFilteredBooks((prevBooks) => [...prevBooks, ...newBooks]);
          } else {
            setBooks(newBooks);
            setFilteredBooks(newBooks);
          }

          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        } else if (!isLoadMore) {
          setBooks([]);
          setFilteredBooks([]);
          Toast.show({
            type: "info",
            text1: "Thông báo",
            text2: "Không có sách để hiển thị.",
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải sách:", error);
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tải sách. Vui lòng thử lại sau.",
        });
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setRefreshing(false);
      }
    },
    [lastVisible]
  );

  const onEndReached = () => {
    if (!loadingMore && lastVisible) {
      fetchBooks(true);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredBooks(books);
    } else {
      const filteredList = books.filter((book) =>
        book.title.toLowerCase().includes(query.toLowerCase().trim())
      );
      setFilteredBooks(filteredList);
    }
  };

  const handleFilter = (criteria) => {
    setFilterCriteria(criteria);
    let filteredList = books;

    if (criteria === "priceLowToHigh") {
      filteredList = [...books].sort((a, b) => a.price - b.price);
    } else if (criteria === "priceHighToLow") {
      filteredList = [...books].sort((a, b) => b.price - a.price);
    }

    setFilteredBooks(filteredList);
    setMenuVisible(false);
  };

  const renderBook = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate("BookDetailsScreen", { bookId: item.id })
      }
    >
      <Card.Cover source={{ uri: item.coverImageUrl }} style={styles.image} />
      <Card.Content style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {item.title}
        </Text>
        <Text style={styles.price}>{item.price.toLocaleString()} đ</Text>
      </Card.Content>
    </Card>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Searchbar
          placeholder="Tìm kiếm sách..."
          value={searchQuery}
          onChangeText={handleSearch}
          clearIcon="close"
          onClearIconPress={() => handleSearch("")}
          style={styles.searchBar}
          inputStyle={styles.searchBarInput}
        />

        <View style={styles.filterContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Chip
                icon="filter-outline"
                onPress={() => setMenuVisible(true)}
                style={styles.chip}
              >
                Lọc
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
        </View>
        <Divider />
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 10,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : null
          }
          ListEmptyComponent={() =>
            initialLoading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : searchQuery ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Không có sách nào khớp với tìm kiếm.
                </Text>
              </View>
            ) : null
          }
        />
      </View>
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
  searchBar: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    backgroundColor: "#ffffff",
  },
  searchBarInput: {
    fontSize: 16,
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
    height: 270,
    elevation: 5,
  },
  cardContent: {
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  image: {
    height: 140,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 5,
    color: "#1c1c1c",
    textAlign: "center",
  },
  price: {
    fontSize: 16,
    color: "#d32f2f",
    fontWeight: "bold",
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#ffebee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
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
});
