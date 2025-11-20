import React from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/utils.js"; // Explicit .js extension
import { CountUp } from "./count-up.jsx"; // Explicit .jsx extension

interface TrustedUsersProps {
  avatars: string[];
  rating?: number;
  totalUsersText?: number;
  caption?: string;
  className?: string;
  starColorClass?: string;
  ringColors?: string[];
}

export const TrustedUsers: React.FC<TrustedUsersProps> = ({
  avatars,
  rating = 5,
  totalUsersText = 1000,
  caption = "Trusted by",
  className = "",
  starColorClass = "text-yellow-400",
  ringColors = [],
}) => {
  // Example avatar URLs (replace with your actual asset paths or external URLs)
  const defaultAvatars = [
    "https://placehold.co/40x40/000000/FFFFFF?text=A1",
    "https://placehold.co/40x40/3498db/FFFFFF?text=A2",
    "https://placehold.co/40x40/2ecc71/FFFFFF?text=A3",
    "https://placehold.co/40x40/e74c3c/FFFFFF?text=A4",
  ];
  const finalAvatars = avatars.length > 0 ? avatars : defaultAvatars;

  return (
    <div
      className={cn(
        `flex items-center justify-center gap-6 bg-transparent 
         text-gray-900 dark:text-gray-100 py-4 px-4`,
        className
      )}
    >
      {/* Avatar group */}
      <div className="flex items-center gap-4">
        <div className="flex -space-x-5 items-center">
          {finalAvatars.slice(0, 5).map((src, idx) => {
            const maxShown = 4; // show numeric "+X" at the 5th slot if more than 4
            const isOverflow =
              idx === maxShown && finalAvatars.length > maxShown;
            const ringClass = ringColors?.[idx] ?? "ring-white";

            if (isOverflow) {
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold text-gray-800 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 ring-2 shrink-0",
                    ringClass
                  )}
                >
                  +{finalAvatars.length - maxShown}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={cn(
                  "w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 ring-2 shrink-0",
                  ringClass
                )}
              >
                <img
                  src={src}
                  alt={`Avatar ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-start gap-1">
        <div className={`flex gap-1 ${starColorClass}`}>
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} fill="currentColor" className="w-4 h-4" />
          ))}
        </div>
        <span className="text-sm md:text-md font-medium inline-flex flex-col items-start space-x-1 text-white dark:text-gray-300 ">
          <span className="align-middle">
            &nbsp;
            {caption}&nbsp;
            <CountUp
              value={totalUsersText}
              decimals={0}
              separator=","
              animationStyle="gentle"
              colorScheme="secondary"
              className="text-base font-medium"
              numberClassName="font-extrabold ml-2"
              customColor="" // use a color string if the component expects one
              onAnimationComplete={() => {}}
            />
            +
          </span>
        </span>
      </div>
    </div>
  );
};
