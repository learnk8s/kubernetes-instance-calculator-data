module.exports = {
  binary2si,
  si2binary,
  reservedKubeletMemory,
  reservedFromCores,
  GB2MB,
  hash,
};

function binary2si(value) {
  if (typeof value === "number") {
    return 1.024 * value;
  }
  return value.type === "binary" ? binary2si(value.value) : value.value;
}

function si2binary(value) {
  if (typeof value === "number") {
    return value / 1.024;
  }
  return value.type === "si" ? si2binary(value.value) : value.value;
}

function reservedKubeletMemory(memory) {
  if (memory < 1) {
    return { value: 0, type: "binary" };
  }
  const memoryInBinaryNotation = si2binary(memory);
  let reservedMemory = 255;
  if (memoryInBinaryNotation > 1000) {
    reservedMemory += 0.25 * Math.min(memoryInBinaryNotation, 4000);
  }
  if (memoryInBinaryNotation > 4000) {
    reservedMemory += 0.2 * Math.min(memoryInBinaryNotation - 4000, 8000);
  }
  if (memoryInBinaryNotation > 8000) {
    reservedMemory += 0.1 * Math.min(memoryInBinaryNotation - 8000, 16000);
  }
  if (memoryInBinaryNotation > 16000) {
    reservedMemory += 0.06 * Math.min(memoryInBinaryNotation - 16000, 128000);
  }
  if (memoryInBinaryNotation > 128000) {
    reservedMemory += 0.02 * (memoryInBinaryNotation - 128000);
  }
  return { value: reservedMemory, type: "binary" };
}

function reservedFromCores(cores) {
  if (cores < 1) {
    return 0;
  }
  let reservedCpu = 1000 * 0.06;
  if (cores > 1) {
    reservedCpu += 1000 * 0.01;
  }
  if (cores > 2) {
    reservedCpu += Math.min(cores - 2, 4) * 1000 * 0.005;
  }
  if (cores > 4) {
    reservedCpu += (cores - 4) * 1000 * 0.0025;
  }
  return reservedCpu;
}

function GB2MB(GB) {
  return GB * 1000;
}

function hash(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(32);
}
