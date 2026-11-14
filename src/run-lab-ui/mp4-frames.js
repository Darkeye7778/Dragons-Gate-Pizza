"use strict";

// Inspect ISO BMFF metadata with random-access reads. The media payload stays in the file.
async function readMp4Frames(file) {
  const fourCC = (d, p) => String.fromCharCode(...new Uint8Array(d.buffer, d.byteOffset + p, 4));
  const view = async (start, length) => new DataView(await file.slice(start, start + length).arrayBuffer());
  function header(d, p, remaining) {
    let size = d.getUint32(p), bytes = 8;
    if (size === 1) {
      size = Number(d.getBigUint64(p + 8));
      bytes = 16;
    }
    if (!size) size = remaining;
    if (!Number.isSafeInteger(size) || size < bytes || size > remaining) throw Error("Invalid MP4 box");
    return {type: fourCC(d, p + 4), size, data: p + bytes, end: p + size};
  }

  let movie;
  for (let p = 0; p + 8 <= file.size;) {
    const d = await view(p, 16), box = header(d, 0, file.size - p);
    if (box.type === "moov") {
      const length = box.size - box.data;
      if (length > 64 * 1024 * 1024) throw Error("MP4 metadata is too large to index");
      movie = await view(p + box.data, length);
      break;
    }
    p += box.size;
  }
  if (!movie) throw Error("MP4 movie metadata is missing");

  function* boxes(start, end) {
    for (let p = start; p + 8 <= end;) {
      const box = header(movie, p, end - p);
      yield box;
      p += box.size;
    }
  }
  const root = {data: 0, end: movie.byteLength};
  const children = box => box ? [...boxes(box.data, box.end)] : [];
  const child = (parent, name) => children(parent).find(box => box.type === name);
  const u32 = p => movie.getUint32(p), i32 = p => movie.getInt32(p);
  const version = box => movie.getUint8(box.data);
  const scale = box => u32(box.data + (version(box) === 1 ? 20 : 12));
  if (child(root, "mvex")) throw Error("Fragmented MP4 requires estimated stepping");
  const track = children(root).find(box => {
    if (box.type !== "trak") return false;
    const handler = child(child(box, "mdia"), "hdlr");
    return handler && fourCC(movie, handler.data + 8) === "vide";
  });
  const media = child(track, "mdia");
  const tables = child(child(media, "minf"), "stbl");
  const stts = child(tables, "stts"), ctts = child(tables, "ctts");
  if (!stts) throw Error("Video sample timing is unavailable");
  const mediaScale = scale(child(media, "mdhd"));
  const movieScale = scale(child(root, "mvhd"));
  if (!mediaScale || !movieScale) throw Error("Invalid timescale");

  function timingRows(box, signed = false) {
    if (!box) return [];
    const count = u32(box.data + 4);
    if (box.data + 8 + 8 * count > box.end) throw Error("Truncated sample timing table");
    return Array.from({length: count}, (_, i) => {
      const p = box.data + 8 + 8 * i;
      return [u32(p), signed ? i32(p + 4) : u32(p + 4)];
    });
  }
  const decode = timingRows(stts);
  const offsets = timingRows(ctts, !!ctts && version(ctts) === 1);
  const count = decode.reduce((total, row) => total + row[0], 0);
  if (!count || count > 5_000_000 || (ctts && offsets.reduce((total, row) => total + row[0], 0) !== count)) {
    throw Error("Video sample timing is incomplete or unsupported");
  }

  // An empty leading edit represents a delay. A regular edit can trim decoder preroll.
  const edit = child(child(track, "edts"), "elst");
  let delay = 0, firstMediaTime = 0, editEnd = Infinity;
  if (edit) {
    const wide = version(edit) === 1, width = wide ? 20 : 12;
    const edits = u32(edit.data + 4);
    if (edit.data + 8 + width * edits > edit.end) throw Error("Truncated video edit list");
    let seenMedia = false;
    for (let i = 0; i < edits; i++) {
      const p = edit.data + 8 + i * width;
      const length = wide ? Number(movie.getBigUint64(p)) : u32(p);
      const start = wide ? Number(movie.getBigInt64(p + 8)) : i32(p + 4);
      const rate = i32(p + width - 4);
      if (seenMedia || rate !== 65536 || start < -1) throw Error("Complex MP4 edit list");
      if (start === -1) delay += length / movieScale;
      else {
        seenMedia = true;
        firstMediaTime = start;
        editEnd = start + length * mediaScale / movieScale;
      }
    }
    if (!seenMedia) throw Error("MP4 has no playable edit");
  }

  const times = new Float64Array(count);
  let written = 0, decodeTime = 0, offsetRow = 0, remaining = offsets[0]?.[0] ?? 0;
  for (const [samples, duration] of decode) {
    for (let i = 0; i < samples; i++) {
      while (offsetRow < offsets.length && remaining === 0) remaining = offsets[++offsetRow]?.[0] ?? 0;
      const presentation = decodeTime + (offsets[offsetRow]?.[1] ?? 0);
      if (presentation >= firstMediaTime && presentation < editEnd) {
        times[written++] = delay + (presentation - firstMediaTime) / mediaScale;
      }
      decodeTime += duration;
      remaining--;
    }
  }
  if (!written) throw Error("No displayable frames");
  const sorted = times.subarray(0, written).sort();
  let unique = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[unique - 1]) sorted[unique++] = sorted[i];
  }
  return sorted.subarray(0, unique);
}

function frameAtTime(frames, time) {
  let lo = 0, hi = frames.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (frames[mid] <= time + 0.0000001) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}
