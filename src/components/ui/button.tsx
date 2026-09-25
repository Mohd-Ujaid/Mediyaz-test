import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-[#285b63]/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#285b63] text-white hover:bg-[#204b52] active:bg-[#193c41] shadow-xs",
        accent: "bg-[#ff7468] hover:bg-[#ff5d50] text-white font-bold shadow-xs active:bg-[#e04f43]",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 font-semibold shadow-2xs",
        outline: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-2xs active:bg-slate-100",
        ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:bg-slate-200",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs",
        link: "text-[#285b63] underline-offset-4 hover:underline font-medium p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2 gap-2 text-xs",
        xs: "h-7 px-2.5 text-[11px] rounded-lg gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-sm rounded-xl gap-2",
        icon: "size-10 rounded-xl",
        "icon-xs": "size-6 rounded-lg",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
