# Spot_Info OAuth設定の進捗

2026年9月23日21:13 JST時点。**サイト公開と実際のOAuth往復テストはまだ完了していません。** この文書は外部設定の進捗記録です。V01R01の固定タグは変更していません。

## 完了した設定

ユーザーの明示的な承認に基づき、`hiro-mochian` を初期オーナーとして登録しました。一般利用者のGoogle認証と、許可済み管理者のGitHub認証を分離する既存のサーバー側制御は維持しています。

Google Cloudの既存プロジェクト `project-ae55afcc-164d-4f38-905` で、Google認証アプリ `Spot_Info` とWeb用OAuthクライアントを作成しました。生成元は `https://hiro-mochian.github.io`、リダイレクト先は `https://xscvnppiknkzxelzgfnj.supabase.co/auth/v1/callback` です。SupabaseへのGoogleクライアント設定を適用し、公開設定APIでGoogle認証が有効であることを確認しました。

Googleの同意画面には、サイトURL `https://hiro-mochian.github.io/SpotInfo/` とプライバシーポリシーURL `https://hiro-mochian.github.io/SpotInfo/privacy/` を登録しました。アプリはテスト状態です。所有者メールをテストユーザーとして追加しました。

承認された[プライバシーポリシー](プライバシーポリシー.md)を、静的ページ `client/public/privacy/index.html` として追加しました。ホーム・利用者ログイン・管理者入口から参照できます。本文が承認稿と一致すること、型検査、本番ビルド、27件の単体テスト、Manus非依存検査を確認済みです。

GitHubでは、所有者 `hiro-mochian` のOAuthアプリ `Spot_Info Admin` を作成しました。設定画面は https://github.com/settings/applications/3877232 です。クライアントシークレット発行時にGitHubのsudoモード再認証が要求され、そこで操作を停止しています。

## 残っている設定と検証

GitHubで本人確認を行い、管理者用OAuthクライアントの秘密情報をSupabaseへ登録する必要があります。公開前チェックでは、GitHub OAuthの未設定と、不要なメール認証の無効化が残っています。一般利用者にメールやGitHubログインを追加する予定はありません。

その後、Google・GitHubの実ログインを確認し、Google側を一般公開用に切り替え、GitHub Pagesを公開します。Googleセッションで管理者権限を取得できないこと、GitHub管理者セッションで一般利用者の投稿権限を代用できないことも確認します。

秘密情報はリポジトリ・配布ZIP・フロントエンドへ収録しません。外部サービスの設定や実データが、Gitタグだけで復元できるわけではありません。
