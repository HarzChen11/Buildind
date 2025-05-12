import React, { useEffect, useState, useRef } from "react";
import { User, Floor } from "../Types";
import BuildingDecoration from "../Components/BuildingDecoration";
import { db } from "../Firebase/Firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const defaultFloors: Floor[] = [
  { floorNumber: 5, label: "Gym", isPublicSpace: true },
  { floorNumber: 4, label: "Cinema", isPublicSpace: true },
  { floorNumber: 3, label: "Cafe", isPublicSpace: true },
  { floorNumber: 2, label: "Library", isPublicSpace: true },
  { floorNumber: 1, label: "OUTSIDE", isPublicSpace: true },
];

const getFloorEmoji = (label: string) => {
  switch (label) {
    case "Gym": return "🏋️";
    case "Cinema": return "🎬";
    case "Cafe": return "☕";
    case "Library": return "📚";
    case "OUTSIDE": return "🌳";
    default: return "🏢";
  }
};

const Home = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      const floor = Number(parsed.floor);
      const currentFloor = parsed.currentFloor !== undefined ? Number(parsed.currentFloor) : floor;
      return { ...parsed, floor, currentFloor };
    }
    return null;
  });

  const [floors, setFloors] = useState<Floor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; avatar: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [activePopoverFloor, setActivePopoverFloor] = useState<number | null>(null);
  const currentFloorObj = floors.find(f => f.floorNumber === currentUser?.currentFloor);
  const popoverRef = useRef<HTMLDivElement | null>(null);

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
          setHasLoaded(true);
        })
        .catch((err) => {
          console.error("樓層載入錯誤", err);
          setFloors(defaultFloors.sort((a, b) => b.floorNumber - a.floorNumber));
          setHasLoaded(true);
        });

      fetch("http://localhost:8080/api/users")
        .then((res) => res.json())
        .then((onlineUsers: User[]) => {
          setUsers(onlineUsers);
        })
        .catch((err) => {
          console.error("使用者清單載入錯誤", err);
        });
    } else {
      setFloors(defaultFloors.sort((a, b) => b.floorNumber - a.floorNumber));
      setHasLoaded(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchUsers = () => {
      fetch("http://localhost:8080/api/users")
        .then((res) => res.json())
        .then((onlineUsers: User[]) => {
          setUsers(onlineUsers);
        })
        .catch((err) => {
          console.error("輪詢使用者清單失敗", err);
        });
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const ping = setInterval(() => {
      const sessionUser = sessionStorage.getItem("user");
      if (!sessionUser) return;
      const parsed = JSON.parse(sessionUser);
      if (parsed?.id) {
        fetch("http://localhost:8080/api/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsed.id }),
        });
      }
    }, 10000); // 每10秒回報
    return () => clearInterval(ping);
  }, []);

  useEffect(() => {
    if (!currentFloorObj?.label) return;
    const q = query(
      collection(db, "ChatRooms", currentFloorObj.label, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as { sender: string; avatar: string; text: string });
      setChatMessages(messages);
    });
    return () => unsubscribe();
  }, [currentFloorObj?.label]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopoverFloor(null);
      }
    };
    if (activePopoverFloor !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activePopoverFloor]);

  const handleMove = (targetFloor: number) => {
    if (!currentUser) return;
    fetch("http://localhost:8080/api/move-floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, floor: targetFloor }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("後端樓層更新失敗");
        const updatedUser = { ...currentUser, currentFloor: targetFloor };
        setCurrentUser(updatedUser);
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      })
      .catch((err) => {
        console.error("⚠️ 樓層更新錯誤：", err);
        alert("更新樓層失敗，請稍後再試！");
      });
  };

  return (
    <div className={`relative w-full flex flex-col items-center py-28 px-4 transition-all duration-300 ${isChatOpen && !isMinimized ? "pr-[500px]" : ""}`}>
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
              <div className="w-1/4 flex items-center gap-2">
                {floor.isPublicSpace && (
                  <button
                    onClick={() => setActivePopoverFloor(activePopoverFloor === floor.floorNumber ? null : floor.floorNumber)}
                    className="text-sm px-1 py-1 rounded border hover:bg-gray-100"
                  >
                    👥
                  </button>
                )}
                {!floor.isPublicSpace && floor.floorNumber >= 100 && (
                  <img
                    src={users.some((u) => u.floor === floor.floorNumber && u.isOnline) ? "/assets/light-on.svg" : "/assets/light-off.svg"}
                    alt="online status"
                    className="w-5 h-5"
                  />
                )}
                <span className="text-lg font-bold">{floor.floorNumber}F</span>
              </div>

              <div className="w-2/4 flex justify-center items-center gap-2 text-lg">
                <span>{floor.label || `${floor.floorNumber}F`}</span>
                {users
                  .filter((u) =>
                    u.currentFloor === floor.floorNumber &&
                    (!floor.isPublicSpace || u.id === currentUser?.id)
                  )
                  .map((u) => (
                    <img
                      key={u.id}
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-full border border-gray-300 shadow"
                    />
                  ))}
              </div>

              <div className="w-1/4 flex justify-end items-center gap-2">
                {floor.isPublicSpace && currentUser && (
                  <button
                    onClick={() => {
                      if (currentUser.currentFloor === floor.floorNumber) {
                        setIsChatOpen(true);
                      } else {
                        handleMove(floor.floorNumber);
                      }
                    }}
                    className="text-sm px-3 py-1 border rounded bg-white hover:bg-gray-100"
                  >
                    {currentUser.currentFloor === floor.floorNumber ? "Open ChatBox 💬" : "Move Here!"}
                  </button>
                )}

                {currentUser && floor.floorNumber === currentUser.floor && (
                  <button
                    onClick={() => handleMove(currentUser.floor)}
                    className="text-sm px-3 py-1 border rounded bg-yellow-100 hover:bg-yellow-200"
                  >
                    {currentUser.currentFloor === currentUser.floor ? "You're Home 🏠" : "Back to Home"}
                  </button>
                )}
              </div>

              {activePopoverFloor === floor.floorNumber && (
                <div
                  ref={popoverRef}
                  className="absolute left-[-180px] top-1/2 -translate-y-1/2 bg-white border shadow-lg p-2 rounded-lg z-50 w-40"
                >
                  <div className="text-sm font-semibold mb-2">目前在線：</div>
                  <div className="flex flex-wrap gap-2">
                    {users
                      .filter((u) => u.currentFloor === floor.floorNumber && u.isOnline)
                      .map((u) => (
                        <img
                          key={u.id}
                          src={u.avatar}
                          alt={u.name}
                          title={u.name}
                          className="w-8 h-8 rounded-full border"
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {isChatOpen && !isMinimized && (
        <div className="fixed right-4 top-20 w-[480px] h-[600px] bg-white border shadow-lg rounded-lg flex flex-col p-4 z-50">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">
              {getFloorEmoji(currentFloorObj?.label ?? "")} {currentFloorObj?.label} Chat Room
            </h2>
            <div className="space-x-2">
              <button onClick={() => setIsMinimized(true)} className="text-gray-500 hover:text-black">➖</button>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-black">❌</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 border p-2 rounded">
            {chatMessages.map((msg, idx) => {
              const isMine = msg.sender === currentUser?.name;
              return (
                <div key={idx} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[70%] flex items-start gap-2 ${isMine ? "" : "flex-row-reverse"}`}>
                    <img src={msg.avatar} alt={msg.sender} className="w-6 h-6 rounded-full" />
                    <div className={`text-sm px-3 py-2 rounded-lg shadow ${isMine ? "bg-gray-200 text-left" : "bg-blue-500 text-white text-right"}`}>
                      <div className="font-semibold">{msg.sender}</div>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex">
            <input
              type="text"
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              onClick={async () => {
                if (!chatInput.trim() || !currentUser || !currentFloorObj?.label) return;
                const newMessage = {
                  sender: currentUser.name,
                  avatar: currentUser.avatar,
                  text: chatInput.trim(),
                  timestamp: serverTimestamp(),
                };
                try {
                  await addDoc(collection(db, "ChatRooms", currentFloorObj.label, "messages"), newMessage);
                  setChatInput("");
                } catch (err) {
                  console.error("❌ 發送訊息失敗：", err);
                  alert("訊息發送失敗，請稍後再試！");
                }
              }}
              className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {isChatOpen && isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="fixed right-4 top-20 px-4 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full shadow-lg cursor-pointer z-50"
          title="Open Chat"
        >
          {getFloorEmoji(currentFloorObj?.label ?? "")} 💬
        </div>
      )}

      <BuildingDecoration />
    </div>
  );
};

export default Home;
