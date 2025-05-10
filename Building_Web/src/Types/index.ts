// src/types/index.ts
export interface User {
    id: string;
    name: string;
    avatar: string;
    floor: number;
    currentFloor: number;
  }
  
  export interface Floor {
    floorNumber: number;
    label: string;
    isPublicSpace: boolean;
  }
  