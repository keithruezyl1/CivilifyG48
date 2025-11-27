import React, { useRef, useEffect, useState } from "react";

// Mocking the 'cn' utility from 'clsx' or 'tailwind-merge' for class concatenation
// In a real project, this would be an import: import { cn } from "../lib/utils";
// Assuming a simplified mock for the example

import { cn } from "../lib/utils";

// --- Animation Definitions ---

// Defines the Tailwind classes for different animation types.
// NOTE: All presets include an opacity fade (opacity-0 to opacity-100)
// The primary animation (slide, zoom, etc.) is the secondary effect.
const ANIMATION_CLASSES = {
  // Simple Fade In
  "fade-in": {
    initial: "opacity-0",
    visible: "opacity-100",
  },
  // Fade In + Slide Up (The common default)
  "slide-up": {
    initial: "opacity-0 translate-y-10",
    visible: "opacity-100 translate-y-0",
  },
  // Fade In + Slide from Left
  "slide-left": {
    initial: "opacity-0 -translate-x-10",
    visible: "opacity-100 translate-x-0",
  },
  // Fade In + Slide from Right
  "slide-right": {
    initial: "opacity-0 translate-x-10",
    visible: "opacity-100 translate-x-0",
  },
  "slide-right-fast": {
    initial: "opacity-0 translate-x-10",
    visible: "opacity-100 translate-x-0",
  },
  // Fade In + Zoom In (Starts small)
  "zoom-in": {
    initial: "opacity-0 scale-95",
    visible: "opacity-100 scale-100",
  },
  // Slide Down (Starts high)
  "slide-down": {
    initial: "opacity-0 -translate-y-10",
    visible: "opacity-100 translate-y-0",
  },
};

// --- Props & Component Type ---

type AnimationType = keyof typeof ANIMATION_CLASSES;
type JustifyType = "start" | "center" | "end" | "between" | "around" | "evenly";
type AlignType = "start" | "center" | "end" | "stretch" | "baseline";
type DirectionType = "row" | "row-reverse" | "col" | "col-reverse";

export interface AnimateInViewProps {
  children: React.ReactNode;
  animationType?: AnimationType; // The new animation preset to use
  rootMargin?: string; // Margin around the viewport (e.g., '0px 0px -10% 0px')
  delay?: number; // Delay in milliseconds before the animation starts
  className?: string; // Optional class for the wrapper div or the child element (if asChild)
  contentJustify?: JustifyType; // Main axis alignment (justify-*)
  contentAlign?: AlignType; // Cross axis alignment (items-*)
  flexDirection?: DirectionType;
  /**
   * If true, the component will apply animation and ref directly to its single child element.
   * Layout props (flexDirection, contentJustify, contentAlign) are ignored in this mode.
   */
  asChild?: boolean;
  /**
   * If true, the component will not apply 'flex', 'flexDirection',
   * or content alignment props, allowing the parent container (e.g., a Grid)
   * to dictate the layout of this component directly.
   */
  passthroughLayout?: boolean;
}

// Map component prop values to Tailwind CSS classes for Flexbox control
const justifyClasses: Record<JustifyType, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const alignClasses: Record<AlignType, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const directionClasses: Record<DirectionType, string> = {
  row: "flex-row",
  "row-reverse": "flex-row-reverse",
  col: "flex-col",
  "col-reverse": "flex-col-reverse",
};

export const AnimateInView: React.FC<AnimateInViewProps> = ({
  children,
  animationType = "slide-up", // Default animation set to slide-up
  rootMargin = "0px 0px -15% 0px", // Trigger animation when 85% of element is visible
  delay = 0,
  className,
  contentJustify = "start",
  contentAlign = "stretch",
  flexDirection = "col",
  passthroughLayout = false,
  asChild = false, // New prop default to false
}) => {
  // Use a generic ref type that can be passed to either a DIV or a React Element
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Determine the animation style based on the selected type
  const { initial, visible } =
    ANIMATION_CLASSES[animationType] || ANIMATION_CLASSES["slide-up"];

  useEffect(() => {
    // We only observe if the element hasn't been visible yet
    if (isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add a check for visibility state to prevent redundant setting
          setIsVisible(true);
          // Stop observing once visible to prevent unnecessary checks
          observer.unobserve(entry.target);
        }
      },
      // Use threshold: 0.1 to trigger when 10% of the element is visible
      { rootMargin, threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Cleanup function
    return () => {
      if (ref.current) {
        // Need a try-catch because if a component unmounts quickly,
        // observer.unobserve might fail if it was never successfully observed.
        try {
          observer.unobserve(ref.current);
        } catch (e) {
          // Ignore error, observer might have been disconnected already
        }
      }
    };
  }, [rootMargin, isVisible]);

  // Base transition classes are always applied for smoothness
  const baseTransition =
    "transition-all duration-700 ease-out will-change-auto";

  // --- 1. Animation-Only Classes (Always computed) ---
  const animationOnlyClasses = cn(
    baseTransition,
    className, // User provided classes for the animating element
    !isVisible && initial, // Apply initial state when not visible
    isVisible && visible // Apply final/visible state when visible
  );

  // Style object for transition delay (Always computed)
  const inlineStyle = {
    transitionDelay: `${delay}ms`,
  };

  // --- 2. asChild Logic ---
  if (asChild) {
    // If we're rendering as a child, we must ensure the children is a single, valid React element
    const child = React.Children.only(children);

    if (React.isValidElement(child)) {
      // Merge existing className/style with the animation and transition properties
      const childProps = child.props;

      const mergedClassName = cn(
        childProps.className, // Existing class name on the child
        animationOnlyClasses // The computed animation classes
      );

      return React.cloneElement(child, {
        className: mergedClassName,
        style: {
          ...childProps.style, // Existing style on the child
          ...inlineStyle, // Animation delay style
        },
        // We must pass the ref to the cloned element so IntersectionObserver can work
        ref,
      });
    } else {
      console.error(
        "AnimateInView: When using 'asChild', exactly one valid React element must be provided as children."
      );
      // Fallback: If 'asChild' is true but children is invalid, return children unwrapped.
      return <>{children}</>;
    }
  }

  // --- 3. Wrapper Div Logic (Default) ---

  // Compute Layout Classes only for the wrapper div
  const wrapperLayoutClasses = cn(
    !passthroughLayout && "flex",
    !passthroughLayout && directionClasses[flexDirection],
    !passthroughLayout && justifyClasses[contentJustify],
    !passthroughLayout && alignClasses[contentAlign]
  );

  // Combine layout and animation classes for the wrapper div
  const fullWrapperClassName = cn(wrapperLayoutClasses, animationOnlyClasses);

  return (
    <div ref={ref} className={fullWrapperClassName} style={inlineStyle}>
      {children}
    </div>
  );
};

export default AnimateInView;
