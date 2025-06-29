# Deploy

follow the command below:
```shell
cd deploy/prod/ 

sudo docker-compose -f docker-compose.frontend.yaml down
sudo docker-compose -f docker-compose.backend.yaml down

sudo docker-compose -f docker-compose.frontend.yaml up --build
sudo docker-compose -f docker-compose.backend.yaml up --build
```

# Add Wiget and datasouce on dashboard





## MediaStream (Video)

[MediaStream setup docs](docs/MEDIASTREAM_SETUP.md)

## DataChannel (data)

[Datachannel setup docs](docs/DATACHANNEL_SETUP.md)