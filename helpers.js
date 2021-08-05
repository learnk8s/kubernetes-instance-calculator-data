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

function hash(s) {
  return s
  var a = 1,
    c = 0,
    h,
    o;
  if (s) {
    a = 0;
    for (h = s.length - 1; h >= 0; h--) {
      o = s.charCodeAt(h);
      a = ((a << 6) & 268435455) + o + (o << 14);
      c = a & 266338304;
      a = c !== 0 ? a ^ (c >> 21) : a;
    }
  }
  return a.toString(32);
}
