# njsis
NodeJS Image Server

To create Docker image, run:
```
docker build -t njsis .
```
Then check to see if an image was created:
```
docker images
```
You should get a TAG. Use it as such:
```
docker tag [tag] njsis:latest
```

To run, use:
```
docker run -i -t njsis:latest
```