# Spot 公開所在

著者: **Manus AI**  
更新: 2026-09-22

プロジェクト規則では、公開 URI、Google サイト公開 URL、Google サイト編集 URL、checkpoint の四つを README と変更履歴に残します。一時プレビュー（`*.manus.computer`）は公開 URI に使いません。埋め込みは Google サイトの **挿入 → 埋め込む → URL → ページ全体** です。プレビュー（静的カード）は使いません。[1]

| 種別 | 値 | 確認 |
| --- | --- | --- |
| アプリ公開 URI | https://spotatlas-jettiem7.manus.space/ | 2026-09-22 HTTP 200。HTML タイトル Spot。`lang="ja"` |
| 地図帳 | https://spotatlas-jettiem7.manus.space/#atlas | 地図キャンバスと公開 3 件を確認 |
| 所有者一覧 | https://spotatlas-jettiem7.manus.space/my | 未ログインは Manus サインインへ |
| 公開 API | https://spotatlas-jettiem7.manus.space/api/trpc/spots.list | 3 件。上野公園 / 錦糸公園 / フォード博物館 |
| Google サイト公開 URL | （未記録） | ページ全体埋め込みと再公開のあと追記 |
| Google サイト編集 URL | （未記録） | `https://sites.google.com/d/{siteId}/p/{pageId}/edit` 形式 |
| Checkpoint | （未記録） | 現行セッションに WebDev プロジェクト無し |
| ソース | 本 ZIP の `source/` | 公開バンドルから復元。checkpoint の git 実体ではない |
| OAuth アプリ ID | `jETTiem7pU4zrsq84LuXKY` | サインイン画面の `appId` から |

Google サイトの見出しを直したあとは、編集画面だけでなく **再公開** が必要です。再公開しないと、公開側に「ページのタイトル」が残ります。埋め込み iframe は、テキスト抽出では空に見えることがあります。確認はスクリーンショットか、実際のブラウザ表示を正とします。[1]

## References

[1]: https://spotatlas-jettiem7.manus.space/ "Spot public URI to embed as a full Google Sites page"
