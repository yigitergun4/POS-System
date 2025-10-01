import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, Query } from "firebase/firestore";
//import TouchKeyboard from "../components/TouchKeyboard";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [keyboardOpen, setKeyboardOpen] = useState<boolean>(false);
  // const [activeField, setActiveField] = useState<"username" | "password">(
  //   "username"
  // );
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const q: Query = query(
        collection(db, "users"),
        where("username", "==", username),
        where("password", "==", password)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0].data();
        login({
          uid: userDoc.uid,
          email: userDoc.email,
          role: userDoc.role,
        });
        navigate("/sales", { replace: true });
      } else {
        setError("Geçersiz kullanıcı adı veya şifre");
      }
    } catch (err) {
      console.error(err);
      setError("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  // const keyboardValue: number =
  //   activeField === "username" ? Number(username) : Number(password);
  // const keyboardOnChange: (next: number) => void = (next: number) =>
  //   activeField === "username"
  //     ? setUsername(next.toString())
  //     : setPassword(next.toString());

  // function handleKeyboardDone() {
  //   if (activeField === "username") {
  //     setActiveField("password");
  //     passRef.current?.focus();
  //   } else {
  //     setKeyboardOpen(false);
  //   }
  // }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 ${
        keyboardOpen ? "pb-32" : "pb-4"
      }`}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold">POS</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">POS Sistemi</h1>
          <p className="text-gray-600 text-center text-sm">
            Mağazanızı yönetmek için giriş yapın
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-6 space-y-4"
        >
          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              ref={userRef}
              className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl px-3 py-3 text-base outline-none text-gray-900"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => {
                //setActiveField("username");
                setKeyboardOpen(true);
              }}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <input
                ref={passRef}
                type={showPassword ? "text" : "password"}
                className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl px-3 py-3 pr-16 text-base outline-none text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => {
                  //setActiveField("password");
                  setKeyboardOpen(true);
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-2 rounded-lg text-xs font-medium text-white bg-blue-500"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Gizle" : "Göster"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-blue-600 disabled:bg-gray-400 text-white rounded-xl py-3 text-base font-semibold shadow-lg active:scale-95 transition-transform"
          >
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      </div>
      {/* TODO: keyboard will be added later */}
      {/* {keyboardOpen && (
        <TouchKeyboard
          onClose={() => setKeyboardOpen(false)}
          value={keyboardValue}
          onChange={keyboardOnChange}
          onDone={handleKeyboardDone}
        />
      )} */}
    </div>
  );
}
