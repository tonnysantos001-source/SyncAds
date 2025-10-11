import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this to your `src/lib/utils.ts` or a new file
declare module "react" {
    // Forward-Ref-With-As-Child-Type-Fix
    // https://github.com/radix-ui/themes/issues/155#issuecomment-1685361676
    function forwardRef<T, P = {}>(
      render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
    ): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}
