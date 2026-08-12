import { AppShell } from "@/components/workspace/app-shell";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  return <AppShell segments={segments} />;
}
