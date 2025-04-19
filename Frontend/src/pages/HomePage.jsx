import React from "react";
import Sidebar from "../components/Sidebar";
import MainContent from "../components/MainContent";
import TopBar from "../components/TopBar";
import StatusBar from "../components/StatusBar"; // ✅ Added StatusBar

function HomePage() {
  return (
    <div className="bg-base-100 min-h-screen w-full overflow-y-hidden">
      <div className="flex h-screen w-full">
        {/* <Sidebar /> */}
        <div className="flex-1 flex flex-col">
          <TopBar />
          <MainContent />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
