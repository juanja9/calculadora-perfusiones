// Prueba automática de la calculadora.
// Abre index.html en un navegador de tamaño móvil y comprueba los valores de referencia de CLAUDE.md.
// Uso: node tests/pruebas.js   (necesita Playwright; en GitHub lo instala el flujo .github/workflows/pruebas.yml)
const { chromium } = require('playwright');
const path = require('path');

const URL_APP = 'file://' + path.resolve(__dirname, '..', 'index.html');
const FARMACOS = ['na', 'vp', 'adr', 'at2', 'am', 'dob'];

// Valores de referencia a 70 kg con la dilución por defecto: [fármaco, dosis, ml/h esperados]
const REFERENCIA = [
  ['na', '0,1', '4,2'], ['vp', '0,03', '2,25'], ['adr', '0,1', '10,5'],
  ['at2', '20', '8,4'], ['am', '1', '70'], ['dob', '5', '4,2'],
];
// Aviso esperado para una dosis: info (neutro), ok (verde), warn (ámbar), bad (rojo)
const AVISOS_DOSIS = [
  ['na', '0,29', 'info'], ['na', '0,5', 'info'], ['na', '0,51', 'warn'], ['na', '1', 'warn'], ['na', '1,01', 'bad'],
  ['adr', '0,5', 'info'], ['adr', '0,51', 'warn'], ['adr', '1', 'warn'], ['adr', '1,01', 'bad'],
  ['vp', '0,03', 'ok'], ['vp', '0,031', 'warn'],
  ['at2', '40', 'ok'], ['at2', '41', 'warn'], ['at2', '80', 'warn'], ['at2', '81', 'bad'],
  ['am', '1', 'ok'], ['am', '1,1', 'warn'],
  ['dob', '20', 'ok'], ['dob', '21', 'warn'],
];
// Modo «ml/h → dosis»: [fármaco, peso, ml/h, dosis mostrada, aviso]. El aviso debe coincidir con la cifra mostrada.
const AVISOS_RITMO = [
  ['vp', null, '2,25', '0,03', 'ok'], ['vp', null, '0,75', '0,01', 'ok'], ['vp', null, '2,26', '0,03', 'warn'],
  ['na', '57', '34,2', '1', 'warn'], ['na', '57', '34,3', '1,003', 'bad'],
  ['na', '70', '21', '0,5', 'info'], ['na', '70', '42', '1', 'warn'],
  ['adr', '70', '52,5', '0,5', 'info'], ['at2', '70', '33,6', '80', 'warn'], ['at2', '70', '33,7', '80,238', 'bad'],
];
// Peso: [valor, ¿se puede calcular?, ¿aparece aviso de peso alto?]
const PESOS = [['', false, false], ['0', false, false], ['70', true, false], ['150', true, false],
  ['151', true, true], ['200', true, true], ['201', false, true]];

const fallos = [];
let comprobaciones = 0;
function comprobar(ok, texto) { comprobaciones++; if (!ok) fallos.push(texto); }

(async () => {
  // En GitHub se usa el Chrome que ya trae la máquina (NAVEGADOR=chrome); en local, el de Playwright
  const navegador = await chromium.launch(process.env.NAVEGADOR ? { channel: process.env.NAVEGADOR } : {});
  for (const tema of ['light', 'dark']) {
    const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, colorScheme: tema });
    const p = await ctx.newPage();
    p.on('pageerror', e => fallos.push(`Error de la página (${tema}): ${e.message}`));
    // La página no debe pedir nada a servidores externos
    p.on('request', r => { if (/^https?:/.test(r.url())) fallos.push(`Petición externa (${tema}): ${r.url()}`); });
    await p.goto(URL_APP);

    const elegir = id => p.click(`#drugs button[data-id=${id}]`);
    const volver = async () => { await p.click('#back'); await p.waitForFunction(() => !document.getElementById('s1').hidden); };
    const boton = () => p.$eval('#go', e => ({ texto: e.textContent, bloqueado: e.disabled }));
    const desborde = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const aviso = () => p.$eval('#result .status', e => e.className.replace('status', '').trim());
    const cifra = () => p.$eval('#result .big', e => e.firstChild.textContent.trim());

    // 1. El peso empieza vacío y bloquea el cálculo, salvo en vasopresina
    comprobar(await p.inputValue('#weight') === '', `${tema}: el peso no empieza vacío`);
    comprobar((await boton()).bloqueado, `${tema}: se puede calcular sin peso`);
    await elegir('vp');
    comprobar(!(await boton()).bloqueado, `${tema}: la vasopresina pide peso`);
    await elegir('na');

    // 2. Valores de referencia a 70 kg, sin desplazamiento horizontal
    await p.fill('#weight', '70');
    for (const [id, dosis, esperado] of REFERENCIA) {
      await elegir(id);
      comprobar(await desborde() <= 0, `${tema} ${id}: desplazamiento horizontal en la primera pantalla`);
      await p.click('#go'); await p.click('#m-dose'); await p.fill('#value', dosis);
      const r = await cifra();
      comprobar(r === esperado, `${tema} ${id}: ${dosis} a 70 kg da ${r} ml/h y debería dar ${esperado}`);
      comprobar(await desborde() <= 0, `${tema} ${id}: desplazamiento horizontal en la pantalla de resultado`);
      await volver();
    }

    if (tema === 'light') {
      // 3. Avisos según la dosis
      for (const [id, dosis, esperado] of AVISOS_DOSIS) {
        await elegir(id); await p.click('#go'); await p.click('#m-dose'); await p.fill('#value', dosis);
        const a = await aviso();
        comprobar(a === esperado, `${id} ${dosis}: aviso «${a}» y debería ser «${esperado}»`);
        await volver();
      }
      // 4. Modo «ml/h → dosis»: cifra y aviso coherentes
      for (const [id, kg, ritmo, dosis, esperado] of AVISOS_RITMO) {
        await elegir(id); if (kg) await p.fill('#weight', kg);
        await p.click('#go'); await p.click('#m-rate'); await p.fill('#value', ritmo);
        const d = await cifra(), a = await aviso();
        comprobar(d === dosis, `${id} ${kg || '-'} kg ${ritmo} ml/h: muestra ${d} y debería mostrar ${dosis}`);
        comprobar(a === esperado, `${id} ${kg || '-'} kg ${ritmo} ml/h: aviso «${a}» y debería ser «${esperado}»`);
        await p.click('#m-dose'); await volver();
      }
      // 5. Límites de peso
      await elegir('na');
      for (const [kg, calcula, avisa] of PESOS) {
        await p.fill('#weight', kg);
        comprobar((await boton()).bloqueado === !calcula, `peso «${kg}»: ${calcula ? 'debería dejar calcular' : 'debería bloquear'}`);
        comprobar(await p.$eval('#wErr', e => !e.hidden) === avisa, `peso «${kg}»: aviso de peso alto incorrecto`);
      }
      // 6. Con más de 150 kg el resultado lleva un aviso rojo de peso
      await p.fill('#weight', '160'); await p.click('#go');
      comprobar(await p.$$eval('#result .status.bad', e => e.some(x => x.textContent.includes('Peso de 160 kg'))), 'peso 160 kg: falta el aviso rojo en el resultado');
      await volver(); await p.fill('#weight', '70');
      // 7. «Cambiar» vuelve a la primera pantalla al primer toque aunque la dirección lleve #calculo
      const q = await ctx.newPage();
      await q.goto(URL_APP + '#calculo'); await q.fill('#weight', '70'); await q.click('#go'); await q.click('#back');
      await q.waitForTimeout(300);
      comprobar(await q.$eval('#s1', e => !e.hidden), '«Cambiar» no vuelve a la primera pantalla al primer toque');
      await q.close();
    }
    comprobar(await p.evaluate(() => document.fonts.ready.then(() => document.fonts.check('800 28px Archivo') && [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Archivo' && f.status === 'loaded'))), `${tema}: la tipografía Archivo incrustada no se ha cargado`);
    comprobar(FARMACOS.length === await p.$$eval('#drugs button', b => b.length), `${tema}: ha cambiado el número de fármacos`);
    await ctx.close();
  }
  await navegador.close();

  if (fallos.length) {
    console.error(`FALLAN ${fallos.length} de ${comprobaciones} comprobaciones:`);
    fallos.forEach(f => console.error(' - ' + f));
    process.exit(1);
  }
  console.log(`Correcto: ${comprobaciones} comprobaciones superadas.`);
})().catch(e => { console.error('La prueba no ha podido ejecutarse:', e); process.exit(1); });
