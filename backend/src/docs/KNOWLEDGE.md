### 1. node "fileName".js

Đây là cách chạy trực tiếp một file Node.js.

Ví dụ:

```
node app.js
```

```
Node sẽ:
chạy file app.js
không tự reload khi code thay đổi
không chạy script nào khác
Muốn chạy lại phải stop rồi chạy lại thủ công.
```

### 2. npm run dev

npm run dev thực chất là chạy script được định nghĩa trong package.json.

Ví dụ:

```JS
{
  "scripts": {
    "dev": "nodemon src/app.js"
  }
}
```

```
Khi chạy:
npm run dev
thì thực tế nó chạy:
nodemon src/app.js

nodemon sẽ:
theo dõi file thay đổi
tự restart server
thuận tiện khi phát triển
```

### 3. So sánh

| Lệnh                    | Ý nghĩa                            |
| ----------------------- | ---------------------------------- |
| `node app.js`           | chạy Node trực tiếp                |
| `npm run dev`           | chạy script trong package.json     |
| `npm run dev` + nodemon | tự reload server khi code thay đổi |

### 4. Ví dụ project backend phổ biến

Trong package.json

```js
{
    "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js"
    }
}
```

```
Chạy development:
npm run dev
Chạy production:
npm start
```

npm run dev

```
thực tế sẽ chạy:
nodemon src/app.js

nodemon có chức năng:
theo dõi file thay đổi
tự động restart server
tiện khi đang viết code
```

```
Ví dụ: bạn sửa controller, route, model → server tự restart.

Script này dùng cho development.
```

Tiếp theo, start.

```
Khi chạy:
npm start

thực tế chạy:
node src/app.js
```

```
Đặc điểm:
chạy Node bình thường
không auto reload
dùng khi deploy production
Nếu code thay đổi thì phải restart server thủ công
```

So sánh ngắn gọn:

| Script        | Chạy gì              | Mục đích    |
| ------------- | -------------------- | ----------- |
| `npm run dev` | `nodemon src/app.js` | development |
| `npm start`   | `node src/app.js`    | production  |

```
Trong project Node.js chuẩn thường sẽ có:

scripts
 ├─ dev    -> nodemon
 ├─ start  -> node
 └─ test   -> jest
```
