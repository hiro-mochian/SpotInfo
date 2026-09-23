# Spot / SpotInfo

身近な「ここ、いいよ」を共有する地図アプリです。元サイトの画面・日本語と英語のコピー・公開投稿・本人限定の編集と削除を保ち、**React + GitHub Pages + Supabase** に移植しています。

> **2026-09-23現在：実行可能な画面とDBの実装・検証は完了していますが、新サイトはまだ公開していません。** 利用者向けGitHubログインのOAuthアプリ設定と方式の確認が残っています。元サイトの所有者付き投稿1件は、本人確認後に新アカウントへ対応付ける必要があります。

## 所在

| 項目 | 場所・状態 |
| --- | --- |
| コードと資料 | [hiro-mochian/SpotInfo](https://github.com/hiro-mochian/SpotInfo) |
| 公開予定URL | `https://hiro-mochian.github.io/SpotInfo/`（未公開） |
| 元サイト | [Spot](https://spotatlas-jettiem7.manus.space/)（停止・変更していません） |
| Supabase | プロジェクト `xscvnppiknkzxelzgfnj`。新規の公開テーブルとユーザーが空であることを確認してから移行 |
| 初回保存点 | タグ `checkpoint-2026-09-23-source-export` |
| 今回の保存点 | タグ `checkpoint-2026-09-23-supabase-build` |

これらのタグはGitチェックポイントです。元のManus WebDevプロジェクトはこのタスクに接続されていないため、Manusの正式なcheckpoint識別子を発行したものではありません。

## 起動

Node.js 22.12以降の対応版を使用してください。検証環境はNode.js 22.13.0です。

```bash
npm ci
cp .env.example .env.local
# .env.local に Supabase の Project URL と publishable key を設定
npm run dev
```

`VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` が必要です。`VITE_AUTH_MODE=github` が現在の公開候補です。Supabase側のGitHubプロバイダー設定は別途必要です。`.env.local` はGitに含めません。

```bash
npm run typecheck
npm test
npm run build
```

本番出力は `dist/` です。既定のベースパスは `/SpotInfo/`、開発時は `/` です。`/SpotInfo/my` の直接アクセス用に `dist/my/index.html` と `dist/404.html` を生成します。

## ソースとドキュメントの構成

| パス | 内容 |
| --- | --- |
| `client/` | **今回の実行可能なフロントエンドソース** |
| `supabase/migrations/` | DB・公開RPC・移行データ・管理関数の権限制限 |
| `supabase/tests/spot_permissions.sql` | 実DBで権限境界を検証する、ロールバック式の28項目テスト |
| `scripts/` | Pagesルート補完と公開前チェック |
| `.github/workflows/pages.yml` | 明示的な手動実行だけで公開するワークフロー |
| `source/` | 提供された復元ソースの保存用アーカイブ。完全な元プロジェクトではありません |
| `docs/` | 元資料、最新の公開データ、移行記録、画面画像、公開設定手順 |

`docs/` の元資料は2026-09-22時点の記録です。現在の移植版については、このREADME、[移行検証記録](docs/移行検証記録.md)、[公開前のログイン設定](docs/公開前のログイン設定.md)を参照してください。

## 維持した機能と変更した基盤

閲覧と投稿はログインなしでも可能です。ゲスト投稿の所有者はNULLで、後から誰かが取得・編集・削除することはできません。ログイン中の投稿は、サーバーが検証した `auth.uid()` にだけ結び付きます。編集と削除には本人の認証が必要です。

元の紙色・濃紺・コーラル、Shippori Mincho / IBM Plex Sans JP、ホームの構成、`#top`・`#atlas`・`#connect`、マイスポットを維持しています。検索入力は、地図上の地名検索と登録スポットの絞り込みを分離しました。

地図はManus固有のGoogle MapsプロキシからLeaflet + OpenStreetMapへ変更しています。検索は明示的なボタン操作のみでPhotonを呼び、同じブラウザ内で1.2秒以上の間隔とキャッシュを設けています。公共タイル・地名検索は無制限の商用サービスではありません。アクセスが増える場合は独自または商用の配信・検索基盤に切り替えてください。[1] [2]

元のManusログインは移せないため、移行先で新たな認証が必要です。GitHubログインを利用する場合、サイトの利用者に要求するのはプロフィールとメールアドレスの読み取りだけです。移行作業用CLIの権限とは別です。[3]

## データ移行と所有者

2026-09-23の公開APIには4件あり、添付資料の3件より増えていました。4件すべてを原文・元の座標・作成日時のまま取り込み、HTTP経由で一致を確認しました。

追加されていた「セーチェーニ温泉 Széchenyi Gyógyfürdő és Uszoda」（元ID `30001`）には元所有者ID `1` が付いていました。`legacy_owner_id` に保存し、新しい `owner_id` は未割当です。誰の新アカウントにも勝手に対応付けていません。元データの座標は東京駅付近の値でしたが、推測で修正していません。本人確認と座標の確認は公開前の確認事項です。

これは公開スポットの移行であり、元サービスのユーザー情報や非公開DB全体を取得したものではありません。最終公開直前に差分を再確認し、元サイトを勝手に停止しない方針です。

## DBとセキュリティ

クライアントにはテーブルを直接操作する権限を与えていません。必要な操作だけを行うRPCを公開し、関数内で認証と所有者を確認します。公開レスポンスには所有者UUIDと旧所有者IDを含めません。RLSも有効にしており、直接テーブルアクセスは拒否します。

入力の文字数、空白だけの値、緯度・経度の範囲をDBとクライアント双方で検証します。ゲスト投稿を開放する仕様自体は維持しているため、投稿スパム対策には追加のCAPTCHAやレート制限の検討が必要です。

秘密の管理キー、OAuth client secret、DBパスワード、CLI認証情報はソース・ZIP・GitHubへ含めません。`VITE_` 変数はブラウザに公開されるため、publishable key以外の秘密キーを入れてはいけません。

## 検証結果と公開条件

型検査、24件の単体テスト、本番ビルドが成功しています。実DBの28件の権限テストも成功し、テストデータはロールバックしました。匿名HTTPリクエストによる閲覧・件数取得を確認し、直接テーブル操作・本人用一覧・更新・削除・所有者の偽装入力が拒否されることを確認しています。`npm audit` は脆弱性0件でした。

ブラウザで地図と実データ4件の表示を確認しています。ただし、利用者の実際のGitHubログイン往復はOAuthアプリ未設定のため未検証です。Supabaseのセキュリティアドバイザーでは重大エラーは0件、意図的に公開したSECURITY DEFINER RPCについて9件の警告が残ります。これらは「警告なし」や第三者によるセキュリティ監査済みを意味しません。

公開ワークフローは `workflow_dispatch` のみです。認証設定がない場合は `scripts/check-deployment.mjs` が公開を停止します。公開にはGitHub PagesのSourceをGitHub Actionsに設定し、ログイン方式・既存所有者の扱い・公開内容を確認した後に手動実行します。[4]

## References

[1]: https://operations.osmfoundation.org/policies/tiles/ "OpenStreetMap Tile Usage Policy"
[2]: https://github.com/komoot/photon "Photon public API and usage conditions"
[3]: https://supabase.com/docs/guides/auth/social-login/auth-github "Supabase: Sign in with GitHub"
[4]: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages "GitHub Pages custom workflows"
