const axios = require('axios');

async function getBooks() {
  const res = await axios.get('https://cdn.khotangtruyen.org/books.small.json');

  console.log(res.data.slice(0, 5)); // 5 truyện đầu
}

getBooks();

async function getBook(id) {
  const res = await axios.get(`https://cdn.khotangtruyen.org/books/${id}/metadata.book.json`);

  console.log(res.data);
}

getBook(153195);

async function getChapters(id) {
  const res = await axios.get(`https://cdn.khotangtruyen.org/books/${id}/chapters.json`);

  console.log(res.data);
}

getChapters(153195);

