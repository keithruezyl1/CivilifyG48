import React, { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { AnimateInView } from "./animate-in-view";

export interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hoverEffect?: boolean;
}

export interface GlowingCardsProps {
  children: React.ReactNode;
  className?: string;
  /** Enable the glowing overlay effect */
  enableGlow?: boolean;
  /** Size of the glow effect radius */
  glowRadius?: number;
  /** Opacity of the glow effect */
  glowOpacity?: number;
  /** Animation duration for glow transitions */
  animationDuration?: number;
  /** Enable hover effects on individual cards */
  enableHover?: boolean;
  /** Gap between cards */
  gap?: string;
  /** Maximum width of cards container */
  maxWidth?: string;
  /** Padding around the container */
  padding?: string;
  /** Background color for the container */
  backgroundColor?: string;
  /** Border radius for cards */
  borderRadius?: string;
  /** Enable responsive layout */
  responsive?: boolean;
  /** Custom CSS variables for theming */
  customTheme?: {
    cardBg?: string;
    cardBorder?: string;
    textColor?: string;
    hoverBg?: string;
  };
}

export const GlowingCard: React.FC<GlowingCardProps> = ({
  children,
  className,
  glowColor = "#3b82f6",
  hoverEffect = true,
  ...props
}) => {
  return (
    // NOTE: flex-1 min-w-[14rem] removed and applied to the AnimateInView wrapper
    <div
      className={cn(
        "relative w-full h-full p-6 rounded-2xl text-black dark:text-white",
        "bg-background border",
        "flex flex-col items-center justify-center",
        "transition-all duration-400 ease-out transform",
        className
      )}
      style={
        {
          "--glow-color": glowColor,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
};

export const GlowingCards: React.FC<GlowingCardsProps> = ({
  children,
  className,
  enableGlow = true,
  glowRadius = 25,
  glowOpacity = 1,
  animationDuration = 400,
  enableHover = true,
  gap = "2.5rem",
  maxWidth = "75rem",
  padding = "3rem 1.5rem",
  backgroundColor,
  borderRadius = "1rem",
  responsive = true,
  customTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showOverlay, setShowOverlay] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;

    if (!container || !overlay || !enableGlow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePosition({ x, y });
      setShowOverlay(true);

      overlay.style.setProperty("--x", x + "px");
      overlay.style.setProperty("--y", y + "px");
      overlay.style.setProperty("--opacity", glowOpacity.toString());
    };

    const handleMouseLeave = () => {
      setShowOverlay(false);
      overlay.style.setProperty("--opacity", "0");
      setHoveredCardIndex(null);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enableGlow, glowOpacity]);

  const containerStyle = {
    "--gap": gap,
    "--max-width": maxWidth,
    "--padding": padding,
    "--border-radius": borderRadius,
    "--animation-duration": animationDuration + "ms",
    "--glow-radius": glowRadius + "rem",
    "--glow-opacity": glowOpacity,
    backgroundColor: backgroundColor || undefined,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius,
    ...customTheme,
  } as React.CSSProperties;

  // Define the staggered delay increment (200ms is a good visible cascade speed)
  const delayIncrement = 200;

  return (
    <>
      <div className={cn("relative w-full", className)} style={containerStyle}>
        <div
          ref={containerRef}
          className={cn(
            "relative max-w-[var(--max-width)] mx-auto",
            "px-6 py-2"
          )}
          style={{ padding: "var(--padding)" }}
        >
          {/* Card Container - Removed outer AnimateInView */}
          <div
            className={cn(
              "flex items-center justify-center flex-wrap gap-[var(--gap)]",
              responsive && "flex-col sm:flex-row"
            )}
          >
            {React.Children.map(children, (child, index) => {
              if (React.isValidElement(child) && child.type === GlowingCard) {
                return (
                  // Wrap each card in AnimateInView for staggered entry
                  <AnimateInView
                    key={index}
                    animationType="slide-up"
                    delay={index * delayIncrement} // Apply the staggered delay
                    // The AnimateInView wrapper must inherit the layout properties to behave correctly in the flex-wrap
                    className="flex-1 min-w-[14rem] w-full"
                  >
                    {React.cloneElement(child as React.ReactElement<any>, {
                      // Pass mouse handlers for glow effect
                      onMouseEnter: () =>
                        enableHover && setHoveredCardIndex(index),
                      onMouseLeave: () =>
                        enableHover && setHoveredCardIndex(null),
                    })}
                  </AnimateInView>
                );
              }
              return child;
            })}
          </div>

          {/* Glowing Overlay (Moved outside the AnimateInView wrapper) */}
          {enableGlow && (
            <div
              ref={overlayRef}
              className={cn(
                "absolute inset-0 pointer-events-none select-none",
                "opacity-0 transition-all duration-[var(--animation-duration)] ease-out"
              )}
              style={{
                WebkitMask:
                  "radial-gradient(var(--glow-radius) var(--glow-radius) at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)",
                mask: "radial-gradient(var(--glow-radius) var(--glow-radius) at var(--x, 0) var(--y, 0), #000 1%, transparent 50%)",
                opacity: showOverlay ? "var(--opacity)" : "0",
              }}
            >
              {/* This masked area contains the overlay duplicates of the cards */}
              <div
                className={cn(
                  "flex items-center justify-center flex-wrap gap-[var(--gap)] max-w-[var(--max-width)] mx-auto",
                  responsive && "flex-col sm:flex-row"
                )}
                style={{ padding: "var(--padding)" }}
              >
                {React.Children.map(children, (child, index) => {
                  if (
                    React.isValidElement(child) &&
                    child.type === GlowingCard
                  ) {
                    const cardGlowColor = child.props.glowColor || "#3b82f6";
                    return (
                      <AnimateInView
                        key={`overlay-${index}`}
                        animationType="slide-up"
                        delay={index * delayIncrement} // No delay on the overlay card
                        className="flex-1 min-w-[14rem] w-full"
                      >
                        {React.cloneElement(child as React.ReactElement<any>, {
                          className: cn(
                            child.props.className,
                            "bg-opacity-15 dark:bg-opacity-15",
                            "border-opacity-100 dark:border-opacity-100",
                            // Added: Apply scale transform to overlay card when hovered
                            enableHover && hoveredCardIndex === index,
                            // Added: Ensure transform is included in transition
                            "transition-all duration-[var(--animation-duration)] ease-out transform"
                          ),
                          style: {
                            ...child.props.style,
                            backgroundColor: cardGlowColor + "15",
                            borderColor: cardGlowColor,
                            boxShadow: "0 0 0 1px inset " + cardGlowColor,
                          },
                        })}
                      </AnimateInView>
                    );
                  }
                  return child;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
