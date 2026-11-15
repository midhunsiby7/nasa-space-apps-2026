# COSMOLOOKUP 3D Human Anatomy Asset Provenance & Geometry Specification

## 1. Asset Overview

- **File Path:** `frontend/public/models/cosmolookup_human_anatomy_3d.glb`
- **Container Format:** glTF 2.0 Binary (`.glb`)
- **File Size:** `1,986,996 bytes` (1.90 MB)
- **Geometry Nodes:** 14 scene nodes, 13 discrete mesh primitives
- **Coordinate Space:** Right-handed Cartesian coordinates $(X, Y, Z)$ in meters.
- **Estimated Model Bounds:**
  - $X \in [-0.28\text{m}, +0.28\text{m}]$ (width $\approx 0.56\text{m}$)
  - $Y \in [-0.89\text{m}, +0.85\text{m}]$ (height $\approx 1.74\text{m}$)
  - $Z \in [-0.15\text{m}, +0.16\text{m}]$ (depth $\approx 0.31\text{m}$)
- **Default Framing:** Origin centered at $(0, 0, 0)$ via dynamic group centering $(-\text{center}.x, -\text{center}.y, -\text{center}.z)$.

---

## 2. Anatomical Mesh Inventory

The model consists of 13 anatomically identified mesh nodes:

| Index | Mesh Node Name | Anatomical System | View Layer | Default Opacity |
|:-----:|:---|:---|:---|:---:|
| 0 | `Brain_and_Spinal_Cord` | Central Nervous System | `nerves` | 1.00 |
| 1 | `Skull_RibCage_Spine_Skeleton` | Skeletal Framework | `bones` | 1.00 |
| 2 | `Lungs_and_Bronchial_Tree` | Cardiopulmonary / Respiratory | `organs` | 0.90 |
| 3 | `Heart_Myocardium` | Cardiovascular / Hemodynamic | `organs` | 1.00 |
| 4 | `Liver_Hepatic_Lobes` | Digestive / Metabolic | `organs` | 0.95 |
| 5 | `Stomach_Gastric_Curvature` | Gastrointestinal | `organs` | 0.90 |
| 6 | `Kidneys_Bilateral_Renal` | Renal / Fluid Regulation | `organs` | 0.95 |
| 7 | `Intestines_Small_and_Large_Colon` | Gastrointestinal | `organs` | 0.90 |
| 8 | `Urinary_Bladder_and_Ureters` | Renal / Excretory | `organs` | 0.85 |
| 9 | `Major_Arteries_Red` | Systemic Arterial Circulation | `vessels` | 0.95 |
| 10 | `Major_Veins_Blue` | Systemic Venous Circulation | `vessels` | 0.95 |
| 11 | `Muscular_Structures` | Musculoskeletal (Muscles) | `muscles` | 0.38 (Full) / 0.85 (Muscles) |
| 12 | `Human_Body_Structure_Outer_Shell` | Integumentary / Body Boundary | `shell` | 0.20 (Ghosted) |

---

## 3. Critical Anatomical Boundaries & Scientific Guardrails

In compliance with NASA-STD-3001 and clinical space medicine principles:

1. **Central Nervous System Only:**
   - The mesh `Brain_and_Spinal_Cord` represents the central neuro-axis (cerebrum, cerebellum, brainstem, spinal cord down to sacral canal).
   - Peripheral somatic and autonomic nerve branches extending into upper and lower extremities are **not modeled** in this 3D geometry. The platform discloses this explicitly rather than fabricating speculative geometry.

2. **No Dedicated Ocular Mesh:**
   - There is no separate eye or optic nerve sheath mesh in the GLB asset.
   - Spaceflight-Associated Neuro-ocular Syndrome (SANS) surveillance is evaluated through scheduled diagnostic imaging protocols (OCT, funduscopy) and clinical protocols, anchored contextually to the cranial/facial region.

3. **Single Merged Meshes:**
   - `Skull_RibCage_Spine_Skeleton` is a single interconnected skeletal mesh. Individual vertebrae or ribs cannot be isolated as separate meshes; selection highlights the axial skeleton.
   - `Muscular_Structures` is a single unified anatomical muscular sheet covering the core and limbs.

4. **Non-Raycast Outer Shell:**
   - `Human_Body_Structure_Outer_Shell` provides a semi-transparent holographic spatial silhouette (alpha $\approx 0.15 - 0.20$).
   - Raycasting is explicitly disabled on the outer shell (`raycast = () => null`) to prevent the translucent skin from intercepting clicks intended for deep visceral organs, skeletal structures, or neural pathways.
