FROM alpine:3.20

RUN apk add --no-cache pgbouncer su-exec postgresql-client

COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt /etc/pgbouncer/userlist.txt

RUN chown -R pgbouncer:pgbouncer /etc/pgbouncer && \
    mkdir -p /var/log/pgbouncer /var/run/pgbouncer && \
    chown -R pgbouncer:pgbouncer /var/log/pgbouncer /var/run/pgbouncer

USER pgbouncer
EXPOSE 6432

CMD ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]
