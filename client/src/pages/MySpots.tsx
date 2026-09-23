import {APP_NAME, RELEASE} from "@/lib/release";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Link } from "@/components/Link";
import { toast } from "sonner";

type EditDraft = {
  id: number;
  name: string;
  area: string;
  category: string;
  note: string;
};

export default function MySpots() {
  const { isAuthenticated, loading, logout } = useAuth();
  const mineQuery = trpc.spots.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const updateMutation = trpc.spots.update.useMutation({
    onSuccess: async () => {
      toast.success("内容を更新しました。");
      setEditing(null);
      await Promise.all([utils.spots.mine.invalidate(), utils.spots.list.invalidate()]);
    },
    onError: () => toast.error("更新できませんでした。"),
  });

  const deleteMutation = trpc.spots.delete.useMutation({
    onSuccess: async () => {
      toast.success("スポットを削除しました。");
      setDeletingId(null);
      await Promise.all([utils.spots.mine.invalidate(), utils.spots.list.invalidate()]);
    },
    onError: () => toast.error("削除できませんでした。"),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  const spots = isAuthenticated ? (mineQuery.data ?? []) : [];

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editing) { try { await updateMutation.mutateAsync(editing); } catch { /* surfaced via onError */ } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {APP_NAME}<span className="block text-[10px] tracking-widest font-sans text-muted-foreground">{RELEASE}</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              地図帳
            </Link>
            <span className="text-foreground">マイスポット</span>
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                ログアウト
              </Button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#c45336]">Your atlas</p>
        <h1 className="mt-2 text-4xl leading-[1.2]">自分が残した場所</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          後からメモを直したり、もう公開したくない場所を消したりできます。編集と削除は、自分が登録したスポットにだけ出ます。
        </p>

        {mineQuery.isError ? <p role="alert" className="mt-6">読み込めませんでした。<button onClick={() => void mineQuery.refetch()}>再試行</button></p> : null}
        {!loading && !isAuthenticated ? <div className="mt-8 border border-border p-6"><p>Googleでログインすると、自分のスポットを確認できます。</p><Button onClick={() => startLogin()}>Googleでログイン</Button></div> : null}
        {isAuthenticated && (mineQuery.isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">読み込み中…</p>
        ) : spots.length === 0 ? (
          <div className="mt-10 border border-border bg-card p-8">
            <p className="text-muted-foreground">まだスポットを登録していません。</p>
            <Button asChild className="mt-4 rounded-none">
              <Link href="/">地図帳をひらく</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-10 divide-y divide-border border border-border bg-card">
            {spots.map((spot) => (
              <li
                key={spot.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <h2 className="text-2xl">{spot.name}</h2>
                  <p className="text-xs text-muted-foreground">{spot.area}</p>
                  <p className="mt-1 text-[11px] tracking-wide text-[#c45336]">{spot.category}</p>
                  <p className="mt-2 text-sm leading-6">{spot.note}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none bg-transparent"
                    onClick={() =>
                      setEditing({
                        id: spot.id,
                        name: spot.name,
                        area: spot.area,
                        category: spot.category,
                        note: spot.note,
                      })
                    }
                  >
                    編集
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none bg-transparent text-[#c45336]"
                    onClick={() => setDeletingId(spot.id)}
                  >
                    削除
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      </main>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="rounded-none border-border bg-card">
          <DialogHeader>
            <DialogTitle>スポットを編集</DialogTitle>
            <DialogDescription>名前、エリア、カテゴリー、ひとことを直せます。</DialogDescription>
          </DialogHeader>
          {editing ? (
            <form className="grid gap-3" onSubmit={saveEdit}>
              <div>
                <Label htmlFor="edit-name">スポット名</Label>
                <Input
                  id="edit-name"
                  maxLength={200}
                  required
                  className="rounded-none"
                  value={editing.name}
                  onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-area">エリア</Label>
                <Input
                  id="edit-area"
                  maxLength={200}
                  required
                  className="rounded-none"
                  value={editing.area}
                  onChange={(event) => setEditing({ ...editing, area: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-cat">カテゴリー</Label>
                <Input
                  id="edit-cat"
                  maxLength={100}
                  required
                  className="rounded-none"
                  value={editing.category}
                  onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-note">ひとこと</Label>
                <Textarea
                  id="edit-note"
                  maxLength={2000}
                  required
                  className="rounded-none"
                  value={editing.note}
                  onChange={(event) => setEditing({ ...editing, note: event.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none bg-transparent"
                  onClick={() => setEditing(null)}
                >
                  閉じる
                </Button>
                <Button type="submit" className="rounded-none" disabled={updateMutation.isPending}>
                  保存する
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="rounded-none border-border bg-card">
          <DialogHeader>
            <DialogTitle>このスポットを削除しますか？</DialogTitle>
            <DialogDescription>公開一覧からも消えます。この操作は取り消せません。</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-none bg-transparent"
              onClick={() => setDeletingId(null)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              className="rounded-none bg-[#c45336] text-white hover:bg-[#a9442d]"
              disabled={deleteMutation.isPending || deletingId === null}
              onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
            >
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
