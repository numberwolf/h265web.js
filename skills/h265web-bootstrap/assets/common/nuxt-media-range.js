// Local demo media only. Production media/CDNs should implement Range themselves.
import {createReadStream, existsSync, realpathSync, statSync} from 'node:fs';
import path from 'node:path';
import {defineEventHandler, sendStream, setResponseHeader, setResponseStatus} from 'h3';

export default defineEventHandler(event => {
  const pathname = new URL(event.node.req.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/demo-media/')) return;
  if (!['GET', 'HEAD'].includes(event.node.req.method)) { setResponseStatus(event, 405); return ''; }
  // The standalone Nitro entry lives beside ../public; dev runs from project root.
  const entry = process.argv[1] || '';
  const deployed = path.resolve(path.dirname(entry), '../public/media');
  const root = path.normalize(entry).split(path.sep).join('/').endsWith('/server/index.mjs') && existsSync(deployed)
    ? deployed : path.resolve('public/media');
  let name;
  try { name = decodeURIComponent(pathname.slice('/demo-media/'.length)); }
  catch { setResponseStatus(event, 400); return ''; }
  if (!name || name.includes('/') || name.includes('\\') || name === '..') {
    setResponseStatus(event, 404); return '';
  }
  const file = path.join(root, name);
  if (!existsSync(file) || !statSync(file).isFile() ||
      !realpathSync(file).startsWith(realpathSync(root) + path.sep)) {
    setResponseStatus(event, 404); return '';
  }
  const size = statSync(file).size;
  let start = 0, end = size - 1;
  const range = event.node.req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const valid = match && (match[1] || match[2]);
    if (valid && match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
    else if (valid) { start = Math.max(0, size - Number(match[2])); }
    if (!valid || size === 0 || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        start > end || start >= size || (!match[1] && Number(match[2]) === 0)) {
      setResponseStatus(event, 416); setResponseHeader(event, 'Content-Range', `bytes */${size}`); return '';
    }
    setResponseStatus(event, 206);
    setResponseHeader(event, 'Content-Range', `bytes ${start}-${end}/${size}`);
  }
  const types = {'.mp4': 'video/mp4', '.webm': 'video/webm', '.flv': 'video/x-flv', '.ts': 'video/mp2t'};
  setResponseHeader(event, 'Content-Type', types[path.extname(name).toLowerCase()] || 'application/octet-stream');
  setResponseHeader(event, 'Accept-Ranges', 'bytes');
  setResponseHeader(event, 'Content-Length', size ? end - start + 1 : 0);
  if (event.node.req.method === 'HEAD' || size === 0) { event.node.res.end(); return; }
  return sendStream(event, createReadStream(file, {start, end}));
});
