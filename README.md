# Spot_Info — V01R01

身近な「ここ、いいよ」を共有する地図アプリです。**運用・認証・API・ビルド・公開はManusに依存しません。** GitHubでコードを管理し、Google/GitHubで本人確認し、SupabaseでセッションとDB・検証APIを管理します。地図にはLeaflet、OpenStreetMap、Photonを使います。

> 2026-09-23現在：コード変更、DBの権限分離、認証元検証APIの配置、ビルドと各種検査が完了しています。**Google/GitHub OAuthアプリの設定、不要な認証方式の無効化、初期オーナー承認が残り、サイトはまだ公開していません。** 実アカウントでのOAuth往復も未検証です。

## ベースライン

正式名称は **Spot_Info**、Version01・revision01の識別子は **V01R01** です。Gitタグ `V01R01` を固定の基準版とします。GitHubリポジトリ名 `SpotInfo` と公開予定パス `/SpotInfo/` は変更していません。npm用SemVer `1.1.0` は管理用の対応値であり、正式な版表示は `V01R01` です。

ベースラインの確定と本番公開は別です。認証設定が未完了の状態を隠して「公開済み」とは記録しません。[基準版の記録](docs/Spot_Info_V01R01_ベースライン.md)を参照してください。

## 認証と権限

| 対象 | 必要な認証 | 許可する操作 |
| --- | --- | --- |
| 公開閲覧 | 不要 | 地図・公開スポットの閲覧 |
| 一般利用者・スポット登録者 | Googleのみ | 投稿、自分の投稿の一覧・編集・削除 |
| オーナー・管理者 | GitHub + 不変IDの許可名簿 | 管理者入口と運用状況の確認 |
| 未許可GitHub・メール認証・未認証 | 投稿・管理権限なし | 公開閲覧のみ |

管理者としてログインした状態で一般利用者向けの投稿を行うことはできません。投稿にはGoogleでログインし直します。管理者への自動昇格、自己申告のroleによる昇格、他人の投稿の編集・削除機能はありません。

同じメールアドレスのGoogle/GitHubアカウントがSupabase上で連携されても、セッションごとに実際の認証元をサーバーで検証します。Googleのセッションで管理権限は使えません。[認証分離の設計](docs/認証分離の設計.md)を参照してください。

## 所在と状態

| 項目 | 値 |
| --- | --- |
| リポジトリ | https://github.com/hiro-mochian/SpotInfo |
| 公開予定URL | `https://hiro-mochian.github.io/SpotInfo/`（未公開） |
| 管理者入口 | 公開後の `/SpotInfo/admin/` |
| Supabase | `xscvnppiknkzxelzgfnj` |
| 今回のGit保存点 | `V01R01` |
| 初期オーナー候補 | `hiro-mochian` / GitHub ID `53967801`。権限付与の承認待ち |

Git保存点はManus WebDevの正式checkpointではありません。旧サイトや過去の資料にあるManusのURLは出典・履歴であり、このアプリの実行先ではありません。`source/` は復元資料の保存用アーカイブで、本番ビルドに含めません。

## 起動・検査

Node.js 22.12以降の対応版を使用します。検証時は22.13.0です。

```bash
npm ci
cp .env.example .env.local
# SupabaseのProject URLとpublishable keyを.env.localに設定
npm run dev
npm run typecheck
npm test
npm run build
node scripts/check-independence.mjs
node --env-file=.env.local scripts/check-deployment.mjs
```

`VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` を使用します。`VITE_AUTH_MODE` は廃止しました。認証方式は一般利用者Google・管理者GitHubの固定分離です。OAuth client secret、service role key、CLIトークンを `VITE_` 変数へ入れないでください。

本番出力は `dist/`、既定のベースパスは `/SpotInfo/` です。`my/`、`admin/` の直接アクセス用HTMLを生成します。GitHub Actionsは手動実行だけで、公開前チェックが成功しなければ公開しません。

## DB・認証検証API

SQLは `supabase/migrations/` の順で適用します。現在のプロジェクトへは適用済みです。投稿テーブルは直接操作を許さず、限定したRPC内でGoogle認証と所有者を確認します。認証元と管理者名簿はAPIから直接触れない `app_private` スキーマにあります。

認証検証APIは独立したSupabase Edge Functionです。

```bash
npx supabase functions deploy verify-login --project-ref YOUR_PROJECT_REF --use-api --no-verify-jwt
npx supabase secrets set APP_ORIGIN=https://YOUR_OWNER.github.io --project-ref YOUR_PROJECT_REF
```

`--no-verify-jwt` は認証を省略する意味ではありません。関数内で必ずSupabase Authへユーザー検証を行い、Google/GitHubへの本人情報照会、DB内のidentityとセッションの一致を確認してから証明を記録します。匿名・偽造セッションは401で拒否します。provider tokenは保存・ログ出力しません。検証記録は1時間で期限切れになり、再ログインを要求します。

Google/GitHubのOAuth設定、Emailなどの無効化、初期オーナー承認の手順は [公開前のログイン設定](docs/公開前のログイン設定.md) にあります。初期オーナーや追加管理者は、具体的なアカウントの承認後にのみ許可名簿へ追加します。

## ソースと資料

| パス | 内容 |
| --- | --- |
| `client/` | 現在の実行可能な画面ソース |
| `supabase/functions/verify-login/` | 実際の認証元を検証するAPI |
| `supabase/migrations/` | 投稿DB、データ、権限分離の移行SQL |
| `supabase/tests/provider_permissions.sql` | 現行の権限境界テスト。データはロールバック |
| `supabase/tests/archive/` | 以前のゲスト投稿仕様に対するテストの履歴 |
| `scripts/` | ビルド補完、公開前検査、実行依存検査 |
| `.github/workflows/pages.yml` | 手動公開ワークフロー |
| `docs/` | 利用ガイド、検証、設定手順、公開状態、画面画像 |
| `source/` | 提供された旧復元ソースのアーカイブ |

ドキュメントZIPにはこれらの現在のソースとlockfileを同梱します。秘密情報、依存キャッシュ、CLI一時データは含めません。Gitのバックアップだけでは稼働DB・OAuth設定・認証ユーザーを復元できません。

## データと既知の留保

公開データ4件を元の内容・座標・日時を維持して移行済みです。旧ID `30001` の「セーチェーニ温泉」は旧所有者ID `1` を保存しており、新しい所有者は未割当です。本人がGoogleでログインした後に、本人確認して対応付けます。座標は元データのままで、推測で修正していません。

地図タイルと地名検索には公共サービスの利用条件があります。アクセス増加時は独自または契約したサービスへ切り替えます。認証を必須にしても投稿スパム対策のすべてを満たすわけではなく、利用規模に合わせて制限や監視を検討します。

## 検証

型検査、27件の単体テスト、本番ビルド、実DBの34項目の権限テストと5項目の認証元結合テストが成功しました。匿名投稿、匿名検証API、偽造セッションのHTTP拒否も確認しました。実行コードと本番出力の既知のManus固有エンドポイント・キー・SDKパターン検査も成功しています。これは第三者による完全なセキュリティ監査を意味しません。

一般利用者のGoogle専用ログイン画面とGitHub専用管理者入口をブラウザで表示確認しました。OAuthアプリ未設定のため、Google/GitHubの実アカウントでの認証成功・投稿往復はまだ確認していません。公開前チェックは不足設定を正しく検出して停止しています。
