import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import { Package, TrendUp } from "@phosphor-icons/react";
import HubItems from "./HubItems";
import paths from "@/utils/paths";

export default function CommunityHub() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[86px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white light:border-theme-sidebar-border border-b-2 border-opacity-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg leading-6 font-bold text-theme-text-primary">
                  Community Hub
                </p>
                <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
                  Share and collaborate with the Tredy community.
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={paths.communityHub.marketplace()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-button text-white rounded hover:bg-primary-button-hover transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Marketplace
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-6">
            <a
              href={paths.communityHub.marketplace()}
              className="flex items-center gap-2 px-3 py-2 hover:bg-theme-bg-primary rounded transition-colors text-theme-text-secondary"
            >
              <Package className="w-4 h-4" />
              Full Marketplace
            </a>
          </div>

          <HubItems />
        </div>
      </div>
    </div>
  );
}
