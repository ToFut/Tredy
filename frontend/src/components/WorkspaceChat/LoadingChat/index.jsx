import { isMobile } from "react-device-detect";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function LoadingChat() {
  const highlightColor = "var(--theme-bg-primary)";
  const baseColor = "var(--theme-bg-secondary)";
  return (
    <div className="transition-all duration-500 bg-theme-bg-secondary w-full h-full overflow-y-scroll no-scroll">
      {/* User Message Skeleton */}
      <div className="flex justify-center w-full bg-theme-bg-chat">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex gap-x-4 md:gap-x-6">
            <Skeleton.default
              height={32}
              width={32}
              highlightColor={highlightColor}
              baseColor={baseColor}
              circle
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <Skeleton.default
                height={20}
                width="60%"
                highlightColor={highlightColor}
                baseColor={baseColor}
                count={1}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Message Skeleton */}
      <div className="flex justify-center w-full bg-theme-bg-secondary border-b border-white/5">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex gap-x-4 md:gap-x-6">
            <Skeleton.default
              height={32}
              width={32}
              highlightColor={highlightColor}
              baseColor={baseColor}
              circle
              className="flex-shrink-0"
            />
            <div className="flex-1 space-y-3">
              <Skeleton.default
                height={20}
                width="80%"
                highlightColor={highlightColor}
                baseColor={baseColor}
              />
              <Skeleton.default
                height={20}
                width="75%"
                highlightColor={highlightColor}
                baseColor={baseColor}
              />
              <Skeleton.default
                height={20}
                width="60%"
                highlightColor={highlightColor}
                baseColor={baseColor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Message Skeleton */}
      <div className="flex justify-center w-full bg-theme-bg-chat">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex gap-x-4 md:gap-x-6">
            <Skeleton.default
              height={32}
              width={32}
              highlightColor={highlightColor}
              baseColor={baseColor}
              circle
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <Skeleton.default
                height={20}
                width="40%"
                highlightColor={highlightColor}
                baseColor={baseColor}
                count={1}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Message with thinking indicator */}
      <div className="flex justify-center w-full bg-theme-bg-secondary border-b border-white/5">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex gap-x-4 md:gap-x-6">
            <Skeleton.default
              height={32}
              width={32}
              highlightColor={highlightColor}
              baseColor={baseColor}
              circle
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-theme-text-secondary rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-theme-text-secondary rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-theme-text-secondary rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
