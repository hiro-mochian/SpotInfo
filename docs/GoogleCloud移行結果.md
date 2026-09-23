# Spot_Info V01R01 — Google Cloud移行結果

作成：2026年9月23日。文書作成：Manus AI。

## Google基盤へ配置済み

公開先は [https://spot-info.web.app/](https://spot-info.web.app/) です。Firebase Hosting、Google認証、Firebase Authentication、Cloud Firestoreで実行します。GitHub認証とSupabaseのクライアント依存を運用コードから除去しました。Manusの実行環境、認証、APIは利用しません。

Firebaseプロジェクト `spot-info` は新規に作成しました。コンソールでSparkプランを確認し、Cloud Billing APIでも請求先なし・課金無効を確認しています。従量課金のBlazeが提示された既存「My First Project」にはFirebaseを追加していません。

## データと所有者

Supabaseの最新データからスポット4件を移行しました。Google認証アカウント1件はGoogleの利用者識別子を保持してFirebaseへ移しました。初期オーナーは承認された `hiro.mochian@gmail.com` です。移行元のGoogle識別子と、Firebase CLIで認証したGoogle本人情報の一致も確認しています。

公開コレクション `spots` には投稿内容・位置・日時だけを置きます。所有者のUIDと旧所有者IDは非公開の `spotOwners` に分離しました。移行した4件は旧所有者との対応が確定していないため `uid=null` を維持し、他人が引き取れないよう制御しています。

## 認証と権限

一般利用者、オーナー、管理者はすべてGoogleで認証します。Googleプロバイダーだけが有効であることを管理APIで確認しました。Google Auth Platformは「本番環境・外部」です。

投稿はGoogleの確認済みアカウントに限定し、更新・削除は投稿本人だけに許可します。Googleでログインしただけでは管理者になりません。管理権限はサーバー側で付与したカスタムクレームで制御します。[1]

## 検証

| 検査 | 結果 |
| --- | --- |
| TypeScript型検査 | 成功 |
| 単体テスト | 27件成功 |
| Firestore Emulator権限テスト | 8件成功 |
| 本番ビルド | 成功 |
| npm依存検査 | 脆弱性0件 |
| 実DBの匿名公開データ閲覧 | 4件取得成功 |
| 実DBの匿名所有者情報閲覧 | HTTP 403で拒否 |
| 公開データへのメール・UID混入 | なし |
| 管理APIによるオーナークレーム確認 | 成功 |
| Google認証の公開対象 | 本番環境・外部 |
| 公開URLとプライバシーページ | HTTP 200 |
| ブラウザの管理者ログイン入口 | Google専用表示を確認 |
| 実ブラウザのOAuth往復・投稿一連操作 | ログイン開始まで確認。完了確認は未実施 |

公開URLでのオーナー本人によるログインと、投稿・編集・削除の最終確認をお願いします。ポップアップを許可する必要があります。未実施の確認を「成功」とは扱っていません。

## 保存点と制約

固定の `V01R01` タグは元のベースラインとして変更していません。今回のコードは別のGitチェックポイント `checkpoint-V01R01-google-cloud-20260923` に保存します。V01R01の表示を保った移植版であり、元タグと同一のコミットではありません。

ソースZIPには実行可能なクライアント、Firestoreルール、公開設定、テスト、資料を含めます。個人情報を含む認証データ、認証トークン、Googleのクライアントシークレットは含めません。Gitバンドルはコード履歴のバックアップであり、稼働中のFirestoreとAuthenticationの全バックアップではありません。

Sparkにはサービスごとの無料利用上限があります。課金が自動で有効になるような設定は行っていません。[2]

## References

[1]: https://firebase.google.com/docs/auth/admin/custom-claims "Control Access with Custom Claims and Security Rules"
[2]: https://firebase.google.com/pricing "Firebase Pricing"
