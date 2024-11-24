import React, { useState } from "react";
import { StyleSheet, ActivityIndicator } from "react-native";
import Background from "../components/Background";
import BackButton from "../components/BackButton";
import Logo from "../components/Logo";
import Header from "../components/Header";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { emailValidator } from "../helpers/emailValidator";
import Toast from "react-native-toast-message";

import { auth } from "../firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const sendResetPasswordEmail = () => {
    const emailError = emailValidator(email.value);
    if (emailError) {
      setEmail({ ...email, error: emailError });
      return;
    }

    // Kiểm tra số lần gửi yêu cầu, giới hạn 3 lần
    if (attempts >= 3) {
      Toast.show({
        type: "error",
        text1: "Quá nhiều yêu cầu",
        text2: "Bạn đã gửi quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.",
      });
      return;
    }

    setLoading(true);

    sendPasswordResetEmail(auth, email.value)
      .then(() => {
        setLoading(false);
        setAttempts(attempts + 1); // Tăng số lần gửi yêu cầu
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đường dẫn đặt lại mật khẩu đã được gửi đến email của bạn.",
        });
        // navigation.navigate("LoginScreen");
      })
      .catch((error) => {
        setLoading(false);
        let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại.";
        if (error.code === "auth/user-not-found") {
          errorMessage = "Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.";
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
      <BackButton goBack={navigation.goBack} />
      <Logo />
      {/* <Header>Quên mật khẩu</Header> */}
      <TextInput
        label="Email"
        returnKeyType="done"
        value={email.value}
        onChangeText={(text) => setEmail({ value: text, error: "" })}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        autoCompleteType="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        description="Bạn sẽ nhận được đường dẫn đặt lại mật khẩu qua email."
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
      ) : (
        <Button mode="contained" onPress={sendResetPasswordEmail} style={{ marginTop: 16 }}>
          Tiếp tục
        </Button>
      )}
      <Toast ref={(ref) => Toast.setRef(ref)} /> 
    </Background>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 16,
  },
});
