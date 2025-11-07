"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import {
  IconX,
  IconCircleCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ProgressBar = ({
  duration = 5000,
  variant = "default",
}: {
  duration?: number;
  variant?: string;
}) => {
  const getGradient = () => {
    switch (variant) {
      case "success":
        return "from-green-400 to-green-600";
      case "destructive":
        return "from-red-400 to-red-600";
      case "warning":
        return "from-amber-400 to-amber-600";
      case "info":
        return "from-blue-400 to-blue-600";
      default:
        return "from-blue-400 to-purple-600";
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30 overflow-hidden rounded-b-xl">
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={cn("h-full bg-gradient-to-r", getGradient())}
      />
    </div>
  );
};

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center gap-4 overflow-hidden rounded-xl border backdrop-blur-xl p-4 pr-8 shadow-2xl transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-gray-800/90 border-gray-700/50 text-white shadow-gray-900/50",
        destructive:
          "bg-red-500/20 border-red-500/50 text-red-100 shadow-red-500/30",
        success:
          "bg-green-500/20 border-green-500/50 text-green-100 shadow-green-500/30",
        warning:
          "bg-amber-500/20 border-amber-500/50 text-amber-100 shadow-amber-500/30",
        info: "bg-blue-500/20 border-blue-500/50 text-blue-100 shadow-blue-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  const getIcon = () => {
    switch (variant) {
      case "success":
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex-shrink-0"
          >
            <IconCircleCheck className="w-6 h-6 text-green-400" />
          </motion.div>
        );
      case "destructive":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <IconAlertCircle className="w-6 h-6 text-red-400" />
          </motion.div>
        );
      case "warning":
        return (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex-shrink-0"
          >
            <IconAlertTriangle className="w-6 h-6 text-amber-400" />
          </motion.div>
        );
      case "info":
        return (
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex-shrink-0"
          >
            <IconInfoCircle className="w-6 h-6 text-blue-400" />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        toastVariants({ variant }),
        "relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {getIcon()}
      <div className="flex-1">{props.children}</div>
      <ProgressBar duration={5000} variant={variant} />
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 text-sm font-medium backdrop-blur-sm transition-all hover:bg-gray-700/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50",
      "group-[.destructive]:border-red-500/30 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:text-red-200",
      "group-[.success]:border-green-500/30 group-[.success]:hover:bg-green-500/20 group-[.success]:text-green-200",
      "group-[.warning]:border-amber-500/30 group-[.warning]:hover:bg-amber-500/20 group-[.warning]:text-amber-200",
      "group-[.info]:border-blue-500/30 group-[.info]:hover:bg-blue-500/20 group-[.info]:text-blue-200",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-lg p-1 text-gray-400 opacity-70 transition-all hover:opacity-100 hover:bg-gray-700/50 hover:scale-110 hover:rotate-90 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-600",
      "group-[.destructive]:text-red-300 group-[.destructive]:hover:bg-red-500/20 group-[.destructive]:focus:ring-red-400",
      "group-[.success]:text-green-300 group-[.success]:hover:bg-green-500/20 group-[.success]:focus:ring-green-400",
      "group-[.warning]:text-amber-300 group-[.warning]:hover:bg-amber-500/20 group-[.warning]:focus:ring-amber-400",
      "group-[.info]:text-blue-300 group-[.info]:hover:bg-blue-500/20 group-[.info]:focus:ring-blue-400",
      className,
    )}
    toast-close=""
    {...props}
  >
    <IconX className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold leading-tight",
      "group-[.destructive]:text-red-100",
      "group-[.success]:text-green-100",
      "group-[.warning]:text-amber-100",
      "group-[.info]:text-blue-100",
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-sm opacity-90 leading-snug mt-1",
      "group-[.destructive]:text-red-200/90",
      "group-[.success]:text-green-200/90",
      "group-[.warning]:text-amber-200/90",
      "group-[.info]:text-blue-200/90",
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
