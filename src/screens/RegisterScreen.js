import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { emailValidator } from "../helpers/emailValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { nameValidator } from "../helpers/nameValidator";
import Toast from "react-native-toast-message";

import { auth, db } from "../firebase/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState({ value: "", error: "" });
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [confirmPassword, setConfirmPassword] = useState({
    value: "",
    error: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignUpPressed = () => {
    const nameError = nameValidator(name.value);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    const confirmPasswordError =
      password.value !== confirmPassword.value ? "Mật khẩu không khớp" : "";

    if (nameError || emailError || passwordError || confirmPasswordError) {
      setName({ ...name, error: nameError });
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      setConfirmPassword({ ...confirmPassword, error: confirmPasswordError });
      return;
    }

    setLoading(true);

    createUserWithEmailAndPassword(auth, email.value, password.value)
      .then(async (userCredential) => {
        const user = userCredential.user;

        // Lưu thông tin người dùng vào Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: name.value,
          email: email.value,
          phone: "",
          avatarUrl: "",
        });

        // Gửi email xác nhận
        await sendEmailVerification(user);

        setLoading(false);
        Toast.show({
          type: "success",
          text1: "Đăng ký thành công",
          text2: "Chào mừng bạn đến với ứng dụng!",
        });

        // Thêm khoảng trễ trước khi điều hướng
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "LoginScreen" }], // Thay "Main" bằng tên màn hình chính của bạn
          });
        }, 2000);
      })
      .catch((error) => {
        setLoading(false);
        let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại.";

        if (error.code === "auth/email-already-in-use") {
          errorMessage = "Email đã tồn tại.";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.";
        } else if (error.code === "auth/network-request-failed") {
          errorMessage = "Không có kết nối mạng. Vui lòng kiểm tra lại.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Email không hợp lệ. Vui lòng nhập lại.";
        }

        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: errorMessage,
        });
      });
  };

  return (
    <Background>
      <BackButton
        goBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.replace("StartScreen"); // Hoặc tên màn hình chính bạn muốn
          }
        }}
      />
      <Logo />
      <TextInput
        label="Name"
        returnKeyType="next"
        value={name.value}
        onChangeText={(text) => setName({ value: text, error: "" })}
        error={!!name.error}
        errorText={name.error}
      />
      <TextInput
        label="Email"
        returnKeyType="next"
        value={email.value}
        onChangeText={(text) => setEmail({ value: text, error: "" })}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        returnKeyType="next"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry={!showPassword}
        right={
          <IconButton
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <TextInput
        label="Confirm Password"
        returnKeyType="done"
        value={confirmPassword.value}
        onChangeText={(text) => setConfirmPassword({ value: text, error: "" })}
        error={!!confirmPassword.error}
        errorText={confirmPassword.error}
        secureTextEntry={!showConfirmPassword}
        right={
          <IconButton
            icon={showConfirmPassword ? "eye-off" : "eye"}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        }
      />
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loading}
        />
      ) : (
        <Button
          mode="contained"
          onPress={onSignUpPressed}
          style={{ marginTop: 24 }}
        >
          Xác nhận
        </Button>
      )}
      <View style={styles.row}>
        <Text>Tôi đã có tài khoản! </Text>
        <TouchableOpacity onPress={() => navigation.replace("LoginScreen")}>
          <Text style={styles.link}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  loading: {
    marginTop: 16,
  },
});
