"use client";

const API = "http://127.0.0.1:8000";

export default function New() {

  async function send() {
    const res = await fetch(`${API}/analyze/CASE1001`, {
      method: "POST"
    });

    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Radiology Clean</h1>
      <button onClick={send}>Run HCC</button>
    </main>
  );
}