const actionBase =
  "flex h-12 w-full items-center justify-center rounded-full px-5 transition-colors md:w-[158px]";

export const homeStyles = {
  layout: {
    shell:
      "flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black",
    panel:
      "flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-6 py-24 dark:bg-black sm:px-16 sm:py-32 sm:items-start",
  },
  brand: {
    logo: "dark:invert",
  },
  copy: {
    group:
      "flex flex-col items-center gap-6 text-center sm:items-start sm:text-left",
    title:
      "max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50",
    body: "max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400",
    link: "font-medium text-zinc-950 dark:text-zinc-50",
  },
  actions: {
    group: "flex flex-col gap-4 text-base font-medium sm:flex-row",
    primary: `${actionBase} gap-2 bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]`,
    secondary: `${actionBase} border border-solid border-black/[.08] hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]`,
  },
} as const;
