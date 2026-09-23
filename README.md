# Spot_Info V01R01 — Google Cloud版

**公開サイト：[https://spot-info.web.app/](https://spot-info.web.app/)**  
**管理者入口：[https://spot-info.web.app/admin](https://spot-info.web.app/admin)**

従来のSpot_Info V01R01を、Firebase Hosting・Firebase Authentication・Cloud Firestoreへ移植した版です。一般利用者、オーナー、管理者はすべてGoogleでログインします。運用時にManusのAPI・認証・ホスティング、Supabase、GitHub認証を使用しません。GitHubはソース管理と旧URLの移転案内に使用します。

## 構成と料金設定

| 項目 | 現在の設定 |
| --- | --- |
| Firebaseプロジェクト | `spot-info` |
| プラン | Spark（無料プラン） |
| 請求先 | 未接続。`billingEnabled=false`を確認 |
| 公開先 | Firebase Hosting |
| 認証 | Googleのみ。Google Auth Platformは「本番環境・外部」 |
| DB | Cloud Firestore Standard、東京 `asia-northeast1` |
| 初期オーナー | `hiro.mochian@gmail.com` |
| 地図・検索 | Leaflet / OpenStreetMap / Photon |

Sparkには利用上限があり、無制限のサービスではありません。利用量はFirebaseコンソールで確認してください。今回、課金プランへの変更、請求先の追加、Cloud Functionsの導入はしていません。[1]

## ローカルで起動

Node.js 22を使います。ブラウザに配布される公開設定を `config/firebase.public.json` に同梱しています。管理者用秘密鍵、OAuthクライアントシークレット、認証トークンは含みません。

```sh
npm ci
node scripts/setup-public-config.mjs
npm run dev
```

## 検証と公開

```sh
npm run typecheck
npm test
npm run build
npm run check:independence
npm audit --audit-level=moderate
```

FirestoreルールのテストにはJava 21以降とFirebase CLIが必要です。

```sh
npm install -g firebase-tools@15.30.2
npm run test:firestore
firebase login
firebase deploy --only firestore:rules,firestore:indexes,hosting --project spot-info
```

再デプロイには対象Firebaseプロジェクトへの権限が必要です。公開用API設定だけで管理権限は得られません。管理者権限は認証サーバー側の `role` カスタムクレームで管理します。[2]

## ソースと保存点

実行するソースは `client/`、DBの権限制御は `firestore.rules`、配置設定は `firebase.json` です。`source/` と `supabase/` は旧版の復元・移行履歴であり、新サイトの運用では実行しません。

固定タグ `V01R01` は元のベースラインのまま変更していません。今回のGoogle移植版は別のGitチェックポイント `checkpoint-V01R01-google-cloud-20260923` として保存します。元のベースラインと同一コミットだという意味ではありません。

利用方法は [利用ガイド](docs/利用ガイド.md)、実施した検証と制約は [Google Cloud移行結果](docs/GoogleCloud移行結果.md)、公開先は [公開URL](docs/公開URL.md) を参照してください。旧資料は [移行前の資料](docs/history/pre-firebase/) に保管しています。

## References

[1]: https://firebase.google.com/pricing "Firebase Pricing"
[2]: https://firebase.google.com/docs/auth/admin/custom-claims "Control Access with Custom Claims and Security Rules"
