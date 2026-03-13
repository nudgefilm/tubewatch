import Link from "next/link";

export default function AppFooter(): JSX.Element {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-8 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="mailto:support@tubewatch.kr"
            className="hover:text-slate-700"
          >
            문의하기
          </a>
          <Link href="#" className="hover:text-slate-700">
            개인정보처리방침
          </Link>
          <Link href="#" className="hover:text-slate-700">
            이용약관
          </Link>
        </div>
        <span className="text-slate-400">© TubeWatch</span>
      </div>
    </footer>
  );
}
