import { SITE } from "@/siteConfig";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap justify-between gap-2 px-6 py-6 text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {SITE.name}
        </p>
        <p>Built by students at the University of Waterloo.</p>
      </div>
    </footer>
  );
}
