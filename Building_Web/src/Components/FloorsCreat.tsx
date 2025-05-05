import { Floor } from "../Types";

export function generateInitialFloors(includeUserFloor = false): Floor[] {
  const specialFloors: { [key: number]: { label: string; isPublicSpace: boolean } } = {
    5: { label: "Gym", isPublicSpace: true },
    4: { label: "Cinema", isPublicSpace: true },
    3: { label: "Cafe", isPublicSpace: true },
    1: { label: "OUTSIDE", isPublicSpace: true },
  };

  const floors: Floor[] = Array.from({ length: 100 }, (_, i) => {
    const floorNumber = 100 - i;
    if (specialFloors[floorNumber]) {
      return {
        floorNumber,
        label: specialFloors[floorNumber].label,
        isPublicSpace: specialFloors[floorNumber].isPublicSpace,
      };
    }
    return {
      floorNumber,
      label: "未定",
      isPublicSpace: false,
    };
  });

  // ✅ 若傳入 true，就在最上方加上 101 樓（代表使用者專屬樓層）
  if (includeUserFloor) {
    floors.unshift({
      floorNumber: 101,
      label: "我的房間",
      isPublicSpace: false,
    });
  }

  return floors;
}
