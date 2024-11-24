import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  Image,
  RefreshControl,
} from "react-native";
import {
  getDocs,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

export default function BookDetailsScreen({ route }) {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingComment, setEditingComment] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState({});
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1); // State for the book quantity
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  const navigation = useNavigation(); // Navigation hook
  const [isNavigating, setIsNavigating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // State kiểm soát mô tả
  const [refreshing, setRefreshing] = useState(false);

  const scrollViewRef = useRef(null);
  const commentInputRef = useRef(null);

  const fetchBookDetails = async () => {
    try {
      // Lấy chi tiết sách
      const bookDoc = await getDoc(doc(db, "books", bookId));
      if (bookDoc.exists()) {
        setBook(bookDoc.data());
      } else {
        throw new Error("Không tìm thấy thông tin sách.");
      }

      // Lấy bình luận liên quan đến sách
      const reviewQuery = query(
        collection(db, "reviews"),
        where("bookId", "==", bookId)
      );
      const reviewDocs = await getDocs(reviewQuery);
      const bookReviews = reviewDocs.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id,
      }));

      // Lấy thông tin người dùng theo userId
      const userIds = [...new Set(bookReviews.map((review) => review.userId))];
      const userDocs = await Promise.all(
        userIds.map((id) => getDoc(doc(db, "users", id)))
      );
      const usersData = userDocs.reduce((acc, docSnap, index) => {
        if (docSnap.exists()) {
          acc[userIds[index]] = docSnap.data().name;
        }
        return acc;
      }, {});

      setUsers(usersData);
      setReviews(bookReviews);
    } catch (error) {
      console.error("Lỗi khi tải thông tin sách: ", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải thông tin sách. Vui lòng thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBookDetails(); // Gọi lại hàm fetch dữ liệu
    } catch (error) {
      console.error("Lỗi khi refresh dữ liệu: ", error);
    } finally {
      setRefreshing(false); // Hoàn thành refresh
    }
  };

  const isValidComment = (comment) => {
    if (!comment.trim()) {
      Toast.show({
        type: "info",
        text1: "Chú ý",
        text2: "Bình luận không được để trống.",
      });
      return false;
    }
    return true;
  };
  
  const handleAddOrEditComment = async () => {
    if (!userId) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để gửi bình luận.");
      return;
    }
  
    const commentToValidate = editingReviewId ? editingComment : comment;
    if (!isValidComment(commentToValidate)) return; // Kiểm tra nội dung bình luận
  
    setSubmitting(true);
    try {
      if (editingReviewId) {
        // Chỉnh sửa bình luận
        await updateDoc(doc(db, "reviews", editingReviewId), {
          comment: editingComment.trim(),
        });
        setReviews(
          reviews.map((review) =>
            review.id === editingReviewId
              ? { ...review, comment: editingComment.trim() }
              : review
          )
        );
        setEditingReviewId(null);
        setEditingComment("");
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Bình luận đã được chỉnh sửa.",
        });
      } else {
        // Thêm bình luận mới
        const newComment = {
          bookId,
          userId,
          comment: comment.trim(),
          reviewDate: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, "reviews"), newComment);
        setReviews([...reviews, { ...newComment, id: docRef.id }]);
        setComment("");
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Bình luận đã được gửi.",
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi hoặc chỉnh sửa bình luận: ", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể xử lý bình luận. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };  

  const handleEditComment = (comment) => {
    setEditingReviewId(comment.id);
    setEditingComment(comment.comment);
  };

  const handleSaveEditedComment = async (commentId) => {
    if (!editingComment.trim()) {
      Toast.show({
        type: "info",
        text1: "Chú ý",
        text2: "Bình luận không được để trống.",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "reviews", commentId), {
        comment: editingComment.trim(),
      });

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === commentId
            ? { ...review, comment: editingComment.trim() }
            : review
        )
      );

      setEditingReviewId(null);
      setEditingComment("");
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Bình luận đã được chỉnh sửa.",
      });
    } catch (error) {
      console.error("Lỗi khi lưu chỉnh sửa bình luận: ", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể lưu chỉnh sửa. Vui lòng thử lại.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditingComment("");
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa bình luận này không?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "reviews", commentId));
            setReviews(reviews.filter((review) => review.id !== commentId));
            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "Bình luận đã được xóa.",
            });
          } catch (error) {
            console.error("Lỗi khi xóa bình luận: ", error);
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: "Không thể xóa bình luận. Vui lòng thử lại.",
            });
          }
        },
        style: "destructive",
      },
    ]);
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = async () => {
    // Tạo item cho giỏ hàng với tất cả thông tin sách
    const cartItem = {
      bookId: bookId,
      bookTitle: book.title,
      author: book.author, // Thêm tác giả vào giỏ hàng
      category: book.category, // Thêm thể loại vào giỏ hàng
      coverImageUrl: book.coverImageUrl, // Thêm URL ảnh bìa vào giỏ hàng
      description: book.description, // Thêm mô tả vào giỏ hàng
      priceAtAdded: book.price, // Giá lúc thêm vào giỏ hàng
      quantity: quantity, // Số lượng người dùng muốn mua
    };

    try {
      // Kiểm tra xem người dùng đã có giỏ hàng hay chưa
      const userCartDoc = await getDoc(doc(db, "carts", userId));

      if (userCartDoc.exists()) {
        // Nếu giỏ hàng đã có, lấy dữ liệu giỏ hàng cũ
        const cartData = userCartDoc.data();

        // Kiểm tra xem sách đã có trong giỏ hàng chưa
        const existingItemIndex = cartData.items.findIndex(
          (item) => item.bookId === bookId
        );

        if (existingItemIndex > -1) {
          // Nếu sách đã có, tăng số lượng
          cartData.items[existingItemIndex].quantity += quantity;
        } else {
          // Nếu sách chưa có, thêm sách vào giỏ
          cartData.items.push(cartItem);
        }

        // Cập nhật lại giỏ hàng
        await updateDoc(doc(db, "carts", userId), {
          items: cartData.items,
        });
      } else {
        // Nếu giỏ hàng chưa có, tạo mới giỏ hàng với sách đầu tiên
        await setDoc(doc(db, "carts", userId), {
          userId: userId,
          items: [cartItem],
        });
      }

      // Đóng modal giỏ hàng và hiển thị thông báo thành công
      setCartModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Đã thêm vào giỏ hàng",
      });
    } catch (error) {
      console.error("Error adding item to cart: ", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể thêm vào giỏ hàng.",
      });
    }
  };

  const handlePurchase = () => {
    if (!userId) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để thực hiện mua hàng.");
      return;
    }
    setIsNavigating(true);
    setPurchaseModalVisible(false); // Đóng modal "Mua hàng"
    navigation.navigate("CheckoutScreen", { bookId, quantity });
    setTimeout(() => setIsNavigating(false), 1000); // Đặt lại trạng thái sau khi điều hướng
  };

  const toggleDescription = () => {
    setIsExpanded(!isExpanded); // Thay đổi trạng thái mở rộng
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        commentInputRef.current?.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y, animated: true });
          },
          (error) => console.error("Lỗi khi đo layout:", error)
        );
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }} // Thêm khoảng trống bên dưới
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled" // Đảm bảo cuộn và nhấn
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        } // Thêm Pull to Refresh
      >
        <View style={styles.bookDetails}>
          {loading ? (
            <ActivityIndicator size="large" color="#e53935" />
          ) : book ? (
            <>
              {book.coverImageUrl && (
                <Image
                  source={{ uri: book.coverImageUrl }}
                  style={styles.bookImage}
                />
              )}
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>Tác giả: {book.author}</Text>
              <Text style={styles.description}>
                {book.description?.length > 100
                  ? isExpanded
                    ? book.description
                    : `${book.description.slice(0, 100)}...`
                  : book.description || "Không có mô tả"}
              </Text>
              {book.description?.length > 100 && (
                <TouchableOpacity onPress={toggleDescription}>
                  <Text style={styles.expandButton}>
                    {isExpanded ? "Rút gọn" : "Xem thêm"}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.price}>
                Giá: {book.price.toLocaleString()} đ
              </Text>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Nhập bình luận của bạn..."
                  value={comment}
                  onChangeText={setComment}
                  ref={commentInputRef}
                />
                <TouchableOpacity
                  onPress={handleAddOrEditComment}
                  style={styles.submitButton}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? "Đang gửi..." : "Gửi"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.noReviewsText}>
              Không tìm thấy thông tin sách.
            </Text>
          )}
        </View>
        {reviews.map((item) => (
          <View key={item.id} style={styles.commentContainer}>
            {editingReviewId === item.id ? (
              <>
                <TextInput
                  style={styles.editCommentInput}
                  value={editingComment}
                  onChangeText={setEditingComment}
                  autoFocus={true} // Tự động focus vào ô nhập liệu
                />
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    onPress={() => handleSaveEditedComment(item.id)} // Lưu chỉnh sửa
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>Lưu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancelEdit} // Hủy chỉnh sửa
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.commentUserName}>{users[item.userId]}</Text>
                <Text style={styles.commentText}>{item.comment}</Text>
                <Text style={styles.commentDate}>
                  {new Date(item.reviewDate).toLocaleString()}
                </Text>
                {item.userId === userId && (
                  <View style={styles.commentActions}>
                    <TouchableOpacity
                      onPress={() => handleEditComment(item)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteComment(item.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        ))}
        {reviews.length === 0 && (
          <Text style={styles.noReviewsText}>Chưa có bình luận nào.</Text>
        )}
      </ScrollView>

      {/* Bottom Navbar with Icons */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("ChatScreen")}
        >
          <Icon name="message" size={30} color="#fff" />
          <Text style={styles.navButtonText}>Nhắn tin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCartModalVisible(true)}
        >
          <Icon name="shopping-cart" size={30} color="#fff" />
          <Text style={styles.navButtonText}>Giỏ hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setPurchaseModalVisible(true)}
        >
          <Icon name="storefront" size={30} color="#fff" />
          <Text style={styles.navButtonText}>Mua hàng</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Modal */}
      <Modal
        visible={cartModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCartModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm vào giỏ hàng</Text>
            <Text style={styles.modalTitle}>{book?.title}</Text>
            <Text style={styles.modalSubTitle}>Chọn số lượng</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity onPress={decreaseQuantity}>
                <Text style={styles.quantityButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={increaseQuantity}>
                <Text style={styles.quantityButton}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleAddToCart}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCartModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Purchase Modal */}
      <Modal
        visible={purchaseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{book?.title}</Text>
            <Text style={styles.modalSubTitle}>Chọn số lượng</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity onPress={decreaseQuantity}>
                <Text style={styles.quantityButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={increaseQuantity}>
                <Text style={styles.quantityButton}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handlePurchase}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Mua ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPurchaseModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f8", // Nền xám nhạt
    padding: 10,
  },
  bookDetails: {
    backgroundColor: "#ffffff", // Nền trắng cho chi tiết sách
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3, // Hiệu ứng bóng mờ
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bookImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
    borderRadius: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  author: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#4a4a4a",
    lineHeight: 22,
  },
  expandButton: {
    fontSize: 14,
    color: "#007BFF",
    marginTop: 5,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e53935",
    marginVertical: 10,
  },
  commentContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  commentUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
    marginBottom: 5,
  },
  commentText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 10,
  },
  commentDate: {
    fontSize: 12,
    color: "#888",
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  editButton: {
    marginRight: 10,
  },
  editButtonText: {
    color: "#007BFF",
    fontSize: 14,
  },
  deleteButton: {
    marginLeft: 10,
  },
  deleteButtonText: {
    color: "#e53935",
    fontSize: 14,
  },
  noReviewsText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#007BFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    elevation: 5,
  },
  navButton: {
    alignItems: "center",
  },
  navButtonText: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
  },
  modalSubTitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "60%",
    marginVertical: 10,
  },
  quantityButton: {
    fontSize: 24,
    color: "#007BFF",
    padding: 10,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  editCommentInput: {
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#e53935",
    padding: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
