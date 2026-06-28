/**
 * Page chrome wrapper: a centered max-width column with a sticky header, a
 * scrolling content area (padded to clear the bottom nav) and an optional
 * fixed bottom navigation.
 */
export function AppShell({
  header,
  nav,
  children,
}: {
  header?: React.ReactNode;
  nav?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-max-width-content flex-col bg-background">
      {header}
      <main className="flex-1 px-margin-mobile pb-28 pt-4">{children}</main>
      {nav}
    </div>
  );
}
