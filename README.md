# stackMail

## 概要
Mailを集計しRDSへ連携する

## 方針
- GASを利用してGmailを集計
- GASでS3へファイルをアップロード
- S3にアップロードしたファイルをRDSで取り込む