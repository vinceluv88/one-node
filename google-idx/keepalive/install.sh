#!/usr/bin/env sh

# 1. pull docker image
docker run -d \
  --name=firefox \
  --security-opt seccomp=unconfined \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Etc/UTC \
  -e DOCKER_MODS=linuxserver/mods:universal-package-install \
  -e INSTALL_PACKAGES=fonts-noto-cjk \
  -e LC_ALL=zh_CN.UTF-8 \
  -e CUSTOM_USER=admin \
  -e PASSWORD=123456 \
  -e MOZ_DISABLE_AUTO_UPDATE=1 \
  -p 3000:3000 \
  -p 3001:3001 \
  -v ~/firefox:/config \
  --shm-size="1gb" \
  --restart unless-stopped \
  lscr.io/linuxserver/firefox:latest

# 2. init directory
mkdir -p app/firefox/idx
mkdir -p app/idx-keepalive
cd app/idx-keepalive

# 3. download keepalive scripts & install dependencies
wget https://raw.githubusercontent.com/vevc/one-node/refs/heads/main/google-idx/keepalive/app.js
wget https://raw.githubusercontent.com/vevc/one-node/refs/heads/main/google-idx/keepalive/package.json
npm install

# 4. create startup.sh
wget https://raw.githubusercontent.com/vevc/one-node/refs/heads/main/google-idx/keepalive/startup.sh
sed -i 's#$PWD#'$PWD'#g' startup.sh
chmod +x startup.sh

# 5. return main directory
cd -
