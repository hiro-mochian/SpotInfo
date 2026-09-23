# Spot

著者: **Manus AI**  
記録日: 2026-09-22  
公開アプリ: [https://spotatlas-jettiem7.manus.space/](https://spotatlas-jettiem7.manus.space/)  
地図帳アンカー: [https://spotatlas-jettiem7.manus.space/#atlas](https://spotatlas-jettiem7.manus.space/#atlas)

Spot は、身近な「ここ、いいよ」を地図に残すための静かな公開アトラスです。誰でも場所を見つけ、誰でもメモを残せます。編集と削除だけが、ログインした本人の登録分に限られます。ブランド文字列は HTML の `title`、`lang="ja"`、見出し、フッター、日英コピーのすべてで **Spot** に揃えてあり、`Spot_info` と `Spot info` の分裂はありません。

この ZIP は、プロジェクト規則どおり改定後に渡せる状態にした **ドキュメント一式** です。公開 URI、使い方、変更の経緯、設計の Preserved / Overhaul、公開データのスナップショット、画面キャプチャをまとめています。このセッションには WebDev プロジェクトが接続されていないため、アプリケーションのソースツリーと checkpoint 識別子はここに含めていません。ソースが必要な場合は、公開ホスト `spotatlas-jettiem7` を持つ元の WebDev タスク側で checkpoint を保存してから別途エクスポートしてください。

## 公開で確認した四つの所在

| 種別 | 値 | 状態 |
| --- | --- | --- |
| アプリ公開 URI | https://spotatlas-jettiem7.manus.space/ | 確認済み。HTTP 200、`lang="ja"`、タイトル `Spot` |
| 地図帳 | https://spotatlas-jettiem7.manus.space/#atlas | 確認済み。地図がキャンバス、一覧は東京優先 |
| Google サイト公開 URL | （未記録） | このセッションでは埋め込み先を確認していない |
| Google サイト編集 URL | （未記録） | 同上 |
| Checkpoint | （未記録） | 現行セッションに WebDev プロジェクトが無い |

一時プレビュー（`*.manus.computer`）は公開 URI ではありません。以降の案内・埋め込み・共有は必ず `https://spotatlas-jettiem7.manus.space/` を使います。[1]

## いま公開されている事実

2026-09-22 09:37–09:42 UTC に、ブラウザ User-Agent 付きで公開 HTML と `spots.list` を取得し、サンドボックスブラウザで画面を確認しました。信頼数字は広告用の「AK+ / FREE」ではなく、実件数です。

> 公開 3件 · 誰でも残せる

東京ビューに載るのは上野公園と錦糸公園です。フォード博物館は一覧に残しますが、先頭には出さず **地図の外** とラベルします。ゲスト投稿の `ownerUserId` は `null` です。`/my` には出ません。

| id | 名前 | エリア | カテゴリー | ひとこと | 緯度 | 経度 | ownerUserId |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 上野公園 | 東京 台東区 | 公園 | 都会の中の自然界隈 | 35.7148 | 139.7713 | null |
| 2 | 錦糸公園 | 東京都 墨田区 | 公園 | 駅に近く、子どもが遊んでいて、休日はフリマも多い | 35.6964 | 139.8153 | null |
| 3 | フォード博物館 | US ミシガン州 | 博物館 | 素敵な博物館 | 42.3031 | -83.2342 | null |

地図の初期中心は東京駅付近（緯度 35.6812、経度 139.7671、ズーム 11）です。範囲判定は概ね緯度 35.5–35.9、経度 139.4–140 で、この内側だけをヒーローの紙面カードと「範囲内」件数に使っています。

## この一式の中身

| ファイル | 役割 |
| --- | --- |
| [README.md](README.md) | 公開所在、いまの事実、一式の案内 |
| [利用ガイド.md](利用ガイド.md) | 見つける / 残す / つなぐ の操作 |
| [変更履歴.md](変更履歴.md) | 改定で残したものと切ったもの |
| [設計監査.md](設計監査.md) | Design Read、五軸、Preserve / Overhaul |
| [公開URL.md](公開URL.md) | 四つの URL の記入欄と未記録項目 |
| [data/spots.list.json](data/spots.list.json) | 公開 `spots.list` の生レスポンス |
| [screenshots/01_hero.png](screenshots/01_hero.png) | ヒーローと正直な件数 |
| [screenshots/02_atlas.png](screenshots/02_atlas.png) | 地図キャンバスと「地図の外」 |
| [screenshots/03_home.png](screenshots/03_home.png) | 地図帳を開いた状態 |
| [ソースについて.md](ソースについて.md) | ソースの由来（公開バンドルからの復元） |
| [source/](../source/) | 製品差分のソース（Home / MySpots / Map / schema / routers） |

ソースは公開 JS の `data-loc` と API 契約から復元しています。git checkpoint そのものではありません。元の WebDev タスクから checkpoint が取れたら `source/` を差し替え、`公開URL.md` へ識別子を書いてください。改定で機能を落とす場合は、実装前に確認し、改定後はソースとこのドキュメントを再び ZIP にできる状態へ戻します。[1]

## 技術の輪郭（公開バンドルから復元）

実装は Manus WebDev の fullstack（web-db-user）です。クライアントは React、ルーティングは wouter、API は `/api/trpc` です。公開バンドルの `data-loc` から、主要なファイルは次のとおりです。

| 関心事 | 公開実装で確認した場所 |
| --- | --- |
| アトラス UI | `client/src/pages/Home.tsx` |
| 所有者一覧 | `client/src/pages/MySpots.tsx`（ルート `/my`） |
| 地図クロム | `client/src/components/Map.tsx` |
| 認証 | Manus OAuth。アプリ ID `jETTiem7pU4zrsq84LuXKY`。`/my` 未ログインはサインインへ送る |
| 公開 RPC | `spots.list` |
| 作成 | `spots.create`（ゲスト可。所有者 ID はサーバが付与） |
| 自分の分 | `spots.mine` / `spots.update` / `spots.delete`（保護） |
| 認証補助 | `auth.me` / `auth.logout` |

地図コントロールは Street View、地図種別、全画面をオフにしています。ズームだけ残しています。ピン色はコーラル `#de6848`、紙面は `#f3eee4` 系、本文インクは暗い紺、見出しは Shippori Mincho、本文は IBM Plex Sans JP です。[2] [3]

## 次に足すべき記録

Google サイトへページ全体埋め込みをしたら、公開 URL と編集 URL を `公開URL.md` と本 README の表へ書き込みます。埋め込みはプレビュー（静的カード）ではなく **ページ全体** です。見出しを直したあとは Google サイト側でも再公開しないと、公開面に「ページのタイトル」が残ります。[1]

## References

[1]: https://spotatlas-jettiem7.manus.space/ "Spot public app URI"
[2]: https://spotatlas-jettiem7.manus.space/#atlas "Spot atlas view"
[3]: https://fonts.google.com/specimen/Shippori+Mincho "Shippori Mincho on Google Fonts"
この ZIP は、プロジェクト規則どおり改定後に渡せる状態にした **ドキュメント一式** です。公開 URI、使い方、変更の経緯、設計の Preserve / Overhaul、公開データのスナップショット、画面キャプチャ、および公開バンドルから復元した **ソース** をまとめています。checkpoint 識別子だけは、現行セッションに WebDev プロジェクトが無いため空欄です。
