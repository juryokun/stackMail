import psycopg2

def lambda_handler(event, context):
    try:
        conn = psycopg2.connect(
            host='HOST',
            database='DATABASE',
            port='PORT',
            user='USER',
            password='PASSWORD'
        )
    except psycopg2.DatabaseError:
        logger.error(
            "ERROR: Unexpected error: "
            "Could not connect to PostgreSQL instance."
        )
        sys.exit()

    query1 = 'TRUNCATE is3_mail_lake RESTART IDENTITY'
    query2 = 'SELECT aws_s3.table_import_from_s3( \
        \'is3_mail_lake\', \
        \'to_addr, from_addr, recieved_datetime, subject\', \
        \'(format csv)\', \
        \'toybacket\', \
        \'mail-lake.csv\', \
        \'ap-northeast-1\' \
        )'
    query3 = 'INSERT INTO mail_lake (to_addr, from_addr, recieved_datetime, subject, inserted_datetime, inserted_job) \
        SELECT t.to_addr \
              ,t.from_addr \
              ,t.recieved_datetime \
              ,t.subject \
              ,NOW() \
              ,\'is3_mail_lake\' \
        FROM is3_mail_lake AS t \
        GROUP BY t.to_addr \
                ,t.from_addr \
                ,t.recieved_datetime \
                ,t.subject \
        ON CONFLICT \
        ON CONSTRAINT mail_lake_pkey \
        DO UPDATE \
        SET to_addr = EXCLUDED.to_addr \
           ,from_addr = EXCLUDED.from_addr \
           ,recieved_datetime = EXCLUDED.recieved_datetime \
           ,subject = EXCLUDED.subject'

    with conn.cursor() as cur:
        cur.execute(query1)
        cur.execute(query2)
        cur.execute(query3)
    conn.commit()

    return "success!"
