import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text, Checkbox } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

import Background from "../components/Background";
import Logo from "../components/Logo";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { emailValidator } from "../helpers/emailValidator";
import { passwordValidator } from "../helpers/passwordValidator";

import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Tải trạng thái rememberMe và showPassword từ AsyncStorage
    const loadPreferences = async () => {
      const savedRememberMe = await AsyncStorage.getItem("rememberMe");
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      const savedPassword = await AsyncStorage.getItem("savedPassword");

      setRememberMe(savedRememberMe === "true");
      if (savedRememberMe === "true") {
        setEmail({ value: savedEmail || "", error: "" });
        setPassword({ value: savedPassword || "", error: "" });
      }
    };
    loadPreferences();
  }, []);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const onLoginPressed = async () => {
    setGeneralError("");
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    setLoading(true);

    signInWithEmailAndPassword(auth, email.value, password.value)
      .then(async () => {
        if (rememberMe) {
          await AsyncStorage.setItem("rememberMe", "true");
          await AsyncStorage.setItem("savedEmail", email.value);
          await AsyncStorage.setItem("savedPassword", password.value);
        } else {
          await AsyncStorage.removeItem("rememberMe");
          await AsyncStorage.removeItem("savedEmail");
          await AsyncStorage.removeItem("savedPassword");
        }
        Toast.show({
          type: "success",
          text1: "Đăng nhập thành công",
        });
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      })
      .catch((error) => {
        let errorMessage = "Email hoặc mật khẩu không chính xác!";
        if (error.code === "auth/user-not-found") {
          errorMessage = "Tài khoản không tồn tại.";
        } else if (error.code === "auth/wrong-password") {
          errorMessage = "Mật khẩu không chính xác.";
        } else if (error.code === "auth/too-many-requests") {
          errorMessage = "Tài khoản tạm thời bị khóa do đăng nhập nhiều lần.";
        }
        setGeneralError(errorMessage);
        Toast.show({
          type: "error",
          text1: "Lỗi đăng nhập",
          text2: errorMessage,
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Background>
      <BackButton goBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace("StartScreen");
        }
      }} />
      <Logo />
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
        returnKeyType="done"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: "" })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry={!showPassword}
        right={
          <TouchableOpacity onPress={toggleShowPassword}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        }
      />
      <View style={styles.optionsContainer}>
        <View style={styles.rememberMeContainer}>
          <Checkbox
            status={rememberMe ? "checked" : "unchecked"}
            onPress={() => setRememberMe(!rememberMe)}
            color={theme.colors.primary}
          />
          <Text>Giữ đăng nhập</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("ResetPasswordScreen")}>
          <Text style={styles.forgot}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>
      {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <Button mode="contained" onPress={onLoginPressed}>
          Đăng nhập
        </Button>
      )}
      <View style={styles.row}>
        <Text>Chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => navigation.replace("RegisterScreen")}>
          <Text style={styles.link}>Tạo tài khoản!</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  generalError: {
    color: theme.colors.error,
    textAlign: "center",
    marginVertical: 10,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  forgotPassword: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
  forgot: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});
