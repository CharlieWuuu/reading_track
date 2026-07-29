/** 側欄與底部導覽列共用的導覽項目 */

type IconProps = { active?: boolean };

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  exact?: boolean;
  Icon: (props: IconProps) => React.ReactElement;
}> = [
  {
    href: "/books",
    label: "書籍",
    exact: true,
    Icon: () => (
      <Icon>
        <path d="M4 3.5h7a2 2 0 0 1 2 2V17a2 2 0 0 0-2-2H4z" />
        <path d="M16 3.5h-1a2 2 0 0 0-2 2V17a2 2 0 0 1 2-2h1z" />
      </Icon>
    ),
  },
  {
    href: "/articles",
    label: "文章",
    exact: true,
    Icon: () => (
      <Icon>
        <path d="M5 2.5h6l4 4v11H5z" />
        <path d="M11 2.5v4h4M7.5 10h5M7.5 13h5" />
      </Icon>
    ),
  },
  {
    href: "/stats",
    label: "統計",
    Icon: () => (
      <Icon>
        <path d="M3 16.5h14" />
        <path d="M6 16.5v-5M10 16.5v-9M14 16.5v-3" />
      </Icon>
    ),
  },
  {
    href: "/calendar",
    label: "日曆",
    Icon: () => (
      <Icon>
        <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
        <path d="M3 8.5h14M7 3v3M13 3v3" />
      </Icon>
    ),
  },
  {
    href: "/settings",
    label: "設定",
    // 齒輪
    Icon: () => (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.7 7.7 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6 6 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6 6 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7 7 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.077-.124q.108-.066.22-.128c.331-.183.581-.495.644-.869z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];
