import React, { useEffect, useState } from "react";
import { User, Floor } from "../Types";
import BuildingDecoration from "../Components/BuildingDecoration";

const defaultFloors: Floor[] = [
  { floorNumber: 6, label: "--", isPublicSpace: false },
  { floorNumber: 7, label: "--", isPublicSpace: false },
  { floorNumber: 8, label: "--", isPublicSpace: false },
  { floorNumber: 9, label: "--", isPublicSpace: false },
  { floorNumber: 10, label: "--", isPublicSpace: false },
  { floorNumber: 5, label: "Gym", isPublicSpace: true },
  { floorNumber: 4, label: "Cinema", isPublicSpace: true },
  { floorNumber: 3, label: "Cafe", isPublicSpace: true },
  { floorNumber: 2, label: "Library", isPublicSpace: true },
  { floorNumber: 1, label: "OUTSIDE", isPublicSpace: true },
];

const Home = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        floor: Number(parsed.floor),
      };
    }
    return null;
  });

  const [floors, setFloors] = useState<Floor[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetch("http://localhost:8080/api/floors")
        .then((res) => res.json())
        .then((userFloors: Floor[]) => {
          const floorMap = new Map<number, Floor>();
          defaultFloors.forEach((f) => floorMap.set(f.floorNumber, f));
          userFloors.forEach((uf) => {
            const existing = floorMap.get(uf.floorNumber);
            floorMap.set(uf.floorNumber, {
              ...uf,
              label: existing?.label || uf.label || `${uf.floorNumber}F`,
              isPublicSpace: existing?.isPublicSpace ?? false,
            });
          });
          const sorted = Array.from(floorMap.values()).sort((a, b) => b.floorNumber - a.floorNumber);
          setFloors(sorted);
          setHasLoaded(true); // ✅ 標記樓層已完成載入
        })
        .catch((err) => {
          console.error("樓層載入錯誤", err);
          setFloors(defaultFloors.sort((a, b) => b.floorNumber - a.floorNumber));
          setHasLoaded(true);
        });
    } else {
      setFloors(defaultFloors.sort((a, b) => b.floorNumber - a.floorNumber));
      setHasLoaded(true);
    }
  }, [currentUser]);

  const handleMove = (targetFloor: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, floor: targetFloor };
      setCurrentUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-10 px-4">
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

      <div className="w-full max-w-md border border-gray-700 bg-white shadow-xl">
        {hasLoaded &&
          floors.map((floor) => (
            <div
              key={floor.floorNumber}
              className="relative border-b border-black h-16 flex items-center justify-between px-4"
            >
              <div className="w-1/5 text-lg font-bold">{floor.floorNumber}F</div>

              <div className="flex-1 flex items-center justify-center space-x-2 text-lg">
                <span>{floor.label || `${floor.floorNumber}F`}</span>
                {currentUser &&
  Number(currentUser.floor) === Number(floor.floorNumber) &&
  currentUser.avatar && (
    <img
      src={currentUser.avatar}
      alt="使用者頭像"
      className="w-8 h-8 rounded-full border border-gray-300 shadow"
    />
)}

              </div>

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
