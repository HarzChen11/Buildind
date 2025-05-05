import { useEffect, useState } from "react";

export default function LineCallback() {
  const [status, setStatus] = useState("登入中...");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
  
    if (!code) {
      setStatus("❌ 無法取得登入憑證（code），請重新登入");
      return;
    }
  
    console.log("🔍 準備送出 code:", code);
  
    fetch("http://localhost:8080/api/line-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("❌ 後端錯誤");
        return res.json();
      })
      .then((data) => {
        console.log("✅ 成功登入，取得資料：", data);
        setStatus("✅ 登入成功！");
      })
      .catch((err) => {
        console.error("❌ 登入失敗：", err);
        setStatus("❌ 登入失敗，請稍後再試");
      });
  }, []);
}