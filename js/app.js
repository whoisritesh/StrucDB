const state = {
  viewer: null,
  rightViewer: null,
  rightAfModel: null,
  rawPdbText: null,
  rawAfText: null,
  rawLocalText: null,
  rawLocalFormat: 'pdb',
  uniprotId: null,
  sequence: "",
  pdbList: [],
  selectedPdbId: null,
  pdbModel: null,
  afModel: null,
  localModel: null,
  localMeta: null,
  layerMode: "both",
  repStyle: "cartoon",
  colorMode: "source",
  showSurface: false,
  plddtScores: [],
  alignedRmsd: null,
  focusedResidue: null,     // { unpPos, pdbResi, chain, aa }
  activeLabel: null,
  interfaceContacts: [],    // [{ chain1, resn1, resi1, atom1, xyz1, chain2, resn2, resi2, atom2, xyz2, dist }]
  selectedContactIdx: null
};

const AA3_TO_1 = {
  ALA: "A", ARG: "R", ASN: "N", ASP: "D", CYS: "C",
  GLN: "Q", GLU: "E", GLY: "G", HIS: "H", ILE: "I",
  LEU: "L", LYS: "K", MET: "M", PHE: "F", PRO: "P",
  SER: "S", THR: "T", TRP: "W", TYR: "Y", VAL: "V",
  MSE: "M", SEC: "U", PYL: "O"
};

const CHAIN_PALETTE = [
  "#1d4ed8", "#0f766e", "#b45309", "#7c3aed",
  "#be123c", "#0369a1", "#15803d", "#c2410c"
];

const el = {
  form: document.getElementById("search-form"),
  input: document.getElementById("query-input"),
  fileInput: document.getElementById("local-file-input"),
  uploadBtn: document.getElementById("upload-trigger-btn"),
  dropZone: document.getElementById("drop-zone"),
  dropOverlay: document.getElementById("drop-overlay"),
  localCard: document.getElementById("local-file-card"),
  localFilename: document.getElementById("local-filename"),
  localFileDetails: document.getElementById("local-file-details"),
  localBfactorRole: document.getElementById("local-bfactor-role"),
  clearLocalBtn: document.getElementById("clear-local-btn"),
  presets: document.querySelectorAll(".preset-chip"),
  status: document.getElementById("record-status"),
  title: document.getElementById("protein-title"),
  organism: document.getElementById("protein-organism"),
  metaLabel1: document.getElementById("meta-label-1"),
  metaLabel2: document.getElementById("meta-label-2"),
  metaLabel4: document.getElementById("meta-label-4"),
  metaUniprot: document.getElementById("meta-uniprot"),
  metaGene: document.getElementById("meta-gene"),
  metaLength: document.getElementById("meta-length"),
  metaAfdb: document.getElementById("meta-afdb"),
  funcDesc: document.getElementById("protein-function"),
  pdbCount: document.getElementById("pdb-count"),
  pdbTbody: document.getElementById("pdb-tbody"),
  layerBtns: document.querySelectorAll("#layer-mode .seg-btn"),
  repSelect: document.getElementById("rep-select"),
  colorSelect: document.getElementById("color-select"),
  hideDisorderedToggle: document.getElementById("hide-disordered-toggle"),
  surfaceToggle: document.getElementById("surface-toggle"),
  spinToggle: document.getElementById("spin-toggle"),
  paneRight: document.getElementById("pane-right"),
  splitRightTag: document.getElementById("split-right-tag"),
  resetBtn: document.getElementById("reset-view-btn"),
  snapshotBtn: document.getElementById("snapshot-btn"),
  exportPmlBtn: document.getElementById("export-pml-btn"),
  legendPdb: document.getElementById("legend-pdb-label"),
  legendAf: document.getElementById("legend-af-label"),
  hoverReadout: document.getElementById("hover-readout"),
  loader: document.getElementById("loader-banner"),
  loaderText: document.getElementById("loader-text"),
  seqRibbon: document.getElementById("sequence-ribbon"),
  seqSelection: document.getElementById("seq-selection"),
  clearFocusBtn: document.getElementById("clear-focus-btn"),
  meanPlddt: document.getElementById("mean-plddt"),
  barVhigh: document.getElementById("bar-vhigh"),
  barConf: document.getElementById("bar-conf"),
  barLow: document.getElementById("bar-low"),
  barVlow: document.getElementById("bar-vlow"),
  pctVhigh: document.getElementById("pct-vhigh"),
  pctConf: document.getElementById("pct-conf"),
  pctLow: document.getElementById("pct-low"),
  pctVlow: document.getElementById("pct-vlow"),
  contactCount: document.getElementById("contact-count"),
  contactCutoffSelect: document.getElementById("contact-cutoff-select"),
  exportContactsBtn: document.getElementById("export-contacts-btn"),
  highlightInterfaceToggle: document.getElementById("highlight-interface-toggle"),
  contactTbody: document.getElementById("contact-tbody"),
  paeCanvas: document.getElementById("pae-canvas"),
  dlPdb: document.getElementById("dl-pdb"),
  dlAfPdb: document.getElementById("dl-af-pdb"),
  dlAfCif: document.getElementById("dl-af-cif"),
  dlUniprot: document.getElementById("dl-uniprot")
};

function initViewer() {
  state.viewer = $3Dmol.createViewer("mol-viewer", {
    backgroundColor: 0xffffff,
    antialias: true
  });
  state.rightViewer = $3Dmol.createViewer("mol-viewer-right", {
    backgroundColor: 0xffffff,
    antialias: true
  });

  // Synchronize camera orientation & zoom between Left (PDB) and Right (AF/Local) panes
  let activeDriver = null;
  let lastViewStr = "";

  document.getElementById("pane-left").addEventListener("pointerdown", () => { activeDriver = "left"; });
  document.getElementById("pane-left").addEventListener("wheel", () => { activeDriver = "left"; }, { passive: true });
  document.getElementById("pane-right").addEventListener("pointerdown", () => { activeDriver = "right"; });
  document.getElementById("pane-right").addEventListener("wheel", () => { activeDriver = "right"; }, { passive: true });

  state.viewer.setSlab(-250, 250);
  state.rightViewer.setSlab(-250, 250);

  function syncSplitCameras() {
    if ((state.layerMode === "split") && state.viewer && state.rightViewer) {
      if (activeDriver === "right") {
        const v = state.rightViewer.getView();
        const s = v.join(",");
        if (s !== lastViewStr) {
          lastViewStr = s;
          state.viewer.setView(v);
          state.viewer.setSlab(-250, 250);
          state.viewer.setSlab(-250, 250);
  state.viewer.render();
        }
      } else {
        const v = state.viewer.getView();
        const s = v.join(",");
        if (s !== lastViewStr) {
          lastViewStr = s;
          state.rightViewer.setView(v);
          state.rightViewer.setSlab(-250, 250);
          state.rightViewer.setSlab(-250, 250);
    state.rightViewer.render();
        }
      }
    }
    requestAnimationFrame(syncSplitCameras);
  }
  requestAnimationFrame(syncSplitCameras);
}

function setLoading(isLoading, text = "Fetching structural data...") {
  el.loader.hidden = !isLoading;
  el.loaderText.textContent = text;
}

async function resolveIdentifier(rawQuery) {
  const q = rawQuery.trim().toUpperCase();
  if (!q) return null;

  if (/^[0-9][A-Z0-9]{3}$/.test(q)) {
    const mapRes = await fetch(`https://www.ebi.ac.uk/pdbe/api/mappings/uniprot/${q.toLowerCase()}`);
    if (mapRes.ok) {
      const mapData = await mapRes.json();
      const uniprotEntries = mapData[q.toLowerCase()]?.UniProt;
      if (uniprotEntries) {
        const firstAcc = Object.keys(uniprotEntries)[0];
        return { uniprotId: firstAcc, preferredPdb: q };
      }
    }
    return { uniprotId: null, preferredPdb: q };
  }

  if (/^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/.test(q)) {
    return { uniprotId: q, preferredPdb: null };
  }

  const searchUrl = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(rawQuery)}&format=json&size=1`;
  const res = await fetch(searchUrl);
  if (res.ok) {
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return { uniprotId: data.results[0].primaryAccession, preferredPdb: null };
    }
  }
  return null;
}

async function loadProteinRecord(rawQuery) {
  setLoading(true, `Resolving "${rawQuery}"...`);
  el.status.textContent = "Loading";
  el.status.className = "status-badge warn";

  clearLocalState(false);
  clearResidueFocus(false);

  try {
    const resolved = await resolveIdentifier(rawQuery);
    if (!resolved) {
      throw new Error(`No matching UniProt or PDB entry found for "${rawQuery}".`);
    }

    state.uniprotId = resolved.uniprotId;
    state.selectedPdbId = resolved.preferredPdb;
    state.pdbList = [];
    state.plddtScores = [];
    state.alignedRmsd = null;

    if (state.uniprotId) {
      await fetchUniProtMetadata(state.uniprotId);
      await fetchPdbeBestStructures(state.uniprotId);
    }

    if (!state.selectedPdbId && state.pdbList.length > 0) {
      state.selectedPdbId = state.pdbList[0].pdb_id.toUpperCase();
    }

    renderPdbTable();
    await loadStructuresIntoViewport();

    el.status.textContent = "Synced";
    el.status.className = "status-badge";
  } catch (err) {
    console.error(err);
    el.status.textContent = "Not Found";
    el.status.className = "status-badge warn";
    el.title.textContent = "Record not found";
    el.funcDesc.textContent = err.message;
  } finally {
    setLoading(false);
  }
}

async function fetchUniProtMetadata(acc) {
  const res = await fetch(`https://rest.uniprot.org/uniprotkb/${acc}.json`);
  if (!res.ok) throw new Error(`UniProtKB lookup failed for ${acc}`);
  const data = await res.json();

  const proteinName =
    data.proteinDescription?.recommendedName?.fullName?.value ||
    data.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
    acc;

  const organism = data.organism?.scientificName || "Unknown organism";
  const taxId = data.organism?.taxonId ? `TaxID ${data.organism.taxonId}` : "";
  const geneName = data.genes?.[0]?.geneName?.value || "—";
  const seq = data.sequence?.value || "";
  const funcComment =
    data.comments?.find((c) => c.commentType === "FUNCTION")?.texts?.[0]?.value ||
    "No curated functional summary available in UniProtKB.";

  state.sequence = seq;

  el.metaLabel1.textContent = "UniProtKB";
  el.metaLabel2.textContent = "Gene";
  el.metaLabel4.textContent = "AFDB Model";

  el.title.textContent = proteinName;
  el.organism.textContent = `${organism} · ${taxId}`;
  el.metaUniprot.textContent = acc;
  el.metaGene.textContent = geneName;
  el.metaLength.textContent = `${seq.length} aa`;
  el.metaAfdb.textContent = `AF-${acc}-F1`;

  setLink(el.dlUniprot, `https://www.uniprot.org/uniprotkb/${acc}/entry`);
  el.funcDesc.textContent = funcComment;
}

async function fetchPdbeBestStructures(acc) {
  try {
    const res = await fetch(`https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${acc}`);
    if (!res.ok) {
      state.pdbList = [];
      return;
    }
    const data = await res.json();
    const rawList = data[acc] || [];

    const seen = new Map();
    for (const item of rawList) {
      const id = item.pdb_id.toUpperCase();
      if (!seen.has(id)) {
        seen.set(id, item);
      }
    }
    state.pdbList = Array.from(seen.values());
  } catch {
    state.pdbList = [];
  }
}

function renderPdbTable() {
  el.pdbCount.textContent = state.pdbList.length;

  if (state.pdbList.length === 0) {
    el.pdbTbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-cell">No experimental PDB structures.</td>
      </tr>`;
    return;
  }

  el.pdbTbody.innerHTML = state.pdbList
    .slice(0, 40)
    .map((entry) => {
      const id = entry.pdb_id.toUpperCase();
      const method = (entry.experimental_method || "—")
        .replace("X-ray diffraction", "X-Ray")
        .replace("Electron Microscopy", "Cryo-EM")
        .replace("Solution NMR", "NMR");
      const res = entry.resolution ? `${Number(entry.resolution).toFixed(2)} Å` : "—";
      const span = `${entry.unp_start}–${entry.unp_end}`;
      const isSelected = id === state.selectedPdbId ? "selected" : "";

      return `
        <tr data-pdb="${id}" class="${isSelected}">
          <td class="pdb-id-cell">${id}</td>
          <td>${method}</td>
          <td class="mono">${res}</td>
          <td class="mono">${span}</td>
        </tr>`;
    })
    .join("");

  el.pdbTbody.querySelectorAll("tr[data-pdb]").forEach((row) => {
    row.addEventListener("click", async () => {
      state.selectedPdbId = row.dataset.pdb;
      clearResidueFocus(false);
      renderPdbTable();
      await loadStructuresIntoViewport();
    });
  });
}

function stripWaters(pdbText) {
  return pdbText
    .split("\n")
    .filter((line) => !(line.startsWith("HETATM") && line.slice(17, 20).trim() === "HOH"))
    .join("\n");
}

async function loadStructuresIntoViewport() {
  setLoading(true, "Downloading 3D coordinates...");
  state.viewer.removeAllModels();
  state.viewer.removeAllSurfaces();
  state.viewer.removeAllLabels();
  state.viewer.removeAllShapes();
  state.pdbModel = null;
  state.afModel = null;
  state.localModel = null;
  state.rightAfModel = null;
  state.rawPdbText = null;
  state.rawAfText = null;
  state.alignedRmsd = null;
  state.interfaceContacts = [];
  state.selectedContactIdx = null;

  const tasks = [];

  if (state.selectedPdbId) {
    const pdbUrl = `https://files.rcsb.org/download/${state.selectedPdbId}.pdb`;
    setLink(el.dlPdb, pdbUrl);
    tasks.push(
      fetch(pdbUrl)
        .then((r) => (r.ok ? r.text() : null))
        .then((pdbText) => {
          if (pdbText) {
            state.rawPdbText = stripWaters(pdbText);
            state.pdbModel = state.viewer.addModel(state.rawPdbText, "pdb");
          }
        })
        .catch(() => null)
    );
  } else {
    setLink(el.dlPdb, null);
  }

  if (state.uniprotId) {
    tasks.push(
      fetch(`https://alphafold.ebi.ac.uk/api/prediction/${state.uniprotId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(async (afEntries) => {
          if (!afEntries || afEntries.length === 0) {
            setLink(el.dlAfPdb, null);
            setLink(el.dlAfCif, null);
            return;
          }
          const entry = afEntries[0];
          setLink(el.dlAfPdb, entry.pdbUrl);
          setLink(el.dlAfCif, entry.cifUrl);

          const [afPdbText, paeData] = await Promise.all([
            fetch(entry.pdbUrl).then((r) => (r.ok ? r.text() : null)),
            entry.paeDocUrl
              ? fetch(entry.paeDocUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null)
              : Promise.resolve(null)
          ]);

          if (afPdbText) {
            state.rawAfText = afPdbText;
            state.afModel = state.viewer.addModel(afPdbText, "pdb");
            extractPlddtFromModel(state.afModel);

            // Backfill sequence, length, and metadata from AlphaFold entry when UniProtKB is merged/empty (e.g., Q6K243)
            const afCas = state.afModel.selectedAtoms({ atom: "CA", hetflag: false });
            if (!state.sequence && afCas.length > 0) {
              const seenRes = new Set();
              const seqChars = [];
              for (const a of afCas) {
                const k = `${a.chain}:${a.resi}`;
                if (!seenRes.has(k)) {
                  seenRes.add(k);
                  seqChars.push(AA3_TO_1[a.resn] || "X");
                }
              }
              state.sequence = seqChars.join("");
              el.metaLength.textContent = `${seenRes.size} aa`;
            }
            if (entry.uniprotDescription && el.title.textContent === state.uniprotId) {
              el.title.textContent = entry.uniprotDescription;
            }
            if (entry.organismScientificName && el.organism.textContent.startsWith("Unknown organism")) {
              const taxPart = entry.taxId ? ` · TaxID ${entry.taxId}` : "";
              el.organism.textContent = `${entry.organismScientificName}${taxPart}`;
            }
            if (entry.gene && el.metaGene.textContent === "—") {
              el.metaGene.textContent = entry.gene;
            }
          }
          if (paeData) {
            renderPaeHeatmap(paeData);
          } else {
            clearPaeCanvas();
          }
        })
        .catch(() => {
          clearPaeCanvas();
        })
    );
  }

  await Promise.all(tasks);

  if (state.pdbModel && state.afModel) {
    state.alignedRmsd = superposeModels(state.pdbModel, state.afModel);
  }

  if (!state.pdbModel && state.afModel && state.layerMode === "pdb") {
    state.layerMode = "af";
  } else if (state.pdbModel && !state.afModel && state.layerMode === "af") {
    state.layerMode = "pdb";
  }
  syncSegmentedButtons();

  // Compute inter-chain interface contacts if a multi-chain PDB/complex is loaded
  const primaryComplex = state.localModel || state.pdbModel || state.afModel;
  computeInterfaceContacts(primaryComplex, Number(el.contactCutoffSelect.value));

  updateLegend();
  renderSequenceRibbon();
  applyVisualStyles();
  attachHoverHandlers();

  focusActiveModels();
  setLoading(false);
}

// ============================================================================
// Local PDB / mmCIF File Loading (AlphaFold-Multimer, GROMACS, Custom Models)
// ============================================================================
async function handleLocalFile(file) {
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  const format = ext === "cif" || ext === "mmcif" ? "cif" : "pdb";

  setLoading(true, `Parsing ${file.name}...`);
  clearResidueFocus(false);

  try {
    const rawText = await file.text();
    const cleanedText = format === "pdb" ? stripWaters(rawText) : rawText;

    if (state.afModel) {
      state.viewer.removeModel(state.afModel);
      state.afModel = null;
    }
    if (state.localModel) {
      state.viewer.removeModel(state.localModel);
      state.localModel = null;
    }

    state.rawLocalText = cleanedText;
    state.rawLocalFormat = format;
    state.localModel = state.viewer.addModel(cleanedText, format);
    const caAtoms = state.localModel.selectedAtoms({ atom: "CA", hetflag: false });
    if (!caAtoms.length) {
      throw new Error("No protein C-alpha coordinates found in the uploaded file.");
    }

    const chains = [];
    const chainSet = new Set();
    const seqParts = [];
    let currentChain = null;
    const seenResKeys = new Set();

    for (const a of caAtoms) {
      if (!chainSet.has(a.chain)) {
        chainSet.add(a.chain);
        chains.push(a.chain);
      }
      if (currentChain !== null && a.chain !== currentChain) {
        seqParts.push("/");
      }
      currentChain = a.chain;
      const key = `${a.chain}:${a.resi}`;
      if (!seenResKeys.has(key)) {
        seenResKeys.add(key);
        seqParts.push(AA3_TO_1[a.resn] || "X");
      }
    }

    state.localMeta = {
      name: file.name,
      format: format.toUpperCase(),
      chains,
      residueCount: seenResKeys.size
    };

    el.localCard.hidden = false;
    el.localFilename.textContent = file.name;
    el.localFileDetails.textContent = `Format: ${format.toUpperCase()} · Chains: ${chains.join(", ")} · ${seenResKeys.size} aa`;
    el.status.textContent = "Local File";
    el.status.className = "status-badge local";

    if (!state.uniprotId) {
      el.title.textContent = file.name.replace(/\.(pdb|ent|cif|mmcif)$/i, "");
      el.organism.textContent = `Local ${format.toUpperCase()} Coordinate File`;
      el.metaLabel1.textContent = "Source";
      el.metaLabel2.textContent = "Chains";
      el.metaLabel4.textContent = "Format";
      el.metaUniprot.textContent = "LOCAL";
      el.metaGene.textContent = chains.join(", ");
      el.metaLength.textContent = `${seenResKeys.size} aa`;
      el.metaAfdb.textContent = format.toUpperCase();
      el.funcDesc.textContent = "Custom coordinate structure loaded locally in browser memory.";
    }

    state.sequence = seqParts.join("");
    extractPlddtFromModel(state.localModel);
    clearPaeCanvas();

    if (state.pdbModel) {
      state.alignedRmsd = superposeModels(state.pdbModel, state.localModel);
    } else {
      state.alignedRmsd = null;
      state.layerMode = "af";
      syncSegmentedButtons();
    }

    // Detect inter-chain interface contacts (< 4.5 Å)
    computeInterfaceContacts(state.localModel, Number(el.contactCutoffSelect.value));

    if (chains.length > 1) {
      state.colorMode = "chain";
      el.colorSelect.value = "chain";
      el.highlightInterfaceToggle.checked = true;
    }

    updateLegend();
    renderSequenceRibbon();
    applyVisualStyles();
    attachHoverHandlers();
    focusActiveModels();
  } catch (err) {
    alert(`Failed to load structure: ${err.message}`);
  } finally {
    setLoading(false);
  }
}

function clearLocalState(reloadCurrent = true) {
  if (state.localModel && state.viewer) {
    state.viewer.removeModel(state.localModel);
  }
  state.localModel = null;
  state.localMeta = null;
  el.localCard.hidden = true;
  el.fileInput.value = "";
  if (reloadCurrent && (state.uniprotId || state.selectedPdbId)) {
    loadProteinRecord(state.uniprotId || state.selectedPdbId);
  }
}

// ============================================================================
// Inter-Chain Interface Contact Detector (< 4.5 Å) via 3D Spatial Grid
// ============================================================================
function computeInterfaceContacts(model, cutoff = 4.5) {
  state.interfaceContacts = [];
  state.selectedContactIdx = null;
  el.contactCount.textContent = "0";
  el.exportContactsBtn.disabled = true;

  if (!model) {
    el.contactTbody.innerHTML = `<tr><td colspan="3" class="empty-cell">No structure loaded.</td></tr>`;
    return;
  }

  // Heavy protein atoms only
  const atoms = model.selectedAtoms({ hetflag: false }).filter(
    (a) => a.elem !== "H" && !a.atom.startsWith("H")
  );

  const chains = new Set(atoms.map((a) => a.chain));
  if (chains.size < 2) {
    el.contactTbody.innerHTML = `<tr><td colspan="3" class="empty-cell">Single-chain monomer (no inter-chain interface).</td></tr>`;
    return;
  }

  // 3D spatial hash grid with cell size = cutoff (4.5 Å)
  const cellSize = cutoff;
  const grid = new Map();
  for (const a of atoms) {
    const gx = Math.floor(a.x / cellSize);
    const gy = Math.floor(a.y / cellSize);
    const gz = Math.floor(a.z / cellSize);
    const key = `${gx},${gy},${gz}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(a);
  }

  const pairMap = new Map();
  const cutoffSq = cutoff * cutoff;

  for (const a of atoms) {
    const gx = Math.floor(a.x / cellSize);
    const gy = Math.floor(a.y / cellSize);
    const gz = Math.floor(a.z / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const neighbors = grid.get(`${gx + dx},${gy + dy},${gz + dz}`);
          if (!neighbors) continue;

          for (const b of neighbors) {
            if (a.chain >= b.chain) continue; // Only distinct chain pairs, ordered
            const ddx = a.x - b.x;
            const ddy = a.y - b.y;
            const ddz = a.z - b.z;
            const d2 = ddx * ddx + ddy * ddy + ddz * ddz;

            if (d2 <= cutoffSq) {
              const dist = Math.sqrt(d2);
              const pairKey = `${a.chain}:${a.resi}|${b.chain}:${b.resi}`;
              const existing = pairMap.get(pairKey);
              if (!existing || dist < existing.dist) {
                pairMap.set(pairKey, {
                  chain1: a.chain,
                  resn1: a.resn,
                  resi1: a.resi,
                  atom1: a.atom,
                  b1: a.b ?? 0,
                  xyz1: { x: a.x, y: a.y, z: a.z },
                  chain2: b.chain,
                  resn2: b.resn,
                  resi2: b.resi,
                  atom2: b.atom,
                  b2: b.b ?? 0,
                  xyz2: { x: b.x, y: b.y, z: b.z },
                  dist
                });
              }
            }
          }
        }
      }
    }
  }

  const sorted = Array.from(pairMap.values()).sort((x, y) => x.dist - y.dist);
  state.interfaceContacts = sorted;
  el.contactCount.textContent = sorted.length;
  el.exportContactsBtn.disabled = sorted.length === 0;

  if (sorted.length === 0) {
    el.contactTbody.innerHTML = `<tr><td colspan="3" class="empty-cell">No inter-chain contacts &lt; ${cutoff} Å found.</td></tr>`;
    return;
  }

  el.contactTbody.innerHTML = sorted
    .slice(0, 80)
    .map((c, idx) => {
      return `
        <tr data-contact-idx="${idx}">
          <td class="mono">${c.chain1}:${c.resn1}${c.resi1}</td>
          <td class="mono">${c.chain2}:${c.resn2}${c.resi2}</td>
          <td class="mono">${c.dist.toFixed(2)} Å</td>
        </tr>`;
    })
    .join("");

  el.contactTbody.querySelectorAll("tr[data-contact-idx]").forEach((row) => {
    row.addEventListener("click", () => {
      el.contactTbody.querySelectorAll("tr.selected").forEach((r) => r.classList.remove("selected"));
      row.classList.add("selected");

      const idx = Number(row.dataset.contactIdx);
      state.selectedContactIdx = idx;
      const c = state.interfaceContacts[idx];
      if (!c) return;

      el.highlightInterfaceToggle.checked = true;
      applyVisualStyles();

      const targetModel = state.localModel || state.pdbModel || state.afModel;
      state.viewer.zoomTo(
        {
          model: targetModel,
          or: [
            { chain: c.chain1, resi: c.resi1 },
            { chain: c.chain2, resi: c.resi2 }
          ]
        },
        450
      );
      state.viewer.setSlab(-250, 250);
  state.viewer.render();
      el.hoverReadout.textContent = `Interface Contact: ${c.chain1}:${c.resn1}${c.resi1} (${c.atom1}) ↔ ${c.chain2}:${c.resn2}${c.resi2} (${c.atom2}) · ${c.dist.toFixed(2)} Å`;
    });
  });
}

// ============================================================================
// Residue Click-to-Zoom & Sidechain Highlight (Sequence Ribbon -> 3D)
// ============================================================================
function focusResidueBySequencePos(seqPos, aaChar) {
  if (!state.viewer) return;

  let targetModel = null;
  let targetAtom = null;

  if (state.localModel) {
    targetModel = state.localModel;
    const caAtoms = targetModel.selectedAtoms({ atom: "CA", hetflag: false });
    const seen = new Set();
    let idx = 0;
    for (const a of caAtoms) {
      const k = `${a.chain}:${a.resi}`;
      if (!seen.has(k)) {
        seen.add(k);
        idx++;
        if (idx === seqPos) { targetAtom = a; break; }
      }
    }
  } else {
    if (state.pdbModel && state.layerMode !== "af") {
      const mapping = state.pdbList.find((e) => e.pdb_id.toUpperCase() === state.selectedPdbId);
      const pdbCas = state.pdbModel.selectedAtoms({ atom: "CA", hetflag: false });
      if (mapping && seqPos >= mapping.unp_start && seqPos <= mapping.unp_end) {
        const pdbResi = mapping.start + (seqPos - mapping.unp_start);
        targetAtom = pdbCas.find((a) => a.resi === pdbResi);
        if (targetAtom) targetModel = state.pdbModel;
      } else if (!mapping) {
        targetAtom = pdbCas.find((a) => a.resi === seqPos);
        if (targetAtom) targetModel = state.pdbModel;
      }
    }
    if (!targetAtom && state.afModel && state.layerMode !== "pdb") {
      const afCas = state.afModel.selectedAtoms({ atom: "CA", hetflag: false });
      targetAtom = afCas.find((a) => a.resi === seqPos) || afCas[seqPos - 1];
      if (targetAtom) targetModel = state.afModel;
    }
  }

  if (!targetAtom || !targetModel) {
    el.seqSelection.textContent = `Residue ${aaChar}${seqPos} is outside the resolved experimental PDB span (try positions 500–598 for 1HSG)`;
    return;
  }

  state.focusedResidue = {
    seqPos,
    pdbResi: targetAtom.resi,
    chain: targetAtom.chain,
    resn: targetAtom.resn,
    aa: aaChar,
    model: targetModel
  };

  el.clearFocusBtn.hidden = false;
  const score = state.plddtScores[seqPos];
  el.seqSelection.textContent = `Focused: Chain ${targetAtom.chain} · ${targetAtom.resn} ${targetAtom.resi} (UniProt ${seqPos})${score ? ` · pLDDT ${score.toFixed(1)}` : ""}`;

  applyVisualStyles();

  state.viewer.zoomTo({ model: targetModel, chain: targetAtom.chain, resi: targetAtom.resi }, 300);
  setTimeout(() => {
    state.viewer.zoom(2.4, 250);
    state.viewer.setSlab(-250, 250);
  state.viewer.render();
  }, 320);
}

function clearResidueFocus(rerender = true) {
  state.focusedResidue = null;
  el.clearFocusBtn.hidden = true;
  el.seqSelection.textContent = "Click a residue to focus & show sidechain";
  el.seqRibbon.querySelectorAll(".res-cell.active").forEach((c) => c.classList.remove("active"));
  if (rerender && state.viewer) {
    applyVisualStyles();
    focusActiveModels();
  }
}

// Kabsch C-alpha structural superposition
function superposeModels(fixedModel, mobileModel) {
  const pdbCas = fixedModel.selectedAtoms({ atom: "CA", hetflag: false });
  const afCas = mobileModel.selectedAtoms({ atom: "CA", hetflag: false });
  if (!pdbCas.length || !afCas.length) return null;

  const primaryChain = pdbCas[0].chain;
  const chainPdbCas = pdbCas.filter((a) => a.chain === primaryChain);

  const afByResi = new Map();
  afCas.forEach((a) => {
    if (!afByResi.has(a.resi)) afByResi.set(a.resi, a);
  });

  const mapping = state.pdbList.find((e) => e.pdb_id.toUpperCase() === state.selectedPdbId);
  const offset = mapping ? mapping.unp_start - mapping.start : 0;

  const P = [];
  const Q = [];
  for (const a of chainPdbCas) {
    const targetResi = a.resi + offset;
    const b = afByResi.get(targetResi) || afByResi.get(a.resi);
    if (b) {
      P.push([a.x, a.y, a.z]);
      Q.push([b.x, b.y, b.z]);
    }
  }

  if (P.length < 5) return null;

  const n = P.length;
  const cP = [0, 0, 0];
  const cQ = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    cP[0] += P[i][0]; cP[1] += P[i][1]; cP[2] += P[i][2];
    cQ[0] += Q[i][0]; cQ[1] += Q[i][1]; cQ[2] += Q[i][2];
  }
  cP[0] /= n; cP[1] /= n; cP[2] /= n;
  cQ[0] /= n; cQ[1] /= n; cQ[2] /= n;

  const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n; i++) {
    const qx = Q[i][0] - cQ[0], qy = Q[i][1] - cQ[1], qz = Q[i][2] - cQ[2];
    const px = P[i][0] - cP[0], py = P[i][1] - cP[1], pz = P[i][2] - cP[2];
    H[0][0] += qx * px; H[0][1] += qx * py; H[0][2] += qx * pz;
    H[1][0] += qy * px; H[1][1] += qy * py; H[1][2] += qy * pz;
    H[2][0] += qz * px; H[2][1] += qz * py; H[2][2] += qz * pz;
  }

  const R = kabschRotation(H);

  const allMobileAtoms = mobileModel.selectedAtoms({});
  for (const atom of allMobileAtoms) {
    const x = atom.x - cQ[0];
    const y = atom.y - cQ[1];
    const z = atom.z - cQ[2];
    atom.x = R[0][0] * x + R[0][1] * y + R[0][2] * z + cP[0];
    atom.y = R[1][0] * x + R[1][1] * y + R[1][2] * z + cP[1];
    atom.z = R[2][0] * x + R[2][1] * y + R[2][2] * z + cP[2];
  }

  let sqSum = 0;
  for (let i = 0; i < n; i++) {
    const x = Q[i][0] - cQ[0];
    const y = Q[i][1] - cQ[1];
    const z = Q[i][2] - cQ[2];
    const rx = R[0][0] * x + R[0][1] * y + R[0][2] * z + cP[0];
    const ry = R[1][0] * x + R[1][1] * y + R[1][2] * z + cP[1];
    const rz = R[2][0] * x + R[2][1] * y + R[2][2] * z + cP[2];
    const dx = rx - P[i][0], dy = ry - P[i][1], dz = rz - P[i][2];
    sqSum += dx * dx + dy * dy + dz * dz;
  }
  return Math.sqrt(sqSum / n).toFixed(2);
}

function kabschRotation(H) {
  const Sxx = H[0][0], Sxy = H[0][1], Sxz = H[0][2];
  const Syx = H[1][0], Syy = H[1][1], Syz = H[1][2];
  const Szx = H[2][0], Szy = H[2][1], Szz = H[2][2];

  const N = [
    [Sxx + Syy + Szz, Syz - Szy, Szx - Sxz, Sxy - Syx],
    [Syz - Szy, Sxx - Syy - Szz, Sxy + Syx, Szx + Sxz],
    [Szx - Sxz, Sxy + Syx, -Sxx + Syy - Szz, Syz + Szy],
    [Sxy - Syx, Szx + Sxz, Syz + Szy, -Sxx - Syy + Szz]
  ];

  let q = [1, 0, 0, 0];
  for (let iter = 0; iter < 50; iter++) {
    const next = [
      N[0][0]*q[0] + N[0][1]*q[1] + N[0][2]*q[2] + N[0][3]*q[3],
      N[1][0]*q[0] + N[1][1]*q[1] + N[1][2]*q[2] + N[1][3]*q[3],
      N[2][0]*q[0] + N[2][1]*q[1] + N[2][2]*q[2] + N[2][3]*q[3],
      N[3][0]*q[0] + N[3][1]*q[1] + N[3][2]*q[2] + N[3][3]*q[3]
    ];
    const norm = Math.hypot(next[0], next[1], next[2], next[3]) || 1;
    q = [next[0]/norm, next[1]/norm, next[2]/norm, next[3]/norm];
  }

  const [w, x, y, z] = q;
  return [
    [1 - 2*(y*y + z*z), 2*(x*y - z*w),     2*(x*z + y*w)],
    [2*(x*y + z*w),     1 - 2*(x*x + z*z), 2*(y*z - x*w)],
    [2*(x*z - y*w),     2*(y*z + x*w),     1 - 2*(x*x + y*y)]
  ];
}

function focusActiveModels() {
  if (!state.viewer) return;
  const secondaryModel = state.localModel || state.afModel;
  if (state.layerMode === "pdb" && state.pdbModel) {
    state.viewer.zoomTo({ model: state.pdbModel });
  } else if (state.layerMode === "af" && secondaryModel) {
    state.viewer.zoomTo({ model: secondaryModel });
  } else if (state.pdbModel) {
    state.viewer.zoomTo({ model: state.pdbModel });
  } else if (secondaryModel) {
    state.viewer.zoomTo({ model: secondaryModel });
  } else {
    state.viewer.zoomTo();
  }
  state.viewer.resize();
  state.viewer.setSlab(-250, 250);
  state.viewer.render();

  if ((state.layerMode === "split") && state.rightViewer) {
    state.rightViewer.removeAllModels();
    state.rightViewer.removeAllSurfaces();
    state.rightAfModel = null;

    const secText = state.rawLocalText || state.rawAfText;
    const secFmt = state.rawLocalText ? state.rawLocalFormat : "pdb";

    if (secText) {
      state.rightAfModel = state.rightViewer.addModel(secText, secFmt);
      // Apply same Kabsch superposition to right-pane model so both panes share identical orientation
      if (state.pdbModel) {
        superposeModels(state.pdbModel, state.rightAfModel);
      }
      const secColorSpec = getColorSpec("af", state.rightAfModel);
      const hideLowConfRight = el.hideDisorderedToggle && el.hideDisorderedToggle.checked;
      const rightSel = hideLowConfRight
        ? { hetflag: false, predicate: (a) => (a.b || 0) >= 50 }
        : { hetflag: false };
      state.rightAfModel.setStyle(rightSel, { [state.repStyle]: secColorSpec });
      state.rightAfModel.setStyle({ hetflag: true }, { stick: { radius: 0.18, colorscheme: "Jmol" } });

      if (state.showSurface) {
        state.rightViewer.addSurface(
          $3Dmol.SurfaceType.VDW,
          { opacity: 0.22, color: "#cbd5e1" },
          { model: state.rightAfModel, hetflag: false }
        );
      }
      el.splitRightTag.textContent = state.localMeta
        ? `Local: ${state.localMeta.name}`
        : `AlphaFold: AF-${state.uniprotId}-F1`;
    } else {
      el.splitRightTag.textContent = "AlphaFold / Local: None";
    }

    state.rightViewer.resize();
    state.rightViewer.setView(state.viewer.getView());
    state.rightViewer.setSlab(-250, 250);
    state.rightViewer.render();
  }
}

function extractPlddtFromModel(model) {
  const atoms = model.selectedAtoms({ atom: "CA", hetflag: false });
  const scores = [];
  let vHigh = 0, conf = 0, low = 0, vLow = 0, sum = 0;

  atoms.forEach((a, idx) => {
    const score = a.b || 0;
    scores[idx + 1] = score;
    sum += score;
    if (score > 90) vHigh++;
    else if (score >= 70) conf++;
    else if (score >= 50) low++;
    else vLow++;
  });

  state.plddtScores = scores;
  const total = atoms.length || 1;
  const mean = atoms.length ? (sum / total).toFixed(1) : "—";

  el.meanPlddt.textContent = atoms.length ? `${mean}` : "—";

  const p1 = Math.round((vHigh / total) * 100);
  const p2 = Math.round((conf / total) * 100);
  const p3 = Math.round((low / total) * 100);
  const p4 = Math.max(0, 100 - p1 - p2 - p3);

  el.barVhigh.style.width = `${p1}%`;
  el.barConf.style.width = `${p2}%`;
  el.barLow.style.width = `${p3}%`;
  el.barVlow.style.width = `${p4}%`;

  el.pctVhigh.textContent = `${p1}%`;
  el.pctConf.textContent = `${p2}%`;
  el.pctLow.textContent = `${p3}%`;
  el.pctVlow.textContent = `${p4}%`;
}

function renderPaeHeatmap(paeJson) {
  const matrix = paeJson?.[0]?.predicted_aligned_error;
  if (!matrix || !matrix.length) {
    clearPaeCanvas();
    return;
  }

  const n = matrix.length;
  const size = el.paeCanvas.width;
  const ctx = el.paeCanvas.getContext("2d");
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const resY = Math.floor((y / size) * n);
    const row = matrix[resY];
    for (let x = 0; x < size; x++) {
      const resX = Math.floor((x / size) * n);
      const err = Math.min(30, Math.max(0, row[resX]));
      const t = err / 30;

      const r = Math.round(0 + t * 248);
      const g = Math.round(83 + t * 167);
      const b = Math.round(214 + t * 38);

      const idx = (y * size + x) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function clearPaeCanvas() {
  const ctx = el.paeCanvas.getContext("2d");
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, el.paeCanvas.width, el.paeCanvas.height);
}

function applyVisualStyles() {
  if (!state.viewer) return;
  state.viewer.removeAllSurfaces();
  state.viewer.removeAllLabels();
  state.viewer.removeAllShapes();

  el.paneRight.hidden = !(state.layerMode === "split");

  const secondaryModel = state.localModel || state.afModel;
  const showPdb = state.pdbModel && (state.layerMode === "both" || state.layerMode === "pdb" || (state.layerMode === "split"));
  const showSec = secondaryModel && (state.layerMode === "both" || state.layerMode === "af");

  if (state.pdbModel) {
    state.pdbModel.setStyle({}, {});
    if (showPdb) {
      const pdbColorSpec = getColorSpec("pdb", state.pdbModel);
      state.pdbModel.setStyle({ hetflag: false }, { [state.repStyle]: pdbColorSpec });
      state.pdbModel.setStyle({ hetflag: true }, { stick: { radius: 0.18, colorscheme: "Jmol" } });
    }
  }

  if (secondaryModel) {
    secondaryModel.setStyle({}, {});
    if (showSec) {
      const secColorSpec = getColorSpec("af", secondaryModel);
      const hideLowConf = el.hideDisorderedToggle && el.hideDisorderedToggle.checked;
      const atomSel = hideLowConf
        ? { hetflag: false, predicate: (a) => (a.b || 0) >= 50 }
        : { hetflag: false };
      secondaryModel.setStyle(atomSel, { [state.repStyle]: secColorSpec });
      secondaryModel.setStyle({ hetflag: true }, { stick: { radius: 0.18, colorscheme: "Jmol" } });
    }
  }

  // Highlight inter-chain interface contact residues & dashed distance lines (< 4.5 Å)
  if (el.highlightInterfaceToggle.checked && state.interfaceContacts.length > 0) {
    const complexModel = state.localModel || state.pdbModel || state.afModel;
    const seenRes = new Set();

    state.interfaceContacts.forEach((c) => {
      const k1 = `${c.chain1}:${c.resi1}`;
      const k2 = `${c.chain2}:${c.resi2}`;

      if (!seenRes.has(k1)) {
        seenRes.add(k1);
        complexModel.addStyle(
          { chain: c.chain1, resi: c.resi1 },
          { stick: { radius: 0.16, colorscheme: "Jmol" } }
        );
      }
      if (!seenRes.has(k2)) {
        seenRes.add(k2);
        complexModel.addStyle(
          { chain: c.chain2, resi: c.resi2 },
          { stick: { radius: 0.16, colorscheme: "Jmol" } }
        );
      }

      state.viewer.addCylinder({
        start: c.xyz1,
        end: c.xyz2,
        radius: 0.05,
        color: "#dc2626",
        dashed: true,
        dashLength: 0.25,
        gapLength: 0.2
      });
    });
  }

  // Highlight focused residue from sequence ribbon with crisp yellow/amber sticks + floating label
  if (state.focusedResidue) {
    const f = state.focusedResidue;
    f.model.addStyle(
      { chain: f.chain, resi: f.pdbResi },
      {
        stick: { radius: 0.24, color: "#d97706" },
        sphere: { radius: 0.32, color: "#f59e0b" }
      }
    );

    const ca = f.model.selectedAtoms({ chain: f.chain, resi: f.pdbResi, atom: "CA" })[0];
    if (ca) {
      state.viewer.addLabel(`${f.chain}:${f.resn}${f.pdbResi}`, {
        position: { x: ca.x, y: ca.y, z: ca.z },
        backgroundColor: "#0f172a",
        fontColor: "#ffffff",
        fontSize: 12,
        padding: 4,
        borderRadius: 4,
        backgroundOpacity: 0.9
      });
    }
  }

  if (state.showSurface) {
    const targetModel = showSec ? secondaryModel : showPdb ? state.pdbModel : null;
    if (targetModel) {
      state.viewer.addSurface(
        $3Dmol.SurfaceType.VDW,
        { opacity: 0.22, color: "#cbd5e1" },
        { model: targetModel, hetflag: false }
      );
    }
  }

  state.viewer.setSlab(-250, 250);
  state.viewer.render();
}

function getColorSpec(source, model) {
  if (state.colorMode === "source") {
    return { color: source === "pdb" ? "#0f766e" : "#1d4ed8" };
  }
  if (state.colorMode === "chain") {
    const chains = [];
    model.selectedAtoms({ atom: "CA" }).forEach((a) => {
      if (!chains.includes(a.chain)) chains.push(a.chain);
    });
    return {
      colorfunc: (atom) => {
        const idx = chains.indexOf(atom.chain);
        return CHAIN_PALETTE[(idx >= 0 ? idx : 0) % CHAIN_PALETTE.length];
      }
    };
  }
  if (state.colorMode === "spectrum") {
    return { colorscheme: "spectrum" };
  }
  if (state.colorMode === "ss") {
    return { colorscheme: "ssJmol" };
  }
  if (state.colorMode === "plddt") {
    return {
      colorfunc: (atom) => {
        const b = atom.b || 0;
        if (b > 90) return "#0053d6";
        if (b >= 70) return "#65cbf3";
        if (b >= 50) return "#e5b800";
        return "#ff7d45";
      }
    };
  }
  return { color: "#1d4ed8" };
}

function attachHoverHandlers() {
  const models = [state.pdbModel, state.afModel, state.localModel].filter(Boolean);
  models.forEach((model) => {
    let label = `AF:${state.uniprotId}`;
    if (model === state.pdbModel) label = `PDB:${state.selectedPdbId}`;
    else if (model === state.localModel) label = `LOCAL:${state.localMeta?.name || "structure"}`;

    model.setHoverable(
      {},
      true,
      (atom) => {
        if (!atom) return;
        const isLocalBfactor = model === state.localModel && el.localBfactorRole.value === "bfactor";
        const metricName = (model === state.pdbModel || isLocalBfactor) ? "B-factor" : "pLDDT";
        el.hoverReadout.textContent = `${label} | Chain ${atom.chain} | ${atom.resn} ${atom.resi} | Atom ${atom.atom} | ${metricName}: ${atom.b.toFixed(1)}`;
      },
      () => {
        el.hoverReadout.textContent = "Hover over any residue in 3D or click a sequence letter below to focus & inspect sidechains";
      }
    );
  });
}

function renderSequenceRibbon() {
  const seq = state.sequence || "";
  if (!seq) {
    el.seqRibbon.innerHTML = `<span class="muted" style="padding:4px 8px;">No canonical sequence available.</span>`;
    return;
  }

  const html = [];
  let resCounter = 0;
  for (let i = 0; i < seq.length; i++) {
    const aa = seq[i];
    if (aa === "/") {
      html.push(`<span class="res-cell muted" style="font-weight:700;cursor:default;">/</span>`);
      continue;
    }
    resCounter++;
    const score = state.plddtScores[resCounter];
    let borderCol = "#cbd5e1";
    if (score !== undefined) {
      if (score > 90) borderCol = "#0053d6";
      else if (score >= 70) borderCol = "#65cbf3";
      else if (score >= 50) borderCol = "#e5b800";
      else borderCol = "#ff7d45";
    }
    html.push(
      `<span class="res-cell" data-pos="${resCounter}" title="Res ${resCounter} (${aa})${score ? ` · Score ${score.toFixed(1)}` : ""}" style="border-bottom-color:${borderCol}">${aa}</span>`
    );
  }
  el.seqRibbon.innerHTML = html.join("");

  el.seqRibbon.querySelectorAll(".res-cell[data-pos]").forEach((cell) => {
    cell.addEventListener("click", () => {
      el.seqRibbon.querySelectorAll(".res-cell.active").forEach((c) => c.classList.remove("active"));
      cell.classList.add("active");

      const pos = Number(cell.dataset.pos);
      focusResidueBySequencePos(pos, cell.textContent);
    });
  });
}

function updateLegend() {
  el.legendPdb.textContent = state.pdbModel
    ? `PDB: ${state.selectedPdbId} (Experimental)`
    : "PDB: None loaded";

  const rmsdTag = state.alignedRmsd ? ` · Cα RMSD ${state.alignedRmsd} Å` : "";
  if (state.localModel && state.localMeta) {
    el.legendAf.textContent = `Local: ${state.localMeta.name} (${state.localMeta.chains.join("/")})${rmsdTag}`;
  } else if (state.afModel) {
    el.legendAf.textContent = `AlphaFold: AF-${state.uniprotId}-F1${rmsdTag}`;
  } else {
    el.legendAf.textContent = "AlphaFold / Local: None";
  }
}

function syncSegmentedButtons() {
  el.layerBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === state.layerMode);
  });
}

function setLink(anchor, url) {
  if (url) {
    anchor.href = url;
    anchor.classList.remove("disabled");
  } else {
    anchor.href = "#";
    anchor.classList.add("disabled");
  }
}

// ============================================================================
// Event Bindings
// ============================================================================
el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = el.input.value.trim();
  if (q) {
    el.presets.forEach((c) => c.classList.toggle("active", c.dataset.query.toUpperCase() === q.toUpperCase()));
    loadProteinRecord(q);
  }
});

el.uploadBtn.addEventListener("click", () => {
  el.fileInput.click();
});

el.fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) handleLocalFile(file);
});

el.clearLocalBtn.addEventListener("click", () => {
  clearLocalState(true);
});

el.localBfactorRole.addEventListener("change", () => {
  attachHoverHandlers();
});

el.clearFocusBtn.addEventListener("click", () => {
  clearResidueFocus(true);
});

el.highlightInterfaceToggle.addEventListener("change", () => {
  applyVisualStyles();
});

el.contactCutoffSelect.addEventListener("change", () => {
  const activeComplex = state.localModel || state.pdbModel || state.afModel;
  computeInterfaceContacts(activeComplex, Number(el.contactCutoffSelect.value));
  if (el.highlightInterfaceToggle.checked) {
    applyVisualStyles();
  }
});

el.exportContactsBtn.addEventListener("click", () => {
  if (!state.interfaceContacts.length) return;

  const isLocalBfactor = state.localModel && el.localBfactorRole.value === "bfactor";
  const isPdbOnly = !state.localModel && state.pdbModel && state.layerMode !== "af";
  const scoreCol = (isLocalBfactor || isPdbOnly) ? "bfactor" : "plddt";

  const headers = [
    "rank",
    "chain_1",
    "resn_1",
    "resi_1",
    "atom_1",
    `${scoreCol}_1`,
    "chain_2",
    "resn_2",
    "resi_2",
    "atom_2",
    `${scoreCol}_2`,
    "min_distance_angstrom"
  ];

  const rows = state.interfaceContacts.map((c, idx) => [
    idx + 1,
    c.chain1,
    c.resn1,
    c.resi1,
    c.atom1,
    Number(c.b1).toFixed(2),
    c.chain2,
    c.resn2,
    c.resi2,
    c.atom2,
    Number(c.b2).toFixed(2),
    c.dist.toFixed(3)
  ].join(","));

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const baseName =
    state.localMeta?.name?.replace(/\.[^.]+$/, "") ||
    state.selectedPdbId ||
    state.uniprotId ||
    "complex";

  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}_interface_contacts_${el.contactCutoffSelect.value}A.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// Drag & Drop handlers on the 3D canvas stage
let dragDepth = 0;
el.dropZone.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragDepth++;
  el.dropOverlay.hidden = false;
});

el.dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
});

el.dropZone.addEventListener("dragleave", () => {
  dragDepth--;
  if (dragDepth <= 0) {
    dragDepth = 0;
    el.dropOverlay.hidden = true;
  }
});

el.dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dragDepth = 0;
  el.dropOverlay.hidden = true;
  const file = e.dataTransfer?.files?.[0];
  if (file) handleLocalFile(file);
});

el.presets.forEach((chip) => {
  chip.addEventListener("click", () => {
    const q = chip.dataset.query;
    el.input.value = q;
    el.presets.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    loadProteinRecord(q);
  });
});

el.layerBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.layerMode = btn.dataset.mode;
    syncSegmentedButtons();
    applyVisualStyles();
    focusActiveModels();
  });
});

el.repSelect.addEventListener("change", () => {
  state.repStyle = el.repSelect.value;
  applyVisualStyles();
});

el.colorSelect.addEventListener("change", () => {
  state.colorMode = el.colorSelect.value;
  applyVisualStyles();
});

el.hideDisorderedToggle.addEventListener("change", () => {
  applyVisualStyles();
});

el.surfaceToggle.addEventListener("change", () => {
  state.showSurface = el.surfaceToggle.checked;
  applyVisualStyles();
});

el.spinToggle.addEventListener("change", () => {
  const spinVal = el.spinToggle.checked ? "y" : false;
  state.viewer.spin(spinVal);
  if (state.rightViewer) state.rightViewer.spin(spinVal);
});

el.resetBtn.addEventListener("click", () => {
  clearResidueFocus(false);
  applyVisualStyles();
  focusActiveModels();
});

el.snapshotBtn.addEventListener("click", () => {
  const dataUri = state.viewer.pngURI();
  const a = document.createElement("a");
  a.href = dataUri;
  const baseName = state.localMeta?.name?.replace(/\.[^.]+$/, "") || state.uniprotId || state.selectedPdbId || "structure";
  a.download = `${baseName}_StrucDB.png`;
  a.click();
});

el.exportPmlBtn.addEventListener("click", () => {
  const lines = [
    "# ============================================================================",
    "# StrucDB — Publication-Ready PyMOL Rendering Script",
    `# Generated: ${new Date().toISOString()}`,
    "# ============================================================================",
    "reinitialize",
    "bg_color white",
    "set ray_opaque_background, 1",
    "set ray_shadow, 0",
    "set antialias, 2",
    "set orthoscopic, on",
    "set cartoon_fancy_helices, 1",
    "set cartoon_smooth_loops, 1",
    "set cartoon_loop_radius, 0.22",
    "set stick_radius, 0.16",
    "set dash_color, firebrick",
    "set dash_width, 2.2",
    "set dash_gap, 0.25",
    "set label_font_id, 7",
    "set label_size, 16",
    "set label_color, black",
    "set label_outline_color, white",
    ""
  ];

  const pdbId = state.selectedPdbId;
  const uniprotId = state.uniprotId;
  const localName = state.localMeta?.name;
  let primaryObj = null;

  // 1. Load structures
  if (localName) {
    primaryObj = "local_complex";
    lines.push(`# Load local coordinate file (place ${localName} in the same folder as this .pml script)`);
    lines.push(`load ${localName}, ${primaryObj}`);
    lines.push(`remove ${primaryObj} and resn HOH`);
    lines.push(`hide everything, ${primaryObj}`);
    lines.push(`show cartoon, ${primaryObj} and polymer.protein`);
    lines.push(`show sticks, ${primaryObj} and organic`);
    lines.push("");
  }

  if (pdbId && state.pdbModel) {
    if (!primaryObj) primaryObj = `pdb_${pdbId}`;
    lines.push(`# Fetch experimental structure from RCSB PDB`);
    lines.push(`fetch ${pdbId}, pdb_${pdbId}, async=0`);
    lines.push(`remove pdb_${pdbId} and resn HOH`);
    lines.push(`hide everything, pdb_${pdbId}`);
    lines.push(`show cartoon, pdb_${pdbId} and polymer.protein`);
    lines.push(`show sticks, pdb_${pdbId} and organic`);
    lines.push(`util.cbag pdb_${pdbId} and organic`);
    lines.push("");
  }

  if (uniprotId && state.afModel && !localName) {
    const afObj = `af_${uniprotId}`;
    if (!primaryObj) primaryObj = afObj;
    lines.push(`# Load AlphaFold DB v4 coordinates directly via HTTPS`);
    lines.push(`load https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.pdb, ${afObj}`);
    lines.push(`hide everything, ${afObj}`);
    lines.push(`show cartoon, ${afObj}`);
    if (pdbId && state.pdbModel) {
      lines.push(`super ${afObj}, pdb_${pdbId}`);
    }
    lines.push("");
  }

  if (!primaryObj) {
    alert("Load a PDB entry, AlphaFold entry, or local file first.");
    return;
  }

  // 2. Apply active color scheme
  lines.push("# Color scheme");
  const pmlHexPalette = ["0x1d4ed8", "0x0f766e", "0xb45309", "0x7c3aed", "0xbe123c", "0x0369a1", "0x15803d", "0xc2410c"];

  if (state.colorMode === "chain") {
    const targetModel = state.localModel || state.pdbModel || state.afModel;
    const chains = [];
    targetModel.selectedAtoms({ atom: "CA" }).forEach((a) => {
      if (!chains.includes(a.chain)) chains.push(a.chain);
    });
    chains.forEach((ch, idx) => {
      const hex = pmlHexPalette[idx % pmlHexPalette.length];
      lines.push(`color ${hex}, ${primaryObj} and chain ${ch}`);
    });
  } else if (state.colorMode === "plddt") {
    lines.push(`# AlphaFold pLDDT confidence bins stored in B-factor column`);
    lines.push(`color 0x0053d6, ${primaryObj} and b > 90`);
    lines.push(`color 0x65cbf3, ${primaryObj} and (b > 70 and b <= 90)`);
    lines.push(`color 0xffdb13, ${primaryObj} and (b > 50 and b <= 70)`);
    lines.push(`color 0xff7d45, ${primaryObj} and b <= 50`);
  } else if (state.colorMode === "spectrum") {
    lines.push(`spectrum count, rainbow, ${primaryObj} and polymer.protein`);
  } else if (state.colorMode === "ss") {
    lines.push(`color 0x1d4ed8, ${primaryObj} and ss h`);
    lines.push(`color 0x0f766e, ${primaryObj} and ss s`);
    lines.push(`color 0x94a3b8, ${primaryObj} and ss l+''`);
  } else {
    if (pdbId && state.pdbModel) lines.push(`color 0x0f766e, pdb_${pdbId} and polymer.protein`);
    if (uniprotId && state.afModel && !localName) lines.push(`color 0x1d4ed8, af_${uniprotId}`);
    if (localName) lines.push(`color 0x1d4ed8, local_complex and polymer.protein`);
  }
  lines.push("");

  // 3. Layer visibility
  if (state.layerMode === "pdb" && uniprotId && state.afModel) {
    lines.push(`disable af_${uniprotId}`);
  } else if (state.layerMode === "af" && pdbId && state.pdbModel) {
    lines.push(`disable pdb_${pdbId}`);
  }

  // 3b. Hide disordered loops (pLDDT < 50) if toggled
  if (el.hideDisorderedToggle && el.hideDisorderedToggle.checked) {
    lines.push(`hide cartoon, ${primaryObj} and b < 50`);
    lines.push("");
  }

  // 4. Optional translucent surface
  if (state.showSurface) {
    lines.push(`show surface, ${primaryObj} and polymer.protein`);
    lines.push(`set transparency, 0.78`);
    lines.push("");
  }

  // 5. Inter-chain interface contacts (< cutoff Å)
  const cutoff = el.contactCutoffSelect.value;
  if (state.interfaceContacts.length > 0) {
    lines.push(`# Inter-chain interface contacts (< ${cutoff} A)`);
    const ifaceRes = new Set();
    state.interfaceContacts.forEach((c) => {
      ifaceRes.add(`(chain ${c.chain1} and resi ${c.resi1})`);
      ifaceRes.add(`(chain ${c.chain2} and resi ${c.resi2})`);
    });
    lines.push(`select interface_residues, ${primaryObj} and (${Array.from(ifaceRes).join(" or ")})`);
    if (el.highlightInterfaceToggle.checked) {
      lines.push(`show sticks, interface_residues and not (name C+N+O)`);
      lines.push(`util.cnc interface_residues`);
    }
    state.interfaceContacts.slice(0, 60).forEach((c, idx) => {
      lines.push(
        `distance contact_${idx + 1}, (${primaryObj} and chain ${c.chain1} and resi ${c.resi1} and name ${c.atom1}), (${primaryObj} and chain ${c.chain2} and resi ${c.resi2} and name ${c.atom2})`
      );
    });
    lines.push(`hide labels, contact_*`);
    lines.push(`group interface_contacts, contact_*`);
    lines.push("");
  }

  // 6. Focused residue from sequence ribbon
  if (state.focusedResidue) {
    const f = state.focusedResidue;
    lines.push(`# Focused residue highlight`);
    lines.push(`select focused_res, ${primaryObj} and chain ${f.chain} and resi ${f.pdbResi}`);
    lines.push(`show sticks, focused_res`);
    lines.push(`color 0xd97706, focused_res and elem C`);
    lines.push(`label focused_res and name CA, "${f.chain}:${f.resn}${f.pdbResi}"`);
    lines.push(`zoom focused_res, 8`);
  } else {
    lines.push(`orient ${primaryObj}`);
    lines.push(`zoom ${primaryObj}, 2`);
  }

  lines.push("");
  lines.push("# Uncomment below for high-resolution 300 DPI publication render:");
  lines.push(`# ray 2400, 1800`);
  lines.push(`# png ${primaryObj}_render.png, dpi=300`);
  lines.push("");

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const baseName = localName?.replace(/\.[^.]+$/, "") || pdbId || uniprotId || "structure";

  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}_StrucDB.pml`;
  a.click();
  URL.revokeObjectURL(url);
});

window.addEventListener("DOMContentLoaded", () => {
  initViewer();
  loadProteinRecord("P04637");
});

window.addEventListener("resize", () => {
  if (state.viewer) { state.viewer.resize(); state.viewer.setSlab(-250, 250);
  state.viewer.render(); }
  if (state.rightViewer && state.layerMode === "split") { state.rightViewer.resize(); state.rightViewer.setSlab(-250, 250);
    state.rightViewer.render(); }
});
