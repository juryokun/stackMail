function main() {
    var sheet = SpreadsheetApp.getActive().getSheetByName('summary');
    sheet.clearContents();
    summaryGmail();
    uploads();
}
function summaryGmail() {

    var target_date = new Date();
    target_date.setDate(target_date.getDate() - 8);
    var target_date_string = Utilities.formatDate(target_date, 'Asia/Tokyo', 'yyyy/MM/dd');

    // 検索条件に該当するスレッド一覧を取得
    var threads = GmailApp.search('after:' + target_date_string);
    // var threads = GmailApp.search('after:2019/10/1 before:2020/5/17');

    // スレッドを一つずつ取り出す
    threads.forEach(function (thread) {
        // スレッド内のメール一覧を取得
        var messages = thread.getMessages();
        // メールを一つずつ取り出す
        messages.forEach(function (message) {
            var toAddr = processAddr(message.getTo());
            var fromAddr = processAddr(message.getFrom());
            var date = message.getDate();
            var subject = message.getSubject();

            // 書き込むシートを取得
            var sheet = SpreadsheetApp.getActive().getSheetByName('summary');

            // 最終行を取得
            var lastRow = sheet.getLastRow() + 1;

            // セルを取得して値を転記
            sheet.getRange(lastRow, 1).setValue(toAddr);
            sheet.getRange(lastRow, 2).setValue(fromAddr);
            sheet.getRange(lastRow, 3).setValue(date);
            sheet.getRange(lastRow, 4).setValue(subject);

        });
    });
}

function processAddr(string) {
    var reg = /<[\w\-\+\._]+@[\w\-\+\._]+\.[A-Za-z]+>/;
    if (reg.test(string)) {
        var rel = reg.exec(string);
        retVal = rel[0].replace('<', '').replace('>', '');
        return retVal;
    }
    return string;
}

function uploads() {
    // 使ったS3ライブラリ
    // MB4837UymyETXyn8cv3fNXZc9ncYTrHL9

    // シートのオブジェクトを取得
    var sheet = SpreadsheetApp.getActive().getSheetByName('summary');

    // データを取得
    var data = sheet.getRange('A:D').getValues();

    // 送信データ用の配列を用意
    var csv = '';

    // データをチェックしながらループ
    for (var i = 0; i < data.length; i++) {
        // id があれば
        if (data[i][0] != '') {
            // データを作成
            csv += '"' + data[i][0] + '","' + data[i][1] + '","' + Utilities.formatDate(data[i][2], 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss') + '","' + data[i][3].replace(/"/g, '""') + '"\n';
        }
    }

    // バイナリに変換
    csv = Utilities.newBlob(csv);

    var s3 = S3.getInstance('access-key', 'secret-key');
    s3.putObject('backet', 'file', csv, { logRequests: true });
}