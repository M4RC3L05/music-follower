FROM amacneil/dbmate:2.12.0

WORKDIR /app

COPY ./src/database/migrations ./migrations

RUN mkdir /app/data

VOLUME [ "/app/data" ]

ENTRYPOINT [ ]
CMD [ "dbmate", "-u", "sqlite:./data/app.db", "-d", "./migrations", "--no-dump-schema", "migrate" ]
