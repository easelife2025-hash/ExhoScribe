const fs = require('fs');

async function test() {
  const bucket = "meeting-mind-7f919.appspot.com";
  const name = "test-upload/test.txt";
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(name)}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: "hello world"
  });
  
  const data = await res.json();
  console.log(res.status, data);
}

test();
