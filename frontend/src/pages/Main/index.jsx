import React from "react";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { FullScreenLoader } from "@/components/Preloader";
import Home from "./Home";
import { isMobile } from "react-device-detect";
import Sidebar, { SidebarMobileHeader } from "@/components/Sidebar";
import MobileSidebarWrapper from "@/components/Sidebar/MobileSidebar";

export default function Main() {
  const { loading, requiresAuth, mode } = usePasswordModal();

  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false)
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;

  // Check for mobile or if screen width is small
  const isMobileView = isMobile || window.innerWidth < 768;

  if (isMobileView) {
    return (
      <MobileSidebarWrapper>
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex flex-col">
          <Home />
        </div>
      </MobileSidebarWrapper>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <Home />
    </div>
  );
}
