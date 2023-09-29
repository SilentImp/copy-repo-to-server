# Запуск локально
Створіть з `.env.template` файл `.env` і додайте GitHub API токен у `COPY_GITHUB_TOKEN`, імʼя користувача API у `COPY_GITHUB_USERNAME` та статичний пароль у `COPY_PASSWORD`.
```
npm ci
node server.js
```

# Збірка контейнера та публікація у реєстр
```
docker buildx build --platform linux/amd64 -t silentimp/copy-repo-to ./
docker push silentimp/copy-repo-to       
```

# Запуск через контейнер
```
docker run -p 127.0.0.1:3000:3000/tcp silentimp/copy-repo-to
open http://127.0.0.1:3000
```
