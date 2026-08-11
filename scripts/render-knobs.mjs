/*
 * Studio product renders, straight from the CAD.
 *
 * WHY NOT AN AI IMAGE GENERATOR
 *
 * The thing being sold is a part with a tolerance budget. A generated image of
 * "a Civic HVAC knob" is a plausible knob, not THIS knob — the width would be
 * wrong, the crown would be wrong, and the glyph would be whatever the model
 * felt like drawing rather than the profile that gets carved. Every render here
 * comes out of design/knob_model.py, so the photograph and the printed part are
 * the same geometry by construction. When the glyph changes in the picker, the
 * customer is looking at the mesh that will be sliced.
 *
 * It is also the only honest option: we have no photography yet, and a
 * generated "product photo" of a part that has never been printed would be a
 * picture of something that does not exist.
 *
 * HOW
 *
 * Three.js in headless Chromium (the repo already drives Playwright for QA).
 * A three-point rig — key, fill, rim — over a transparent background, so the
 * PNGs composite onto the site's dark surfaces without a matte line. One hero
 * three-quarter perspective, plus true orthographic front / side / top, which
 * are the views the engineering drawing already uses.
 *
 * Run:  node scripts/render-knobs.mjs
 *
 * Any --flag value pairs are forwarded straight to knob_model.py, so a set of
 * caliper readings goes to finished renders in one command rather than a
 * source edit followed by two more:
 *
 *   node scripts/render-knobs.mjs --width 14.2 --height 12.0 --depth 9.4
 *
 * Forwarded blind on purpose — knob_model.py owns the dimension list and its
 * validation, and duplicating either here is how the two drift apart.
 */

import { chromium } from "playwright";
import { chromeExecutable } from "./browser.mjs";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const GLYPHS = ["classic", "cross", "chevron", "hex", "crosshair", "diamond", "spade", "skull"];
const VIEWS = ["hero", "front", "side", "top"];
const OUT = "public/renders";
const TMP = fs.mkdtempSync("/tmp/nla-render-");
const SIZE = 1100;
// Render mesh resolution. Far above what gets printed — this one is being
// photographed, and the carve edges alias badly below ~200 sections.
const RES = 200;

fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// 1. Meshes, straight from the parametric model
// ---------------------------------------------------------------------------
const DIM_ARGS = process.argv.slice(2);
console.log(`generating meshes at res=${RES}`);
execFileSync(
  "python3",
  ["design/knob_model.py", "--all", "--res", String(RES), "--out", `${TMP}/k`, ...DIM_ARGS],
  { stdio: "inherit" }
);

// ---------------------------------------------------------------------------
// 2. A static server. ES modules will not load over file:// — Chrome blocks the
//    cross-origin request — so three.js and the OBJs are served over HTTP.
// ---------------------------------------------------------------------------
// The whole build directory, not just the entry point: since 0.15x,
// three.module.js is a thin re-export of three.core.js, so serving only the
// named file gives the browser a module that 404s on its own first import.
const THREE_DIR = "node_modules/three/build";
const server = createServer((req, res) => {
  const url = req.url.split("?")[0];
  if (url.endsWith(".js") && !url.startsWith("/mesh/")) {
    const file = path.join(THREE_DIR, path.basename(url));
    if (fs.existsSync(file)) {
      res.writeHead(200, { "content-type": "text/javascript" });
      return res.end(fs.readFileSync(file));
    }
  }
  if (url.startsWith("/mesh/")) {
    const file = path.join(TMP, path.basename(url.slice(6)));
    if (fs.existsSync(file)) {
      res.writeHead(200, { "content-type": "text/plain" });
      return res.end(fs.readFileSync(file));
    }
  }
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end("<!doctype html><html><body style='margin:0'></body></html>");
  }
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// ---------------------------------------------------------------------------
// 3. Render
// ---------------------------------------------------------------------------
const browser = await chromium.launch({
  executablePath: chromeExecutable(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
page.on("console", (m) => m.type() === "error" && console.log("  page error:", m.text()));
await page.goto(BASE + "/");

await page.evaluate(
  async ({ base, size }) => {
    const THREE = await import(base + "/three.module.js");
    window.THREE = THREE;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(size, size, false);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    /* Three-point rig, in the studio sense rather than the WebGL-demo sense.
       KEY at 3/4 front-left establishes the form and casts the shadow. FILL
       opposite and much weaker opens the shadow side without flattening it.
       RIM behind and high separates the silhouette from the background — which
       is doing most of the work here, because the part is near-black on a
       transparent background and would otherwise read as a hole. */
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-42, 54, -46);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 200;
    key.shadow.camera.left = -30;
    key.shadow.camera.right = 30;
    key.shadow.camera.top = 30;
    key.shadow.camera.bottom = -30;
    key.shadow.bias = -0.0012;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d4e4, 0.8);
    fill.position.set(50, 14, -32);
    scene.add(fill);

    /* Warm and BEHIND the part relative to the camera, which now sits on the
       front. Held to 1.5: at 3.0 it stopped reading as an edge highlight on
       black plastic and started reading as gold paint on the crown. */
    const rim = new THREE.DirectionalLight(0xffe2b8, 1.5);
    rim.position.set(14, 30, 52);
    scene.add(rim);

    scene.add(new THREE.HemisphereLight(0x8899aa, 0x14161a, 0.5));

    window.__scene = { THREE, renderer, scene };
  },
  { base: BASE, size: SIZE }
);

async function renderOne(glyph, view) {
  await page.evaluate(
    async ({ base, glyph, view, size }) => {
      const { THREE, renderer, scene } = window.__scene;

      // Swap the mesh, keeping the rig identical across every render so the
      // set reads as one shoot rather than eight separate ones.
      if (window.__mesh) {
        scene.remove(window.__mesh);
        window.__mesh.geometry.dispose();
      }
      if (window.__ground) scene.remove(window.__ground);

      const text = await (await fetch(`${base}/mesh/k-${glyph}.obj`)).text();
      const verts = [];
      const faces = [];
      for (const line of text.split("\n")) {
        if (line.startsWith("v ")) {
          const [, x, y, z] = line.split(/\s+/);
          verts.push(+x, +y, +z);
        } else if (line.startsWith("f ")) {
          const [, a, b, c] = line.split(/\s+/);
          faces.push(+a - 1, +b - 1, +c - 1);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      geo.setIndex(faces);
      geo.computeVertexNormals();
      geo.center();

      const mat = new THREE.MeshStandardMaterial({
        color: 0x1c1e22,        // matte black PETG, the default finish
        roughness: 0.58,
        metalness: 0.03,
        flatShading: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      scene.add(mesh);
      window.__mesh = mesh;

      // A shadow catcher only on the hero. The orthographic views are drawings
      // with lighting, not scenes, and a cast shadow in a front elevation is
      // just noise over the thing being measured.
      if (view === "hero") {
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(400, 400),
          new THREE.ShadowMaterial({ opacity: 0.42 })
        );
        ground.rotation.x = -Math.PI / 2;
        geo.computeBoundingBox();
        ground.position.y = geo.boundingBox.min.y - 0.15;
        ground.receiveShadow = true;
        scene.add(ground);
        window.__ground = ground;
      }

      /* Frame off the mesh's own bounding sphere rather than a hand-tuned
         radius. Every glyph has the same envelope today, but a hardcoded
         distance silently crops the moment one does not — and a render set
         where one image is scaled differently reads as a mistake even when
         nobody can say why. PAD leaves breathing room at the edges. */
      geo.computeBoundingSphere();
      const R0 = geo.boundingSphere.radius;
      const PAD = 1.35;
      let cam;
      if (view === "hero") {
        const fov = 28;
        const dist = (R0 * PAD) / Math.sin((fov * Math.PI) / 360);
        cam = new THREE.PerspectiveCamera(fov, 1, dist * 0.1, dist * 4);
        // -Z, not +Z. z_front() is the small-z side, which is the face the
        // glyph is carved into — a camera at +Z photographs the blank back.
        const dir = new THREE.Vector3(-0.58, 0.42, -0.90).normalize();
        cam.position.copy(dir.multiplyScalar(dist));
        cam.lookAt(0, 0, 0);
      } else {
        // True orthographic, matching the third-angle projection in
        // design/hvac-slider-knob-orthographic.svg.
        const h = R0 * PAD;
        const d = R0 * 4;
        cam = new THREE.OrthographicCamera(-h, h, h, -h, 0.1, d * 3);
        if (view === "front") cam.position.set(0, 0, -d);
        if (view === "side") cam.position.set(-d, 0, 0);
        if (view === "top") cam.position.set(0, d, 0.001);
        cam.lookAt(0, 0, 0);
      }
      cam.updateProjectionMatrix();
      renderer.setSize(size, size, false);
      renderer.render(scene, cam);
    },
    { base: BASE, glyph, view, size: SIZE }
  );

  const buf = await page.evaluate(() =>
    window.__scene.renderer.domElement.toDataURL("image/png")
  );
  const file = `${OUT}/knob-${glyph}-${view}.png`;
  fs.writeFileSync(file, Buffer.from(buf.split(",")[1], "base64"));
  return file;
}

let n = 0;
for (const glyph of GLYPHS) {
  const sizes = [];
  for (const view of VIEWS) {
    const f = await renderOne(glyph, view);
    sizes.push(`${view} ${(fs.statSync(f).size / 1024).toFixed(0)}k`);
    n++;
  }
  console.log(`  ${glyph.padEnd(10)} ${sizes.join("  ")}`);
}

await browser.close();
server.close();
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${n} renders -> ${OUT}/`);
