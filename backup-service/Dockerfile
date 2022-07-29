FROM ubuntu

ENV DEBIAN_FRONTEND noninteractive

RUN apt update && apt install python3 python3-pip cron curl unzip -y

WORKDIR /app

COPY install_awscli.sh .

RUN bash install_awscli.sh

COPY install_dockercli.sh .

RUN bash install_dockercli.sh

COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

COPY db_backup.sh .

RUN chmod +x db_backup.sh

COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

COPY monitoring.py .

ENTRYPOINT [ "/app/entrypoint.sh" ]