import React from "react";
import { User, Floor } from "../Types";

interface BuildingProps {
  floors: Floor[];
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
}

const Building: React.FC<BuildingProps> = ({ floors, currentUser, setCurrentUser }) => {
  const handleMove = (targetFloor: number) => {
    setCurrentUser((prev) => ({ ...prev, floor: targetFloor }));
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
 </>
  );
};

  

export default Building;
