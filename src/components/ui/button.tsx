import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg hover:bg-fg",
        secondary:
          "bg-raised text-fg border border-border hover:border-muted hover:bg-surface",
        ghost: "text-muted hover:text-fg hover:bg-raised",
        danger: "bg-danger/20 text-fg border border-danger/40 hover:bg-danger/30",
      },
      size: {
        default: "h-11 px-4 text-sm rounded-md",
        sm: "h-9 px-3 text-sm rounded-sm",
        lg: "h-12 px-5 text-base rounded-md",
        icon: "size-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
