export const Footer = () => {
  return (
    <>
      <footer className="mt-auto flex flex-col items-center justify-center gap-3 border-t border-white/8 p-5 text-center sm:flex-row sm:px-8 sm:py-5 sm:text-left">
        <div className="font-mono text-[11px] tracking-[0.06em] text-white/20">
          Built by
        </div>
        <a
          href="https://github.com/prajwal-17/"
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer items-center gap-1 text-sm font-medium text-white/50 transition-colors hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span className="text-accent hidden sm:inline">Prajwal-17</span>
        </a>
      </footer>
    </>
  );
};
