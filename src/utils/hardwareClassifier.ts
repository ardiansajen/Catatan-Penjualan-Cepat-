export interface HardwareClassification {
  brand: string;
  subBrand: string;
  category: string;
}

export const KNOWN_BRANDS = [
  'COLORFUL',
  'ASUS',
  'MSI',
  'INTEL',
  'AMD',
  'AOC',
  'PHILIPS',
  'GIGABYTE',
  'CORSAIR',
  'KINGSTON',
  'SAMSUNG',
  'SEASONIC',
  'DEEPCOOL',
  'NZXT',
  'ASROCK',
  'ZOTAC',
  'LAINNYA',
];

export const KNOWN_CATEGORIES = [
  'VGA / Graphic Card',
  'Motherboard',
  'Processor / CPU',
  'Monitor',
  'RAM / Memory',
  'SSD / Storage',
  'Power Supply (PSU)',
  'Casing / Case',
  'Cooler / Fan',
  'Aksesoris / Lainnya',
];

/**
 * Automatically classifies computer hardware products into Brand, Sub-Brand, and Category
 */
export function classifyHardware(productName: string): HardwareClassification {
  const text = productName.toLowerCase();

  let brand = 'LAINNYA';
  let subBrand = 'Standard';
  let category = 'Aksesoris / Lainnya';

  // ==========================================
  // 1. BRAND DETECTION
  // ==========================================
  if (
    text.includes('colorful') ||
    text.includes('igame') ||
    text.includes('colorfire') ||
    text.includes('battle-ax') ||
    text.includes('battleax') ||
    text.includes('vulcan') ||
    text.includes('neptune') ||
    text.includes('ultra w') ||
    text.includes('ultra oc')
  ) {
    brand = 'COLORFUL';
    if (text.includes('vulcan')) subBrand = 'iGame Vulcan';
    else if (text.includes('neptune')) subBrand = 'iGame Neptune';
    else if (text.includes('ultra w') || text.includes('ultra oc')) subBrand = 'iGame Ultra W';
    else if (text.includes('advanced')) subBrand = 'iGame Advanced';
    else if (text.includes('igame')) subBrand = 'iGame';
    else if (text.includes('battle-ax') || text.includes('battleax')) subBrand = 'Battle-AX';
    else if (text.includes('colorfire')) subBrand = 'Colorfire';
    else subBrand = 'Gaming Series';
  } else if (
    text.includes('asus') ||
    text.includes('rog') ||
    text.includes('tuf') ||
    text.includes('proart') ||
    text.includes('strix') ||
    text.includes('prime') ||
    text.includes('dual oc') ||
    text.includes('dual rtx')
  ) {
    brand = 'ASUS';
    if (text.includes('rog') || text.includes('strix')) subBrand = 'ROG / Strix';
    else if (text.includes('tuf')) subBrand = 'TUF Gaming';
    else if (text.includes('proart')) subBrand = 'ProArt';
    else if (text.includes('prime')) subBrand = 'Prime';
    else if (text.includes('dual')) subBrand = 'Dual Series';
    else subBrand = 'Standard';
  } else if (
    text.includes('msi') ||
    text.includes('mag') ||
    text.includes('mpg') ||
    text.includes('meg') ||
    text.includes('tomahawk') ||
    text.includes('ventus') ||
    text.includes('suprim') ||
    text.includes('gaming slim') ||
    text.includes('gaming x') ||
    text.includes('spatium')
  ) {
    brand = 'MSI';
    if (text.includes('tomahawk') || text.includes('mag')) subBrand = 'MAG / Tomahawk';
    else if (text.includes('suprim')) subBrand = 'Suprim';
    else if (text.includes('mpg')) subBrand = 'MPG';
    else if (text.includes('meg')) subBrand = 'MEG';
    else if (text.includes('ventus')) subBrand = 'Ventus';
    else if (text.includes('gaming x') || text.includes('gaming slim')) subBrand = 'Gaming X / Slim';
    else if (text.includes('spatium')) subBrand = 'Spatium';
    else if (text.includes('pro')) subBrand = 'PRO Series';
    else subBrand = 'Standard';
  } else if (
    text.includes('intel') ||
    text.includes('i9-') ||
    text.includes('i7-') ||
    text.includes('i5-') ||
    text.includes('i3-') ||
    /\bi[3579]\s*1[2345]\d{3}/.test(text) ||
    text.includes('core ultra') ||
    text.includes('arc a7') ||
    text.includes('arc a5')
  ) {
    brand = 'INTEL';
    if (text.includes('i9') || text.includes('14900') || text.includes('13900')) subBrand = 'Core i9';
    else if (text.includes('i7') || text.includes('14700') || text.includes('13700')) subBrand = 'Core i7';
    else if (text.includes('i5') || text.includes('14600') || text.includes('14400') || text.includes('13400')) subBrand = 'Core i5';
    else if (text.includes('i3') || text.includes('14100') || text.includes('13100')) subBrand = 'Core i3';
    else if (text.includes('ultra')) subBrand = 'Core Ultra';
    else if (text.includes('arc')) subBrand = 'Intel Arc';
    else subBrand = 'Processor Series';
  } else if (
    text.includes('amd') ||
    text.includes('ryzen') ||
    text.includes('radeon') ||
    text.includes('7800x3d') ||
    text.includes('7900x') ||
    text.includes('7950x') ||
    text.includes('7600x') ||
    text.includes('5700x') ||
    text.includes('9950x') ||
    text.includes('9900x') ||
    text.includes('9700x') ||
    text.includes('9600x')
  ) {
    brand = 'AMD';
    if (text.includes('ryzen 9') || text.includes('7900') || text.includes('7950') || text.includes('9900') || text.includes('9950')) subBrand = 'Ryzen 9';
    else if (text.includes('ryzen 7') || text.includes('7800') || text.includes('7700') || text.includes('5700') || text.includes('9700')) subBrand = 'Ryzen 7';
    else if (text.includes('ryzen 5') || text.includes('7600') || text.includes('7500') || text.includes('5600') || text.includes('9600')) subBrand = 'Ryzen 5';
    else if (text.includes('radeon') || text.includes('rx 7') || text.includes('rx 6')) subBrand = 'Radeon RX';
    else subBrand = 'Ryzen Series';
  } else if (text.includes('aoc') || text.includes('agon') || /\b2[47]g[24]/i.test(text)) {
    brand = 'AOC';
    if (text.includes('agon')) subBrand = 'AGON Pro';
    else subBrand = 'Gaming Series';
  } else if (text.includes('philips') || text.includes('evnia') || /\b2[47]m1/i.test(text)) {
    brand = 'PHILIPS';
    if (text.includes('evnia')) subBrand = 'Evnia Gaming';
    else subBrand = 'Consumer Series';
  } else if (
    text.includes('gigabyte') ||
    text.includes('aorus') ||
    text.includes('windforce') ||
    text.includes('aero') ||
    text.includes('eagle')
  ) {
    brand = 'GIGABYTE';
    if (text.includes('aorus')) subBrand = 'AORUS';
    else if (text.includes('aero')) subBrand = 'AERO';
    else if (text.includes('eagle')) subBrand = 'Eagle';
    else if (text.includes('windforce')) subBrand = 'Windforce';
    else subBrand = 'Gaming OC';
  } else if (
    text.includes('corsair') ||
    text.includes('vengeance') ||
    text.includes('dominator') ||
    text.includes('rm850') ||
    text.includes('rm750') ||
    text.includes('rm1000') ||
    text.includes('4000d')
  ) {
    brand = 'CORSAIR';
    if (text.includes('vengeance')) subBrand = 'Vengeance';
    else if (text.includes('dominator')) subBrand = 'Dominator';
    else subBrand = 'Series';
  } else if (
    text.includes('kingston') ||
    text.includes('fury') ||
    text.includes('renegade') ||
    text.includes('kc3000') ||
    text.includes('nv2') ||
    text.includes('nv3')
  ) {
    brand = 'KINGSTON';
    if (text.includes('renegade')) subBrand = 'Fury Renegade';
    else if (text.includes('beast') || text.includes('fury')) subBrand = 'Fury Beast';
    else subBrand = 'Value / KC';
  } else if (
    text.includes('samsung') ||
    text.includes('990 pro') ||
    text.includes('980 pro') ||
    text.includes('970 evo') ||
    text.includes('odyssey')
  ) {
    brand = 'SAMSUNG';
    subBrand = 'PRO / EVO Series';
  } else if (text.includes('seasonic') || text.includes('focus') || text.includes('prime gx')) {
    brand = 'SEASONIC';
    subBrand = 'Focus / Prime';
  } else if (
    text.includes('deepcool') ||
    text.includes('ak620') ||
    text.includes('ak400') ||
    text.includes('ag400') ||
    text.includes('lt720') ||
    text.includes('ls720')
  ) {
    brand = 'DEEPCOOL';
    subBrand = 'Cooling Series';
  } else if (
    text.includes('nzxt') ||
    text.includes('kraken') ||
    text.includes('h9 flow') ||
    text.includes('h7 flow') ||
    text.includes('h5 flow')
  ) {
    brand = 'NZXT';
    subBrand = 'H-Series / Kraken';
  } else if (
    text.includes('asrock') ||
    text.includes('taichi') ||
    text.includes('steel legend') ||
    text.includes('phantom gaming') ||
    text.includes('pro rs')
  ) {
    brand = 'ASROCK';
    subBrand = 'Steel Legend / PG';
  } else if (
    text.includes('zotac') ||
    text.includes('trinity') ||
    text.includes('twin edge') ||
    text.includes('amp extreme')
  ) {
    brand = 'ZOTAC';
    subBrand = 'Trinity / Twin Edge';
  }

  // ==========================================
  // 2. CATEGORY DETECTION
  // ==========================================
  // VGA / Graphic Card
  if (
    text.includes('rtx') ||
    text.includes('gtx') ||
    text.includes('geforce') ||
    text.includes('vga') ||
    text.includes('graphic card') ||
    text.includes('graphics card') ||
    text.includes('gpu') ||
    text.includes('radeon rx') ||
    /\b(5090|5080|5070|5060|4090|4080|4070|4060|3060)\b/.test(text) ||
    /\b(16g-v|12gb-v|8gb-v|24g-v|oc 16g|oc 12g|oc 8g)\b/.test(text)
  ) {
    category = 'VGA / Graphic Card';
  }
  // Motherboard
  else if (
    text.includes('motherboard') ||
    text.includes('mainboard') ||
    text.includes('mobo') ||
    /\b(b760|z790|z890|b650|x670|x870|b550|a620|h610|b450|lga1700|lga1851|am5|am4)\b/.test(text) ||
    text.includes('tomahawk') ||
    text.includes('wifi ddr5') ||
    text.includes('wifi ddr4')
  ) {
    category = 'Motherboard';
  }
  // Processor / CPU
  else if (
    text.includes('processor') ||
    text.includes('cpu') ||
    /\bi[3579]-1[234]\d{3}/.test(text) ||
    /\bi7-14700/i.test(text) ||
    /\b14700f\b/i.test(text) ||
    /\b13700f\b/i.test(text) ||
    /\b14600k\b/i.test(text) ||
    /\b14400f\b/i.test(text) ||
    /\b14900k\b/i.test(text) ||
    text.includes('7800x3d') ||
    text.includes('7900x') ||
    text.includes('7950x') ||
    text.includes('7600x') ||
    text.includes('5700x3d') ||
    text.includes('ryzen')
  ) {
    category = 'Processor / CPU';
  }
  // Monitor
  else if (
    text.includes('monitor') ||
    text.includes('display') ||
    text.includes('ultragear') ||
    text.includes('evnia') ||
    text.includes('agon') ||
    text.includes('hz') ||
    /\b2[47]g[24]/i.test(text) ||
    /\b2[47]m1/i.test(text) ||
    /\b(24"|27"|32"|34")\b/.test(text) ||
    text.includes('qhd ips') ||
    text.includes('fhd ips') ||
    text.includes('oled')
  ) {
    category = 'Monitor';
  }
  // RAM / Memory
  else if (
    text.includes('ram') ||
    text.includes('memory') ||
    text.includes('ddr5') ||
    text.includes('ddr4') ||
    /\b(6000mhz|5600mhz|5200mhz|3200mhz)\b/.test(text) ||
    /\b(16gbx2|32gb kit|2x16gb|2x32gb)\b/.test(text) ||
    text.includes('fury beast') ||
    (text.includes('vengeance') && !text.includes('casing'))
  ) {
    category = 'RAM / Memory';
  }
  // SSD / Storage
  else if (
    text.includes('ssd') ||
    text.includes('nvme') ||
    text.includes('m.2') ||
    text.includes('storage') ||
    text.includes('hdd') ||
    text.includes('harddisk') ||
    text.includes('hard disk') ||
    text.includes('990 pro') ||
    text.includes('980 pro') ||
    text.includes('kc3000') ||
    /\b(1tb nvme|2tb nvme|500gb nvme|1tb ssd|2tb ssd)\b/.test(text)
  ) {
    category = 'SSD / Storage';
  }
  // Power Supply (PSU)
  else if (
    text.includes('psu') ||
    text.includes('power supply') ||
    /\b(750w|850w|1000w|650w|550w|1200w)\b/.test(text) ||
    text.includes('gold full modular') ||
    text.includes('bronze power')
  ) {
    category = 'Power Supply (PSU)';
  }
  // Casing / Chassis
  else if (
    text.includes('casing') ||
    text.includes('case') ||
    text.includes('chassis') ||
    text.includes('mid tower') ||
    text.includes('aquarium') ||
    text.includes('flow rgb')
  ) {
    category = 'Casing / Case';
  }
  // Cooler / Fan
  else if (
    text.includes('cooler') ||
    text.includes('liquid cooler') ||
    text.includes('aio') ||
    text.includes('heatsink') ||
    text.includes('fan case') ||
    text.includes('kraken') ||
    text.includes('ak620') ||
    text.includes('360mm') ||
    text.includes('240mm')
  ) {
    category = 'Cooler / Fan';
  }

  // Cross-inference adjustments:
  // If brand is INTEL and text has no specific category, default is Processor / CPU
  if (brand === 'INTEL' && category === 'Aksesoris / Lainnya') {
    category = 'Processor / CPU';
  }
  // If brand is AOC or PHILIPS and category is not set, default is Monitor
  if ((brand === 'AOC' || brand === 'PHILIPS') && category === 'Aksesoris / Lainnya') {
    category = 'Monitor';
  }

  return {
    brand,
    subBrand,
    category,
  };
}
