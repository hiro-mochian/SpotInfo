# Spot ソース

> GitHub取り込み時の注記（2026-09-23）: 以下は提供資料の記録です。埋め込みの地図プロキシキーは除去し、`VITE_MAPS_PROXY_KEY` への参照に変更しました。依存ファイルやビルド構成が不足しており、このディレクトリ単独では起動できません。

この `source/` は、公開面 [https://spotatlas-jettiem7.manus.space/](https://spotatlas-jettiem7.manus.space/) の 2026-09-22 バンドル（`/assets/index-D5TQFnpJ.js`、`data-loc`、公開 `spots.list`）から復元したアプリケーションソースです。プロジェクト規則どおり、ドキュメント一式にソースを含めます。

現行セッションには WebDev プロジェクトが接続されていないため、git checkpoint そのものは取得できません。フレームワーク側（`server/_core`、shadcn/ui、OAuth ブリッジ）はテンプレート標準のままなのでここには重複させていません。製品の差分は次のファイルです。

| パス | 役割 |
| --- | --- |
| `client/index.html` | `lang="ja"`、タイトル Spot、Shippori Mincho / IBM Plex Sans JP |
| `client/src/App.tsx` | `/`、`/my`、`/404` |
| `client/src/index.css` | 紙・インク・コーラルのトークン |
| `client/src/pages/Home.tsx` | アトラス UI、日英コピー、正直な件数、地図の外 |
| `client/src/pages/MySpots.tsx` | 所有者の編集 / 削除 |
| `client/src/components/Map.tsx` | Street View / 地図種別 / 全画面オフ |
| `drizzle/schema.ts` | `spots.ownerUserId` を含む公開スキーマ |
| `server/db.ts` | 公開一覧と所有者スコープの更新・削除 |
| `server/routers.ts` | `spots.list/create/mine/update/delete` |

作成は `ownerUserId: ctx.user?.id ?? null` です。ゲストの登録は公開されますが `/my` には出ません。地図の Maps プロキシキーは公開バンドルに含まれるフロント用キーです。checkpoint 識別子は未記録です。元の WebDev タスクから git が取れるときは、この復元ソースを checkpoint の実体で置き換えてください。
