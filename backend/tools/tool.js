/**
 * MTC Tools - Novel Downloader for Lono/NovelFever app
 *
 * Usage: node tool.js
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIG - Thay đổi thông tin tại đây
// ============================================================
const EMAIL = '';
const PASSWORD = '';

// Danh sách sách cần tải:
// - Nếu là số → book ID
// - Nếu là chuỗi → tìm kiếm theo tên
const BOOKS = [
  //   'Ta lấy thân con gái chém bay giang hồ',
  //   'Chấp Ma', // Dùng tên thì phải điền EMAIL, PASSWORD ở trên mới tìm được
  153195, // hoặc dùng book ID trực tiếp (ko cần điền EMAIL, PASSWORD) Điền id truyện vào để down
];

// Thư mục lưu output
const OUTPUT_DIR = path.join(__dirname, 'books');

// Delay giữa mỗi request (ms) để tránh rate limit
const REQUEST_DELAY_MS = 100;

// Số chapter tải song song cùng lúc
const CONCURRENCY = 20;
// ============================================================

const API_HOST = 'android.lonoapp.net';
let authToken = null;

// ─── HTTP helper ────────────────────────────────────────────

function request(method, urlPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'okhttp/4.9.0',
      'Accept-Encoding': 'identity',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = https.request({ hostname: API_HOST, path: urlPath, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(new Error(`JSON parse error for ${urlPath}: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Auth ───────────────────────────────────────────────────

async function login() {
  console.log(`\n🔐 Logging in as ${EMAIL}...`);
  const res = await request('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD, device_name: 'android' });
  if (!res?.data?.token) throw new Error('Login failed: ' + JSON.stringify(res));
  authToken = res.data.token;
  console.log(`✅ Token: ${authToken.substring(0, 20)}...`);
}

// ─── Book resolution ────────────────────────────────────────

async function searchBook(name) {
  const enc = encodeURIComponent(name);
  const res = await request('GET', `/api/books/search?keyword=${enc}`, null, authToken);
  if (!res?.data?.length) throw new Error(`Book not found: "${name}"`);
  const book = res.data[0];
  console.log(`  🔍 Found: ${book.name} (id=${book.id})`);
  return book;
}

async function getBook(id) {
  const res = await request('GET', `/api/books/${id}`, null, authToken);
  if (!res?.data) throw new Error(`Book not found: id=${id}`);
  return res.data;
}

async function resolveBook(nameOrId) {
  if (typeof nameOrId === 'number' || /^\d+$/.test(String(nameOrId))) {
    return getBook(parseInt(nameOrId));
  }
  const found = await searchBook(nameOrId);
  return getBook(found.id); // luôn lấy full detail
}

// ─── Chapters ───────────────────────────────────────────────

async function getAllChapters(bookId) {
  const res = await request('GET', `/api/chapters?filter[book_id]=${bookId}`, null, authToken);
  const data = res?.data;
  if (!data?.length) throw new Error(`No chapters found for book ${bookId}`);
  console.log(`  Total: ${data.length} chapters`);
  return data;
}

// ─── Decrypt ────────────────────────────────────────────────

function decryptContent(content) {
  const innerBuf = Buffer.from(content, 'base64');

  // Find "iv":"
  const ivMark = Buffer.from('"iv":"');
  let ivStart = -1;
  for (let i = 0; i < innerBuf.length - 6; i++) {
    if (innerBuf.slice(i, i + 6).equals(ivMark)) {
      ivStart = i + 6;
      break;
    }
  }

  // Find ","value":"
  const valMark = Buffer.from('","value":"');
  let ivEnd = -1;
  for (let i = ivStart; i < innerBuf.length - 11; i++) {
    if (innerBuf.slice(i, i + 11).equals(valMark)) {
      ivEnd = i;
      break;
    }
  }

  const ivRaw = innerBuf.slice(ivStart, ivEnd);

  // Find closing " of value: scan FORWARD (base64 không chứa 0x22)
  const valFrom = ivEnd + 11;
  let valEnd = valFrom;
  while (valEnd < innerBuf.length && innerBuf[valEnd] !== 0x22) valEnd++;
  const cipherBytes = Buffer.from(innerBuf.slice(valFrom, valEnd).toString('ascii'), 'base64');

  // Key = content[17..33] (16 bytes AES-128)
  const keyBytes = Buffer.from(content.substring(17, 33), 'latin1');

  // Ciphertext phải là multiple of 16
  // Approach A: skip block 0 (dùng cipher[0:16] làm IV), decrypt cipher[16:]
  // Approach B: decrypt toàn bộ ciphertext với IV filtered từ ivRaw
  let dec;

  if (cipherBytes.length >= 32 && cipherBytes.length % 16 === 0) {
    // Approach A (preferred): bỏ block 0, decrypt từ block 1
    const decipher = crypto.createDecipheriv('aes-128-cbc', keyBytes, cipherBytes.slice(0, 16));
    decipher.setAutoPadding(true);
    dec = Buffer.concat([decipher.update(cipherBytes.slice(16)), decipher.final()]);
  } else {
    // Approach B: ciphertext bị off → filter base64 chars từ ivRaw làm IV
    const ivB64 = [];
    for (const b of ivRaw) {
      if (
        (b >= 0x41 && b <= 0x5a) ||
        (b >= 0x61 && b <= 0x7a) ||
        (b >= 0x30 && b <= 0x39) ||
        b === 0x2b ||
        b === 0x2f
      ) {
        ivB64.push(String.fromCharCode(b));
      }
    }
    while (ivB64.length % 4 !== 0) ivB64.push('=');
    let ivBytes = Buffer.from(ivB64.join(''), 'base64');
    if (ivBytes.length > 16) ivBytes = ivBytes.slice(0, 16);

    // Align ciphertext to multiple of 16 nếu cần
    let aligned = cipherBytes;
    if (aligned.length % 16 !== 0) {
      const pad = 16 - (aligned.length % 16);
      aligned = Buffer.concat([aligned, Buffer.alloc(pad, pad)]);
    }

    const decipher = crypto.createDecipheriv('aes-128-cbc', keyBytes, ivBytes);
    decipher.setAutoPadding(true);
    dec = Buffer.concat([decipher.update(aligned), decipher.final()]);
  }

  return dec.toString('utf8');
}

async function fetchAndDecrypt(chapterId) {
  const res = await request('GET', `/api/chapters/${chapterId}`, null, authToken);
  const data = res?.data;
  if (!data?.content) throw new Error(`No content for chapter ${chapterId}`);

  const raw = decryptContent(data.content);

  // Bỏ header bị cắt (trước \n\n đầu tiên), prepend tên chương từ API
  const doubleNl = raw.indexOf('\n\n');
  const body = doubleNl >= 0 && doubleNl < 150 ? raw.substring(doubleNl + 2) : raw;
  return `${data.name}\n\n${body}`;
}

// ─── Poster & Overview ─────────────────────────────────────

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const get = (u) => {
      const mod = u.startsWith('https') ? https : require('http');
      mod
        .get(u, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            file.destroy();
            return get(res.headers.location);
          }
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', reject);
          res.on('error', reject);
        })
        .on('error', reject);
    };
    get(url);
  });
}

const KIND_MAP = { 1: 'Chuyển ngữ', 2: 'Sáng tác' };

function buildOverview(book) {
  const kind = KIND_MAP[String(book.kind)] ?? book.kind;
  const sex = book.sex === 1 ? 'Nam' : 'Nữ';
  const genres = (book.genres ?? []).map((g) => g.name).join(', ') || '—';
  const tags = (book.tags ?? []).map((t) => t.name).join(', ') || '—';
  const author = book.author
    ? `${book.author.name}${book.author.local_name ? ` (${book.author.local_name})` : ''}`
    : '—';
  const creator = book.creator?.name ?? '—';

  return [
    `Tên truyện  : ${book.name}`,
    `Loại        : ${kind}`,
    `Đối tượng   : ${sex}`,
    `Trạng thái  : ${book.status_name}`,
    ``,
    `Đánh giá    : ${book.review_score} ⭐ (${book.review_count} lượt)`,
    `Bình luận   : ${book.comment_count}`,
    `Đề cử       : ${book.vote_count}`,
    ``,
    `Tác giả     : ${author}`,
    `Đăng bởi    : ${creator}`,
    ``,
    `Thể loại    : ${genres}`,
    `Tags        : ${tags}`,
    ``,
    `Tóm tắt:`,
    book.synopsis ?? '',
  ].join('\n');
}

// ─── Main ───────────────────────────────────────────────────

async function downloadBook(nameOrId) {
  console.log(`\n📚 Resolving book: ${nameOrId}`);
  const book = await resolveBook(nameOrId);
  console.log(`📗 Book: ${book.name} (id=${book.id}, slug=${book.slug})`);

  // Tạo thư mục output
  const bookDir = path.join(OUTPUT_DIR, `${book.id}_${book.slug}`);
  fs.mkdirSync(bookDir, { recursive: true });

  // Ghi overview
  const overviewPath = path.join(bookDir, '00000_overview.txt');
  fs.writeFileSync(overviewPath, buildOverview(book), 'utf8');
  console.log(`  📄 Overview saved.`);

  // Tải poster
  const posterUrl = book.poster?.['600'] ?? book.poster?.default;
  if (posterUrl) {
    const ext = posterUrl.split('?')[0].split('.').pop() || 'jpg';
    const posterPath = path.join(bookDir, `00000_poster.${ext}`);
    try {
      await downloadFile(posterUrl, posterPath);
      console.log(`  🖼️  Poster saved.`);
    } catch (e) {
      console.error(`  ⚠️  Poster download failed: ${e.message}`);
    }
  }

  // Lấy danh sách chapters
  console.log(`\n📋 Fetching chapter list...`);
  const chapters = await getAllChapters(book.id);

  // Download song song CONCURRENCY chapters mỗi lúc
  let ok = 0,
    skip = 0,
    fail = 0;
  const total = chapters.length;

  // Tách chapter thành batches
  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = chapters.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (ch) => {
        const outFile = path.join(bookDir, `${ch.index.toString().padStart(5, '0')}_${ch.id}.txt`);

        // Skip nếu đã có
        if (fs.existsSync(outFile)) {
          skip++;
          process.stdout.write(`\r  ✅ ${ok}/${total} | skip=${skip} | fail=${fail}  `);
          return;
        }

        try {
          const text = await fetchAndDecrypt(ch.id);
          fs.writeFileSync(outFile, text, 'utf8');
          ok++;
        } catch (e) {
          fail++;
          console.error(`\n  ❌ Chapter ${ch.id} (${ch.name}): ${e.message}`);
        }
        process.stdout.write(`\r  ✅ ${ok}/${total} | skip=${skip} | fail=${fail}  `);
      })
    );

    // Delay nhỏ giữa mỗi batch
    if (i + CONCURRENCY < total) await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\n\n✅ Done: ${ok} saved, ${skip} skipped, ${fail} failed`);
  console.log(`📁 Output: ${bookDir}`);
}

async function main() {
  try {
    if (EMAIL) {
      await login();
    } else {
      console.log('\nℹ️  No email configured — running without login (public content only).');
    }
    for (const book of BOOKS) {
      await downloadBook(book);
    }
    console.log('\n🎉 All done!');
  } catch (e) {
    console.error('\n❌ Fatal error:', e.message);
    process.exit(1);
  }
}

main();
