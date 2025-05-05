import React, { useState } from "react";
import { User, Floor } from "../Types";
import BuildingDecoration from "../Components/BuildingDecoration";

const initialFloors: Floor[] = [
  { floorNumber: 105, label: "E 室", isPublicSpace: false },
  { floorNumber: 104, label: "D 室", isPublicSpace: false },
  { floorNumber: 103, label: "C 定", isPublicSpace: false },
  { floorNumber: 100, label: "A 定", isPublicSpace: false },
  { floorNumber: 99, label: "未定", isPublicSpace: false },
  { floorNumber: 5, label: "Gym", isPublicSpace: true },
  { floorNumber: 4, label: "Cinema", isPublicSpace: true },
  { floorNumber: 3, label: "Cafe", isPublicSpace: true },
  { floorNumber: 1, label: "OUTSIDE", isPublicSpace: true },
];

const Home = () => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: "u001",
    name: "Harz",
    avatar: "🧍‍♀️",
    floor: 103,
  });

  const handleMove = (targetFloor: number) => {
    setCurrentUser((prev) => ({ ...prev, floor: targetFloor }));
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-10 px-4">

      {/* 註冊/登入選項 */}
      <div className="fixed top-4 right-4 z-50">
        <a
          href="https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2007364290&redirect_uri=http://localhost:5173/callback&state=xyz123&scope=profile%20openid&bot_prompt=normal"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          使用 LINE 註冊／登入
        </a>
      </div>

      {/* 樓層顯示 */}
      <div className="w-full max-w-md border border-gray-700 bg-white shadow-xl">
        {initialFloors
          .sort((a, b) => b.floorNumber - a.floorNumber)
          .map((floor) => (
            <div
              key={floor.floorNumber}
              className="relative border-b border-black h-16 flex items-center justify-between px-4"
            >
              <div className="w-1/5 text-lg font-bold">{floor.floorNumber}F</div>
              <div className="w-2/5 text-lg">{floor.label}</div>

              {floor.floorNumber === currentUser.floor && (
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl">
                  {currentUser.avatar}
                </div>
              )}

              {floor.isPublicSpace && (
                <button
                  onClick={() => handleMove(floor.floorNumber)}
                  className="text-sm px-3 py-1 border rounded bg-white hover:bg-gray-100"
                >
                  Move to {floor.label}
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
