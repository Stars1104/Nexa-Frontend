import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={1}
      className={cn("p-6 bg-gradient-to-br bg-[#171717] border border-slate-700/50 rounded-2xl shadow-2xl backdrop-blur-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-2 relative items-center pb-6 border-b border-slate-600/30",
        caption_label: "text-xl font-bold text-white tracking-wide",
        nav: "absolute left-0 right-0 flex justify-between items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-slate-800/80 border-slate-600/50 rounded-lg p-0 opacity-90 hover:opacity-100 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200 hover:scale-110 shadow-lg"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse space-y-3",
        head_cell:
          "text-slate-400 rounded-xl font-semibold text-sm text-center flex items-center justify-center uppercase tracking-wider justify-self-center",
        row: "grid grid-cols-7 w-full",
        cell: "text-center text-sm p-0 relative flex items-center justify-center justify-self-center [&:has([aria-selected].day-range-end)]:rounded-r-xl [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl focus-within:relative focus-within:z-20",
        day: cn(
          "h-10 w-10 p-0 font-medium text-slate-300 text-center hover:bg-slate-700/60 hover:text-white rounded-xl transition-all duration-200 hover:scale-110 focus:bg-slate-700/60 focus:text-white shadow-sm"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:from-blue-600 focus:to-blue-700 rounded-xl shadow-lg transition-all duration-200 font-semibold",
        day_today: "bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl border-2 border-blue-400/60 shadow-lg font-semibold",
        day_outside:
          "day-outside text-slate-500 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-slate-500 opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-blue-600/20 aria-selected:text-blue-300",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };