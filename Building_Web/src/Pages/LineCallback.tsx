import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const LineCallback = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code) {
      // 發送 POST 給後端，交換 access_token 並取得 user 資料
      fetch("http://localhost:8080/api/line-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("後端登入失敗");
          }
          return res.json();
        })
        .then((data) => {
          console.log("登入成功，使用者資料：", data);

          // 可以儲存到 localStorage / context，這邊暫時使用 localStorage
          localStorage.setItem("user", JSON.stringify(data));

          // 導回首頁
          navigate("/");
        })
        .catch((err) => {
          console.error("登入錯誤", err);
          setError("登入失敗，請稍後再試");
        });
    } else {
      setError("缺少 LINE 授權碼");
    }
  }, [searchParams, navigate]);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-xl">
        {error ? error : "登入處理中，請稍候..."}
      </p>
    </div>
  );
};

export default LineCallback;
