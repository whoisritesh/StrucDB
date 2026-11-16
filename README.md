# StrucDB — Unified PDB & AlphaFold Structural Workstation

A client-side structural biology workbench merging experimental coordinates from **RCSB PDB / PDBe** with AI-predicted models from the **AlphaFold Protein Structure Database (AFDB)** and **UniProtKB**.

## Features
- **Unified Tri-API Search**: Resolves UniProtKB accessions, RCSB PDB IDs, and gene symbols in real time.
- **3D Structural Superposition & Split View**: Kabsch Cα alignment with live RMSD calculation, synchronized side-by-side Split View, and Overlay modes powered by `3Dmol.js`.
- **AlphaFold Confidence & PAE Telemetry**: Per-residue pLDDT confidence distribution, 2D Predicted Aligned Error (PAE) canvas heatmap, and interactive sequence ribbon focus.
- **Local Complex Analysis**: Drag-and-drop `.pdb` / `.mmcif` support for AlphaFold-Multimer complexes and GROMACS structures with automatic inter-chain interface contact detection (`< 3.5 Å` to `< 8.0 Å`), CSV export, and publication-ready PyMOL (`.pml`) script generation.

## Live Demo
Hosted via GitHub Pages at `https://whoisritesh.github.io/StrucDB/`
