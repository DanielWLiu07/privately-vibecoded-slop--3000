export interface PageHeaderProps {
  title: string;
  lede?: string;
}

export default function PageHeader({ title, lede }: PageHeaderProps) {
  return (
    <header>
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      {lede && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{lede}</p>
      )}
    </header>
  );
}
