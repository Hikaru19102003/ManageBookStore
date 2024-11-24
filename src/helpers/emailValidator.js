export function emailValidator(email) {
  const re = /\S+@\S+\.\S+/;
  if (!email || email.length <= 0) return "Email không được để trống.";
  if (!re.test(email)) return "Vui lòng nhập một email hợp lệ.";
  return "";
}
