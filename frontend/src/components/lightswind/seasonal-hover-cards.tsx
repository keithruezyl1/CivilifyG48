import React from "react";
import { cn } from "../lib/utils";
import AnimateInView from "./animate-in-view";

/* -------------------------------------------------
   Helper – random pastel colour (light background)
   ------------------------------------------------- */
function getRandomPastelColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 50 + Math.floor(Math.random() * 31); // 50-80
  const l = 80 + Math.floor(Math.random() * 13); // 80-92
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/* -------------------------------------------------
   Props
   ------------------------------------------------- */
export interface SeasonCardProps {
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  className?: string;
  isDarkMode?: boolean;
}

interface SeasonalHoverCardsProps {
  cards: SeasonCardProps[];
  className?: string;
}

/* -------------------------------------------------
   Single card
   ------------------------------------------------- */
const SeasonCard = ({
  title,
  subtitle,
  description,
  imageSrc,
  imageAlt,
  className,
  isDarkMode,
}: SeasonCardProps) => {
  const pastelBg = React.useMemo(() => getRandomPastelColor(), []);

  return (
    <>
      <div
        className={cn(
          // Base: full width on mobile, equal flex on md+
          "group relative flex flex-col justify-stretch w-full md:flex-1",
          // Hover: this card takes 2/3, others take 1/3 of remaining
          "md:hover:flex-[0_0_50%] md:hover:max-w-[50%]",
          // Smooth transition
          "transition-all duration-500 ease-in-out",
          // Height
          // "h-[350px] lg:h-[450px]",
          "h-auto lg:h-[450px]",
          // Styling
          "bg-black rounded-xl overflow-hidden shadow-lg",
          className
        )}
        style={{
          backgroundColor: isDarkMode ? "#000000" : pastelBg,
        }}
      >
        <img
          src={imageSrc}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
          alt={imageAlt || title}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            height: "100%",
            padding: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                color: "#ffffff",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                fontWeight: 500,
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d1d5db",
                padding: "0.75rem 0",
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            className={cn(
              // Default state (sm, md screens): fully visible
              // "opacity-100 max-h-32", // Large screens (1024px) and up: hide by default
              "opacity-100 max-h-full",
              "lg:opacity-0 lg:max-h-0", // Large screens on hover: show
              "lg:group-hover:opacity-100 lg:group-hover:max-h-32",
              "transition-all duration-500 ease-in-out overflow-hidden"
            )}
          >
            <p
              style={{
                fontSize: "1rem",
                color: "#f3f4f6",
                lineHeight: 1.625,
                paddingTop: "0.25rem",
              }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------
   Container component
   ------------------------------------------------- */
export default function SeasonalHoverCards({
  cards,
  className,
}: SeasonalHoverCardsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap md:flex-nowrap gap-6 w-full px-4 sm:px-8 md:px-12 lg:px-20 py-10",
        className
      )}
    >
      {cards.map((card, index) => (
        <SeasonCard
          key={index}
          {...card}
          // isDarkMode={true} // toggle globally if needed
        />
      ))}
    </div>
  );
}
