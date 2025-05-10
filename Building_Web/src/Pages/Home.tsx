import React, { useEffect, useState } from "react";
import { User, Floor } from "../Types";
import BuildingDecoration from "../Components/BuildingDecoration";

// 未登入預設樓層（1~10）
const defaultFloors: Floor[] = Array.from({ length: 10 }, (_, i) => ({
  floorNumber: i + 1,
  label: "",
  isPublicSpace: i + 1 <= 5, // 1~5 是公共空間
}));

const Home = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        floor: Number(parsed.floor), // ✅ 關鍵修正
      };
    }
    return null;
  });  

  const [floors, setFloors] = useState<Floor[]>([]);

  useEffect(() => {
    if (currentUser) {
      // 若已登入，從後端取得樓層資料
      fetch("http://localhost:8080/api/floors")
        .then((res) => res.json())
        .then((userFloors: Floor[]) => {
          setFloors([...defaultFloors, ...userFloors]);
          console.log("💡 currentUser", currentUser);

        })
        .catch((err) => {
          console.error("載入樓層失敗", err);
          setFloors(defaultFloors);
        });
    } else {
      // 未登入：只顯示預設樓層
      setFloors(defaultFloors);
    }
  }, [currentUser]);

  const handleMove = (targetFloor: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, floor: targetFloor });
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-10 px-4">
      {/* 註冊/登入選項 */}
      <div className="fixed top-4 right-4 z-50">
  {currentUser ? (
    <div className="bg-gray-100 px-4 py-2 rounded text-gray-800 shadow">
      Hi! {currentUser.name}，👋 歡迎回家
    </div>
  ) : (
    <a
      href="https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2007364290&redirect_uri=http://localhost:5173/callback&state=xyz123&scope=profile%20openid&bot_prompt=normal"
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      使用 LINE 註冊／登入
    </a>
  )}
</div>



      {/* 樓層顯示 */}
      <div className="w-full max-w-md border border-gray-700 bg-white shadow-xl">
        {floors
          .sort((a, b) => b.floorNumber - a.floorNumber)
          .map((floor) => (
            <div
              key={floor.floorNumber}
              className="relative border-b border-black h-16 flex items-center justify-between px-4"
            >
              <div className="w-1/5 text-lg font-bold">{floor.floorNumber}F</div>
              <div className="w-2/5 text-lg">{floor.label || `${floor.floorNumber}F`}</div>

              {currentUser?.floor === floor.floorNumber && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <img
                    src={currentUser.avatar}
                    alt="使用者頭像"
                    className="w-8 h-8 rounded-full border border-gray-300 shadow"
                  />
                </div>
              )}


              {floor.isPublicSpace && currentUser && (
                <button
                  onClick={() => handleMove(floor.floorNumber)}
                  className="text-sm px-3 py-1 border rounded bg-white hover:bg-gray-100"
                >
                  Move to {floor.label || `${floor.floorNumber}F`}
                </button>
              )}
            </div>
          ))}
      </div>
      <BuildingDecoration />
    </div>
  );
};

export default Home;
