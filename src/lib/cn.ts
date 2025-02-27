import clsx from "clsx";
import { twMerge } from "tailwind-merge";

import type { ClassValue } from "clsx";

export const cn = (...classLists: ClassValue[]) => twMerge(clsx(classLists));
