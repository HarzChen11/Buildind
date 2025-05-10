import React from "react";
import { User, Floor } from "../Types";

interface BuildingProps {
  floors: Floor[];
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
}

const Building: React.FC<BuildingProps> = ({ floors, currentUser, setCurrentUser }) => {
  const handleMove = (targetFloor: number) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, floor: targetFloor };
      sessionStorage.setItem("user", JSON.stringify(updated));

      // 同步後端樓層
      fetch("http://localhost:8080/api/move-floor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: updated.id,
          floor: targetFloor,
        }),
      }).catch((err) => {
        console.error("更新樓層失敗：", err);
      });

      return updated;
    });
  };

  return (
    <>
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

              {/* 顯示自己的頭像 */}
              {floor.floorNumber === currentUser.floor && currentUser.avatar && (
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <img
                    src={currentUser.avatar}
                    alt="你"
                    className="w-8 h-8 rounded-full border border-gray-300 shadow"
                  />
                </div>
              )}

              {floor.isPublicSpace && (
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
    </>
  );
};

export default Building;
