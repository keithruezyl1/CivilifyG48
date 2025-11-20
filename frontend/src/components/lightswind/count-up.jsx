import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "../lib/utils"; // Now imports from the new utils file

// Helper function to format the number
const formatValue = (val, precision, sep) => {
  return val.toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
};

// --- Type Definitions (Simplified for context) ---
// Note: In a real TypeScript project, you would define types explicitly.
// This is left as JavaScript syntax for the compilation environment.

const easingFunctions = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
};

const animationStyles = {
  default: { type: "tween" },
  bounce: { type: "spring", bounce: 0.25 },
  spring: { type: "spring", stiffness: 100, damping: 10 },
  gentle: { type: "spring", stiffness: 60, damping: 15 },
  energetic: { type: "spring", stiffness: 300, damping: 20 },
};

const colorSchemes = {
  default: "text-foreground",
  gradient:
    "bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600",
  primary: "text-primary",
  secondary: "text-secondary",
  custom: "", // use customColor
};

export function CountUp({
  value,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  easing = "easeOut",
  separator = ",",
  interactive = false,
  triggerOnView = true,
  className,
  numberClassName,
  animationStyle = "default",
  colorScheme = "default",
  customColor,
  onAnimationComplete,
}) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef(null);
  const count = useMotionValue(0);
  const rounded = useTransform(count, function (latest) {
    return formatValue(latest, decimals, separator);
  });

  const animationConfig = {
    ...(animationStyles[animationStyle] || animationStyles.default),
    ease: easingFunctions[easing] || easingFunctions.easeOut,
    duration: animationStyle === "default" ? duration : undefined,
  }; // Combined useEffect for mounting, triggerOnView, and initial animation

  useEffect(() => {
    const startAnimation = () => {
      animate(count.get(), value, {
        ...animationConfig,
        onUpdate: (latest) => count.set(latest),
        onComplete: () => {
          setHasAnimated(true);
          if (onAnimationComplete) onAnimationComplete();
        },
      });
    };

    if (!triggerOnView) {
      startAnimation();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          startAnimation();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    value,
    triggerOnView,
    hasAnimated,
    duration,
    easing,
    animationStyle,
    onAnimationComplete,
  ]); // useEffect for value changes after initial animation

  useEffect(
    function () {
      if (hasAnimated || !triggerOnView) {
        animate(count.get(), value, {
          ...animationConfig,
          onUpdate: function (latest) {
            return count.set(latest);
          },
          onComplete: onAnimationComplete,
        });
      }
    },
    [
      value,
      animationStyle,
      easing,
      duration,
      hasAnimated,
      triggerOnView,
      onAnimationComplete,
    ]
  );

  const colorClass =
    colorScheme === "custom" && customColor ? "" : colorSchemes[colorScheme];

  const getHoverAnimation = function () {
    if (!interactive) return {};
    return {
      whileHover: {
        scale: 1.05,
        filter: "brightness(1.1)",
        transition: { duration: 0.2 },
      },
      whileTap: {
        scale: 0.95,
        filter: "brightness(0.95)",
        transition: { duration: 0.1 },
      },
    };
  }; // Determine the color class for the inner spans // If colorScheme is 'gradient', we apply the gradient class to the motion.div // The nested spans must be 'text-transparent' if the parent motion.div has 'bg-clip-text text-transparent'
  const innerSpanColorClass =
    colorScheme === "gradient" ? "text-transparent" : colorClass; // If not gradient/custom, we apply the default color class to the whole group
  const containerColorClass = colorScheme === "gradient" ? "" : colorClass;

  return (
    <div
      ref={containerRef} // Use inline-block to allow proper text flow within a larger text block
      className={cn(
        "inline-block align-middle",
        containerColorClass, // Apply non-gradient color here
        className
      )}
    >
      <motion.div
        {...getHoverAnimation()}
        className={cn(
          "inline-flex items-center transition-all", // Apply gradient class here, if applicable. This handles the 'bg-clip-text'
          colorScheme === "gradient" ? colorClass : "",
          numberClassName
        )}
        style={
          colorScheme === "custom" && customColor
            ? { color: customColor }
            : undefined
        }
      >
        {prefix && (
          <span className={cn("mr-1", innerSpanColorClass)}>{prefix}</span>
        )}
        <motion.span className={cn(innerSpanColorClass)}>{rounded}</motion.span>
        {suffix && (
          <span className={cn("ml-1", innerSpanColorClass)}>{suffix}</span>
        )}
      </motion.div>
    </div>
  );
}
