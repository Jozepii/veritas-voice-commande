// μ-law <-> PCM16 helpers for Twilio Media Streams (8kHz)

function muLawDecode(buf) {
  const out = new Int16Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    let u = ~buf[i];
    const sign = u & 0x80;
    const exp = (u >> 4) & 0x07;
    const mant = u & 0x0F;
    let sample = ((mant << 1) + 1) << (exp + 2);
    sample -= 33;
    out[i] = sign ? -sample : sample;
  }
  return out;
}

function muLawEncode(pcm16) {
  const out = Buffer.alloc(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    let s = pcm16[i];
    let sign = (s >> 8) & 0x80;
    if (sign) s = -s;
    if (s > 32635) s = 32635;
    s += 132;
    let exp = 7;
    for (let m = 0x4000; (s & m) === 0 && exp > 0; exp--, m >>= 1) {}
    const mant = (s >> (exp + 3)) & 0x0F;
    out[i] = ~(sign | (exp << 4) | mant) & 0xff;
  }
  return out;
}

module.exports = { muLawDecode, muLawEncode };
